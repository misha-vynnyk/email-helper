import { BrowserWindow, session } from "electron";
import path from "path";
import fs from "fs";

export interface UploadRequest {
  tempPath: string;
  provider: string;
  category: string;
  folderName: string;
}

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

const CANCEL_MSG = "cancelled";

function getProviderSession(provider: string) {
  return session.fromPartition(`persist:storage-${provider}`);
}

function networkErrorMessage(code: number, desc: string): string {
  switch (code) {
    case -6:   return "Сервер сховища недоступний — з'єднання відмовлено";
    case -7:   return "З'єднання перервано — перевірте інтернет";
    case -21:  return "Мережу змінено під час завантаження, спробуйте ще раз";
    case -105: return "Хост не знайдено — перевірте підключення до інтернету";
    case -106: return "Немає підключення до інтернету";
    case -200:
    case -501: return "Помилка SSL-сертифікату сховища";
    default:   return `Помилка мережі (${code}): ${desc}`;
  }
}

// Wraps loadURL with a hard timeout and handles network-level errors.
// ERR_ABORTED (-3) is treated as success because MinIO Console SPA
// may fire did-fail-load for the original URL when doing a JS/meta redirect.
function loadUrlWithTimeout(
  win: BrowserWindow,
  url: string,
  timeoutMs: number,
  isCancelled: () => boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout підключення до сховища (${timeoutMs / 1000}s) — сервер не відповідає`)),
      timeoutMs
    );
    const cleanup = () => clearTimeout(timer);

    win.webContents.once("did-finish-load", () => {
      cleanup();
      isCancelled() ? reject(new Error(CANCEL_MSG)) : resolve();
    });

    win.webContents.once("did-fail-load", (_e, code, desc) => {
      cleanup();
      if (code === -3) { resolve(); return; } // ERR_ABORTED = redirect in progress
      reject(new Error(networkErrorMessage(code, desc)));
    });

    win.loadURL(url).catch((err) => { cleanup(); reject(err); });
  });
}

// Polls for a CSS selector up to timeoutMs. Respects isCancelled flag
// and gracefully handles the case where the window was closed mid-poll.
function waitForSelector(
  win: BrowserWindow,
  selector: string,
  timeoutMs: number,
  isCancelled: () => boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(async () => {
      if (isCancelled()) {
        clearInterval(interval);
        reject(new Error(CANCEL_MSG));
        return;
      }
      try {
        const found = await win.webContents.executeJavaScript(
          `!!document.querySelector(${JSON.stringify(selector)})`
        );
        if (found) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() > deadline) {
          clearInterval(interval);
          reject(new Error(`Елемент "${selector}" не з'явився за ${timeoutMs / 1000}s`));
        }
      } catch {
        // executeJavaScript throws when webContents is destroyed (window closed)
        clearInterval(interval);
        reject(new Error(CANCEL_MSG));
      }
    }, 500);
  });
}

// Resolves after ms or immediately if window is closed (avoids hanging sleeps).
function sleep(win: BrowserWindow, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    win.once("closed", () => { clearTimeout(t); resolve(); });
  });
}

function isCancelError(err: unknown): boolean {
  return err instanceof Error && err.message === CANCEL_MSG;
}

export async function uploadFile(
  req: UploadRequest,
  storageConfig: Record<string, unknown>
): Promise<UploadResult> {
  if (!fs.existsSync(req.tempPath)) {
    return { success: false, error: `Файл не знайдено: ${req.tempPath}` };
  }

  const providerCfg = (storageConfig as Record<string, Record<string, unknown>>)[req.provider];
  if (!providerCfg) {
    return { success: false, error: `Невідомий провайдер: ${req.provider}` };
  }

  const windowWidth  = (storageConfig as Record<string, number>).windowWidth  ?? 1200;
  const windowHeight = (storageConfig as Record<string, number>).windowHeight ?? 800;

  const uploadWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    show: true,
    webPreferences: {
      session: getProviderSession(req.provider),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  let cancelled = false;
  uploadWindow.once("closed", () => { cancelled = true; });
  const isCancelled = () => cancelled;

  let debuggerAttached = false;

  try {
    const consoleRoot  = providerCfg.consoleRootPrefix  as string ?? "";
    const bucket       = providerCfg.bucket             as string ?? "";
    const publicBase   = providerCfg.publicBaseUrl      as string ?? "";
    const publicPrefix = providerCfg.publicPathPrefix   as string ?? "files";
    const publicRoot   = providerCfg.publicRootPrefix   as string ?? "";

    const folderPath  = [consoleRoot, req.category, req.folderName].filter(Boolean).join("/");
    const consoleHost = (storageConfig as Record<string, string>).consoleUrl ?? "http://localhost:9001";
    // Encode each segment individually so slashes remain path separators, not %2F
    const encodedPath = folderPath.split("/").map(encodeURIComponent).join("/");
    const targetUrl   = `${consoleHost}/browser/${bucket}/${encodedPath}/`;

    // ── Step 1: Initial page load ─────────────────────────────────────────────
    uploadWindow.setTitle("Storage — підключення...");
    try {
      await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: (err as Error).message };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    // ── Step 2: Login detection ───────────────────────────────────────────────
    const needsLogin: boolean = await uploadWindow.webContents.executeJavaScript(`
      !!(document.querySelector('button#go-to-login') ||
         document.querySelector('input[id="accessKey"]') ||
         document.querySelector('input[placeholder*="Access"]') ||
         document.querySelector('[class*="login-page"]'))
    `).catch(() => false);

    if (needsLogin) {
      uploadWindow.setTitle("Storage — увійдіть у браузері (вікно закриється автоматично)");

      try {
        // Wait up to 10 min for the user to complete login
        await waitForSelector(uploadWindow, "#upload-main", 600_000, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return { success: false, error: "Upload скасовано — вікно закрито під час авторизації" };
        return { success: false, error: "Timeout авторизації — вікно було відкрите понад 10 хвилин без входу" };
      }

      if (isCancelled()) return { success: false, error: "Upload скасовано" };

      // Re-navigate to the target folder after login
      uploadWindow.setTitle("Storage — навігація до папки...");
      try {
        await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
        // Give React Router time to render the folder contents
        await sleep(uploadWindow, 2_000);
      } catch {
        // Non-fatal: page may already be at the right location via client-side routing
      }

      if (isCancelled()) return { success: false, error: "Upload скасовано" };
    }

    // ── Step 3: Duplicate check ───────────────────────────────────────────────
    uploadWindow.setTitle("Storage — перевірка дублікатів...");
    const filename = path.basename(req.tempPath);

    const fileExists: boolean = await uploadWindow.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('.fileNameText')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
    ).catch(() => false);

    if (fileExists) {
      const publicPath = [publicRoot, req.category, req.folderName, filename].filter(Boolean).join("/");
      return { success: true, publicUrl: `${publicBase}/${publicPrefix}/${publicPath}`, filePath: publicPath };
    }

    // ── Step 4: Open upload menu ──────────────────────────────────────────────
    uploadWindow.setTitle("Storage — завантаження файлу...");

    try {
      await waitForSelector(uploadWindow, "#upload-main", 10_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: "Кнопка завантаження (#upload-main) не знайдена — сесія могла закінчитись або змінився UI сховища" };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    await uploadWindow.webContents.executeJavaScript(`document.querySelector('#upload-main').click()`);

    try {
      await waitForSelector(uploadWindow, 'div[label="Upload File"]', 5_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: "Меню завантаження не відкрилось — можливо, змінився UI сховища" };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    await uploadWindow.webContents.executeJavaScript(`document.querySelector('div[label="Upload File"]').click()`);

    // ── Step 5: Set file via CDP debugger ─────────────────────────────────────
    const dbg = uploadWindow.webContents.debugger;
    try {
      dbg.attach("1.3");
      debuggerAttached = true;
    } catch {
      return { success: false, error: "Не вдалось підключити CDP debugger — спробуйте ще раз" };
    }

    try {
      const { root } = await dbg.sendCommand("DOM.getDocument");
      const { nodeId } = await dbg.sendCommand("DOM.querySelector", {
        nodeId: root.nodeId,
        selector: 'input[type="file"]',
      });

      if (!nodeId) {
        return { success: false, error: "Поле вибору файлу не знайдено на сторінці" };
      }

      await dbg.sendCommand("DOM.setFileInputFiles", { nodeId, files: [req.tempPath] });
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: `CDP помилка при завантаженні файлу: ${(err as Error).message}` };
    } finally {
      try { dbg.detach(); debuggerAttached = false; } catch {}
    }

    // ── Step 6: Wait for upload to complete ───────────────────────────────────
    uploadWindow.setTitle("Storage — очікування завершення...");

    try {
      await waitForSelector(uploadWindow, ".uploaded-list .file-name", 60_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано під час передачі файлу" };
      return { success: false, error: "Timeout завантаження (60s) — файл міг не завантажитись. Перевірте інтернет та спробуйте ще раз" };
    }

    const publicPath = [publicRoot, req.category, req.folderName, filename].filter(Boolean).join("/");
    const publicUrl  = `${publicBase}/${publicPrefix}/${publicPath}`;

    return { success: true, publicUrl, filePath: publicPath };

  } catch (err) {
    if (isCancelled()) return { success: false, error: "Upload скасовано" };
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (debuggerAttached) {
      try { uploadWindow.webContents.debugger.detach(); } catch {}
    }
    if (!uploadWindow.isDestroyed()) uploadWindow.destroy();
  }
}
