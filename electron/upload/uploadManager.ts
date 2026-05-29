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
        // executeJavaScript can throw during page navigation (not just on window close).
        // Only stop polling if the window is actually gone — otherwise keep waiting.
        if (win.isDestroyed() || isCancelled()) {
          clearInterval(interval);
          reject(new Error(CANCEL_MSG));
        }
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
    const folderPrefix = providerCfg.folderPrefix       as string ?? "lift-";

    // Format folder name the same way as the Brave automation:
    // "ABCD1234" → letters="abcd", digits="1234" → "abcd/lift-1234"
    const letters       = req.folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits        = req.folderName.replace(/[^0-9]/g, "");
    const formattedName = `${letters}/${folderPrefix}${digits}`;
    const category      = req.category ? req.category.toLowerCase() : "";

    // MinIO Console expects the full sub-path encoded as one segment with %2F separators,
    // matching the Brave automation: encodeURIComponent(consolePath) + "%2F"
    const consolePath = [consoleRoot, category, formattedName].filter(Boolean).join("/");
    const consoleHost = (storageConfig as Record<string, string>).consoleUrl ?? "http://localhost:9001";
    const targetUrl   = `${consoleHost}/browser/${bucket}/${encodeURIComponent(consolePath)}%2F`;

    // ── Step 1: Initial page load ─────────────────────────────────────────────
    uploadWindow.setTitle("Storage — підключення...");
    try {
      await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: (err as Error).message };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    // ── Step 2: Wait for upload UI (handles login automatically) ─────────────
    // Instead of detecting login state via fragile selectors, always wait for
    // #upload-main with a generous timeout. If the user is already authenticated
    // the element appears immediately; if not, they have time to log in.
    uploadWindow.setTitle("Storage — якщо потрібно, увійдіть (вікно закриється автоматично)");

    try {
      await waitForSelector(uploadWindow, "#upload-main", 600_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано — вікно закрито під час авторизації" };
      return { success: false, error: "Timeout (10 хв) — кнопка завантаження не з'явилась. Перевірте, чи вдалось увійти у сховище" };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    // After login MinIO may redirect to /browser root — re-navigate to target folder
    const currentUrl: string = await uploadWindow.webContents.executeJavaScript(`window.location.href`).catch(() => "");
    if (!currentUrl.includes(bucket)) {
      uploadWindow.setTitle("Storage — навігація до папки...");
      try {
        await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
        await sleep(uploadWindow, 2_000);
      } catch {
        // Non-fatal: React Router may have already navigated client-side
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
      const publicPath = [publicRoot, category, formattedName, filename].filter(Boolean).join("/");
      return { success: true, publicUrl: `${publicBase}/${publicPrefix}/${publicPath}`, filePath: publicPath };
    }

    // ── Step 4: Open upload menu ──────────────────────────────────────────────
    uploadWindow.setTitle("Storage — завантаження файлу...");

    // #upload-main already confirmed present above — click it directly
    await uploadWindow.webContents.executeJavaScript(`document.querySelector('#upload-main').click()`);

    try {
      await waitForSelector(uploadWindow, 'div[label="Upload File"]', 5_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: "Меню завантаження не відкрилось — можливо, змінився UI сховища" };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    // ── Step 5: Set file via CDP — intercept file chooser before OS dialog opens ─
    // Mirrors how Playwright handles filechooser: enable interception first,
    // then click the button; CDP fires fileChooserOpened instead of opening Finder.
    const dbg = uploadWindow.webContents.debugger;
    try {
      dbg.attach("1.3");
      debuggerAttached = true;
    } catch {
      return { success: false, error: "Не вдалось підключити CDP debugger — спробуйте ще раз" };
    }

    try {
      // Suppress the OS file picker dialog
      await dbg.sendCommand("Page.setInterceptFileChooserDialog", { enabled: true });

      // Listen for the fileChooserOpened CDP event
      let fileChooserBackendNodeId: number | null = null;
      const msgHandler = (_e: unknown, method: string, params: Record<string, unknown>) => {
        if (method === "Page.fileChooserOpened") {
          fileChooserBackendNodeId = params.backendNodeId as number;
        }
      };
      dbg.on("message", msgHandler);

      // Click "Upload File" — OS dialog is suppressed, CDP event fires instead
      await uploadWindow.webContents.executeJavaScript(
        `document.querySelector('div[label="Upload File"]').click()`
      );

      // Wait for the fileChooserOpened event
      const backendNodeId = await new Promise<number>((resolve, reject) => {
        const deadline = setTimeout(() => reject(new Error("File chooser не відкрився (5s timeout)")), 5_000);
        const check = setInterval(() => {
          if (fileChooserBackendNodeId !== null) {
            clearInterval(check);
            clearTimeout(deadline);
            resolve(fileChooserBackendNodeId!);
          }
          if (isCancelled()) {
            clearInterval(check);
            clearTimeout(deadline);
            reject(new Error(CANCEL_MSG));
          }
        }, 50);
      });

      dbg.removeListener("message", msgHandler);

      // Set the file directly — no dialog, no Finder
      await dbg.sendCommand("DOM.setFileInputFiles", {
        backendNodeId,
        files: [req.tempPath],
      });

      await dbg.sendCommand("Page.setInterceptFileChooserDialog", { enabled: false });
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: `CDP помилка при завантаженні файлу: ${(err as Error).message}` };
    } finally {
      try { dbg.detach(); debuggerAttached = false; } catch {}
    }

    // ── Step 6: Wait for file to appear in directory listing ─────────────────
    // MinIO's upload progress dialog (.uploaded-list) appears and disappears
    // quickly — unreliable to poll. Instead wait for the filename to show up
    // in the directory (.fileNameText), confirming the upload completed.
    uploadWindow.setTitle("Storage — очікування завершення...");

    const appeared = await new Promise<boolean>((resolve) => {
      const deadline = Date.now() + 60_000;
      const interval = setInterval(async () => {
        if (isCancelled() || uploadWindow.isDestroyed()) {
          clearInterval(interval);
          resolve(false);
          return;
        }
        try {
          const found: boolean = await uploadWindow.webContents.executeJavaScript(
            `Array.from(document.querySelectorAll('.fileNameText')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
          );
          if (found) { clearInterval(interval); resolve(true); return; }
          if (Date.now() > deadline) { clearInterval(interval); resolve(false); }
        } catch {
          if (uploadWindow.isDestroyed() || isCancelled()) {
            clearInterval(interval);
            resolve(false);
          }
        }
      }, 500);
    });

    if (isCancelled()) return { success: false, error: "Upload скасовано під час передачі файлу" };
    if (!appeared) return { success: false, error: "Timeout (60s) — файл не з'явився в директорії. Перевірте інтернет та спробуйте ще раз" };

    const publicPath = [publicRoot, category, formattedName, filename].filter(Boolean).join("/");
    const publicUrl  = `${publicBase}/${publicPrefix}/${publicPath}`;

    // Brief pause so the user can see the completed upload before the window closes
    const closeDelayMs = (storageConfig as Record<string, number>).closeDelayMs ?? 1500;
    uploadWindow.setTitle(`✅ Завантажено — вікно закриється автоматично`);
    await sleep(uploadWindow, closeDelayMs);

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
