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

// ── Session state ─────────────────────────────────────────────────────────────
// One persistent window per provider. Reused across uploads to avoid repeated
// login. Destroyed after IDLE_CLOSE_MS of inactivity.

interface ProviderSession {
  window: BrowserWindow;
  closeTimer: ReturnType<typeof setTimeout> | null;
}
const activeSessions = new Map<string, ProviderSession>();
const IDLE_CLOSE_MS = 8_000;

function clearSession(provider: string): void {
  const s = activeSessions.get(provider);
  if (!s) return;
  if (s.closeTimer) clearTimeout(s.closeTimer);
  if (!s.window.isDestroyed()) s.window.destroy();
  activeSessions.delete(provider);
}

function scheduleSessionClose(provider: string, delayMs: number): void {
  const s = activeSessions.get(provider);
  if (!s) return;
  if (s.closeTimer) clearTimeout(s.closeTimer);
  s.closeTimer = setTimeout(() => {
    if (!s.window.isDestroyed()) s.window.destroy();
    activeSessions.delete(provider);
  }, delayMs);
}

// ─────────────────────────────────────────────────────────────────────────────

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

  const closeDelay   = (storageConfig as Record<string, number>).closeDelayMs ?? 1500;
  const windowWidth  = (storageConfig as Record<string, number>).windowWidth  ?? 1200;
  const windowHeight = (storageConfig as Record<string, number>).windowHeight ?? 800;

  // ── Acquire window (reuse or create) ─────────────────────────────────────
  const existing   = activeSessions.get(req.provider);
  const reuseWindow = !!(existing && !existing.window.isDestroyed());

  let uploadWindow: BrowserWindow;
  if (reuseWindow) {
    // Cancel pending idle-close so we don't destroy the window mid-upload
    if (existing!.closeTimer) { clearTimeout(existing!.closeTimer); existing!.closeTimer = null; }
    uploadWindow = existing!.window;
  } else {
    if (existing) activeSessions.delete(req.provider); // stale entry
    uploadWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      show: true,
      webPreferences: {
        session: getProviderSession(req.provider),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    activeSessions.set(req.provider, { window: uploadWindow, closeTimer: null });
  }

  let cancelled = false;
  uploadWindow.once("closed", () => {
    cancelled = true;
    activeSessions.delete(req.provider);
  });
  const isCancelled = () => cancelled;

  let debuggerAttached = false;
  let keepWindowOpen  = false; // set to true on success so finally doesn't destroy

  try {
    const consoleRoot  = providerCfg.consoleRootPrefix  as string ?? "";
    const bucket       = providerCfg.bucket             as string ?? "";
    const publicBase   = providerCfg.publicBaseUrl      as string ?? "";
    const publicPrefix = providerCfg.publicPathPrefix   as string ?? "files";
    const publicRoot   = providerCfg.publicRootPrefix   as string ?? "";

    const folderPrefix  = providerCfg.folderPrefix as string ?? "lift-";
    const letters       = req.folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits        = req.folderName.replace(/[^0-9]/g, "");
    const formattedName = letters && digits ? `${letters}/${folderPrefix}${digits}` : req.folderName.toLowerCase();

    const folderPath  = [consoleRoot, req.category, formattedName].filter(Boolean).join("/");
    const consoleHost = (storageConfig as Record<string, string>).consoleUrl ?? "http://localhost:9001";
    const targetUrl   = `${consoleHost}/browser/${bucket}/${encodeURIComponent(folderPath)}%2F`;

    if (!reuseWindow) {
      // ── Step 1: Initial page load ───────────────────────────────────────
      uploadWindow.setTitle("Storage — підключення...");
      try {
        await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
        return { success: false, error: (err as Error).message };
      }

      if (isCancelled()) return { success: false, error: "Upload скасовано" };

      // ── Step 2: Wait for upload UI (allows login) ───────────────────────
      // Always wait for #upload-main with a generous timeout so the user has
      // time to log in if needed. On subsequent uploads this is skipped.
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

    } else {
      // ── Reuse: navigate only if the folder has changed ──────────────────
      const currentUrl: string = await uploadWindow.webContents.executeJavaScript(`window.location.href`).catch(() => "");
      const onTarget = currentUrl.startsWith(targetUrl) || targetUrl.startsWith(currentUrl.replace(/\/$/, ""));

      if (!onTarget) {
        uploadWindow.setTitle("Storage — навігація до папки...");
        try {
          await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
        } catch (err) {
          if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
          return { success: false, error: (err as Error).message };
        }
        if (isCancelled()) return { success: false, error: "Upload скасовано" };
      }

      // Verify we're still authenticated (session could have expired)
      const uploadReady: boolean = await uploadWindow.webContents.executeJavaScript(
        `!!document.querySelector('#upload-main')`
      ).catch(() => false);

      if (!uploadReady) {
        try {
          await waitForSelector(uploadWindow, "#upload-main", 15_000, isCancelled);
        } catch (err) {
          if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
          return { success: false, error: "Сесія сховища закінчилась — спробуйте ще раз (відкриється вікно входу)" };
        }
      }

      if (isCancelled()) return { success: false, error: "Upload скасовано" };
    }

    // ── Step 3: Duplicate check ─────────────────────────────────────────────
    uploadWindow.setTitle("Storage — перевірка дублікатів...");
    const filename = path.basename(req.tempPath);

    const fileExists: boolean = await uploadWindow.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('.fileNameText')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
    ).catch(() => false);

    if (fileExists) {
      const publicPath = [publicRoot, req.category, formattedName, filename].filter(Boolean).join("/");
      keepWindowOpen = true;
      uploadWindow.setTitle("Storage — файл вже існує");
      scheduleSessionClose(req.provider, IDLE_CLOSE_MS);
      return { success: true, publicUrl: `${publicBase}/${publicPrefix}/${publicPath}`, filePath: publicPath };
    }

    // ── Step 4: Open upload menu ────────────────────────────────────────────
    uploadWindow.setTitle("Storage — завантаження файлу...");

    await uploadWindow.webContents.executeJavaScript(`document.querySelector('#upload-main').click()`);

    try {
      await waitForSelector(uploadWindow, 'div[label="Upload File"]', 5_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: "Меню завантаження не відкрилось — можливо, змінився UI сховища" };
    }

    if (isCancelled()) return { success: false, error: "Upload скасовано" };

    await uploadWindow.webContents.executeJavaScript(`document.querySelector('div[label="Upload File"]').click()`);

    // Wait for the file input to appear in the DOM (React renders it asynchronously)
    try {
      await waitForSelector(uploadWindow, 'input[type="file"]', 5_000, isCancelled);
    } catch (err) {
      if (isCancelError(err)) return { success: false, error: "Upload скасовано" };
      return { success: false, error: "Поле вибору файлу не з'явилось — можливо, змінився UI сховища" };
    }

    // ── Step 5: Set file via CDP debugger ───────────────────────────────────
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

    // ── Step 6: Wait for file to appear in folder listing ───────────────────
    uploadWindow.setTitle("Storage — очікування завершення...");

    const deadline = Date.now() + 60_000;
    let uploaded = false;
    while (!uploaded) {
      if (isCancelled()) return { success: false, error: "Upload скасовано під час передачі файлу" };
      if (Date.now() > deadline) {
        return { success: false, error: "Timeout завантаження (60s) — файл міг не завантажитись. Перевірте інтернет та спробуйте ще раз" };
      }
      await sleep(uploadWindow, 1_000);
      uploaded = await uploadWindow.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('.fileNameText')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
      ).catch(() => false);
    }

    const publicPath = [publicRoot, req.category, formattedName, filename].filter(Boolean).join("/");
    const publicUrl  = `${publicBase}/${publicPrefix}/${publicPath}`;

    keepWindowOpen = true;
    uploadWindow.setTitle("✅ Завантажено — вікно закриється автоматично");
    await sleep(uploadWindow, closeDelay);
    scheduleSessionClose(req.provider, IDLE_CLOSE_MS);

    return { success: true, publicUrl, filePath: publicPath };

  } catch (err) {
    if (isCancelled()) return { success: false, error: "Upload скасовано" };
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (debuggerAttached) {
      try { uploadWindow.webContents.debugger.detach(); } catch {}
    }
    if (!keepWindowOpen) {
      // Error or cancel path — destroy window and clear session immediately
      clearSession(req.provider);
    }
  }
}
