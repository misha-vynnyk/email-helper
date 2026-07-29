import { execFileSync } from "child_process";
import { app,BrowserWindow, session } from "electron";
import fs from "fs";
import path from "path";

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
  skipped?: boolean; // true when file already existed (duplicate)
  cancelled?: boolean; // true when the user closed the upload window mid-flight
}

const CANCEL_MSG = "cancelled";

// All cancel paths funnel through here so the renderer can reliably tell a
// user-initiated window close apart from a normal upload error (which it
// can't do by matching localized `error` text).
function cancelResult(message = "Upload скасовано"): UploadResult {
  return { success: false, cancelled: true, error: message };
}

// ── Session state ─────────────────────────────────────────────────────────────
// One persistent window per provider. Reused across uploads to avoid repeated
// login. Destroyed after IDLE_CLOSE_MS of inactivity.

interface ProviderSession {
  window: BrowserWindow;
  closeTimer: ReturnType<typeof setTimeout> | null;
}
const activeSessions = new Map<string, ProviderSession>();

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

function playSound(type: "success" | "error" | "warning", storageConfig: Record<string, unknown>): void {
  if (process.platform !== "darwin") return;
  if (!storageConfig.soundsEnabled) return;
  const sounds = storageConfig.sounds as Record<string, string> | undefined;
  const file = sounds?.[type];
  if (!file) return;
  try { execFileSync("afplay", [file], { stdio: "ignore" }); } catch {}
}

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

// Storage console UI markers — kept in one place since both the Electron path
// here and automation/scripts/lib/storage.js (Playwright path) target the same
// frontend and need to stay in sync if it changes again.
const UPLOAD_BUTTON_SELECTOR = "button:has(svg.lucide-cloud-upload)";
const DIALOG_SELECTOR = '[role="dialog"]';
const DROPZONE_TEXT = "Drag & Drop files here or click to select";

// Wraps loadURL with a hard timeout and handles network-level errors.
// ERR_ABORTED (-3) is treated as success because the storage console is an SPA
// that may fire did-fail-load for the original URL when doing a client-side redirect.
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
      if (isCancelled()) reject(new Error(CANCEL_MSG));
      else resolve();
    });

    win.webContents.once("did-fail-load", (_e, code, desc) => {
      cleanup();
      if (code === -3) { resolve(); return; } // ERR_ABORTED = redirect in progress
      reject(new Error(networkErrorMessage(code, desc)));
    });

    win.loadURL(url).catch((err) => { cleanup(); reject(err); });
  });
}

// Polls a JS expression evaluated in the page up to timeoutMs, resolving with
// its first truthy value. Respects isCancelled and gracefully handles the case
// where the window was closed or navigated away mid-poll.
function waitForCondition(
  win: BrowserWindow,
  jsExpression: string,
  timeoutMs: number,
  isCancelled: () => boolean,
  timeoutMessage: string
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(async () => {
      if (isCancelled()) {
        clearInterval(interval);
        reject(new Error(CANCEL_MSG));
        return;
      }
      try {
        const value = await win.webContents.executeJavaScript(jsExpression);
        if (value) {
          clearInterval(interval);
          resolve(value);
        } else if (Date.now() > deadline) {
          clearInterval(interval);
          reject(new Error(timeoutMessage));
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

// Polls for a CSS selector up to timeoutMs.
function waitForSelector(
  win: BrowserWindow,
  selector: string,
  timeoutMs: number,
  isCancelled: () => boolean
): Promise<void> {
  return waitForCondition(
    win,
    `!!document.querySelector(${JSON.stringify(selector)})`,
    timeoutMs,
    isCancelled,
    `Елемент "${selector}" не з'явився за ${timeoutMs / 1000}s`
  ) as Promise<void>;
}

// Races the storage toolbar becoming ready against the app full-navigating to
// its /login route (unauthenticated session) — mirrors the same race in
// automation/scripts/lib/storage.js's waitForStorageReady.
function waitForReadyOrLogin(
  win: BrowserWindow,
  timeoutMs: number,
  isCancelled: () => boolean
): Promise<"ready" | "login"> {
  return waitForCondition(
    win,
    `(() => {
      if (location.pathname.startsWith("/login")) return "login";
      if (document.querySelector(${JSON.stringify(UPLOAD_BUTTON_SELECTOR)})) return "ready";
      return null;
    })()`,
    timeoutMs,
    isCancelled,
    `UI сховища не завантажилось за ${timeoutMs / 1000}s`
  ) as Promise<"ready" | "login">;
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

  const cfg = storageConfig as Record<string, number>;
  const closeDelay          = cfg.closeDelayMs       ?? 1500;
  const windowWidth         = cfg.windowWidth        ?? 1200;
  const windowHeight        = cfg.windowHeight       ?? 800;
  const idleCloseMs         = cfg.idleCloseMs        ?? 4_000;
  const loginTimeoutMs      = Number(providerCfg.loginWaitMs ?? cfg.loginTimeoutMs ?? 600_000);
  const bootstrapWaitMs     = Number(providerCfg.bootstrapWaitMs ?? 30_000);
  const uploadCompletionMs  = cfg.uploadCompletionMs ?? 60_000;
  const elementWaitMs       = cfg.elementWaitMs      ?? 5_000;
  const uploadAttempts      = cfg.uploadAttempts     ?? 1;

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
      show: false,
      webPreferences: {
        session: getProviderSession(req.provider),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    activeSessions.set(req.provider, { window: uploadWindow, closeTimer: null });
  }

  // Bring window to front. On macOS, focus() alone is not enough when the
  // main window holds focus — app.focus({ steal: true }) + moveTop() are
  // needed to guarantee the upload window appears above the main window.
  if (!uploadWindow.isDestroyed()) {
    app.focus({ steal: true });
    uploadWindow.show();
    uploadWindow.focus();
    uploadWindow.moveTop();
  }

  let cancelled = false;
  uploadWindow.once("closed", () => {
    cancelled = true;
    activeSessions.delete(req.provider);
  });
  const isCancelled = () => cancelled;

  let debuggerAttached = false;
  let keepWindowOpen   = false; // set to true on success so finally doesn't destroy
  let uploadSucceeded  = false;
  let isDuplicate      = false;

  try {
    const consoleRoot  = providerCfg.consoleRootPrefix  as string ?? "";
    const bucket       = providerCfg.bucket             as string ?? "";
    const publicBase   = providerCfg.publicBaseUrl      as string ?? "";
    const publicPrefix = providerCfg.publicPathPrefix   as string ?? "files";
    const publicRoot   = providerCfg.publicRootPrefix   as string ?? "";

    const folderPrefix   = providerCfg.folderPrefix  as string ?? "lift-";
    const usesCategory   = !!(providerCfg.usesCategory);
    const effectiveCat   = usesCategory ? req.category : "";
    const letters        = req.folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits         = req.folderName.replace(/[^0-9]/g, "");
    const formattedName  = letters && digits ? `${letters}/${folderPrefix}${digits}` : req.folderName.toLowerCase();

    const folderPath  = [consoleRoot, effectiveCat, formattedName].filter(Boolean).join("/");
    const consoleHost = (storageConfig as Record<string, string>).consoleUrl ?? "http://localhost:9001";
    const targetUrl   = `${consoleHost}/bucket/${bucket}/${folderPath}`;

    if (!reuseWindow) {
      // ── Step 1: Initial page load ───────────────────────────────────────
      uploadWindow.setTitle("Storage — підключення...");
      try {
        await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        return { success: false, error: (err as Error).message };
      }

      if (isCancelled()) return cancelResult();

      // ── Step 2: Ready vs. login-required — the app full-navigates to its
      // own /login route when unauthenticated (no in-page login button) ───
      uploadWindow.setTitle("Storage — перевірка стану...");
      let state: "ready" | "login";
      try {
        state = await waitForReadyOrLogin(uploadWindow, bootstrapWaitMs, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        return { success: false, error: `Timeout (${Math.round(bootstrapWaitMs / 1000)}s) — UI сховища не завантажилось. Перевірте VPN/доступність сервера.` };
      }
      if (isCancelled()) return cancelResult();

      if (state === "login") {
        // Login is always done manually (SSO opens its own window) — just wait
        // for the toolbar to reappear, with a generous timeout.
        uploadWindow.setTitle("Storage — якщо потрібно, увійдіть (вікно закриється автоматично)");
        try {
          await waitForSelector(uploadWindow, UPLOAD_BUTTON_SELECTOR, loginTimeoutMs, isCancelled);
        } catch (err) {
          if (isCancelError(err)) return cancelResult("Upload скасовано — вікно закрито під час авторизації");
          return { success: false, error: "Timeout (10 хв) — кнопка завантаження не з'явилась. Перевірте, чи вдалось увійти у сховище" };
        }

        if (isCancelled()) return cancelResult();

        // The app's callbackUrl should return us to the target folder automatically —
        // re-navigate defensively in case it landed somewhere else instead.
        const afterLoginUrl: string = await uploadWindow.webContents.executeJavaScript(`window.location.href`).catch(() => "");
        if (!afterLoginUrl.includes(bucket)) {
          uploadWindow.setTitle("Storage — навігація до папки...");
          try {
            await loadUrlWithTimeout(uploadWindow, targetUrl, 30_000, isCancelled);
            await sleep(uploadWindow, 2_000);
          } catch {
            // Non-fatal: the app may already have client-side routed there
          }
          if (isCancelled()) return cancelResult();
        }
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
          if (isCancelError(err)) return cancelResult();
          return { success: false, error: (err as Error).message };
        }
        if (isCancelled()) return cancelResult();
      }

      // Verify we're still authenticated (session could have expired)
      let state: "ready" | "login";
      try {
        state = await waitForReadyOrLogin(uploadWindow, bootstrapWaitMs, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        return { success: false, error: "Сесія сховища закінчилась — спробуйте ще раз (відкриється вікно входу)" };
      }
      if (isCancelled()) return cancelResult();

      if (state === "login") {
        uploadWindow.setTitle("Storage — сесія закінчилась, увійдіть вручну (вікно закриється автоматично)");
        try {
          await waitForSelector(uploadWindow, UPLOAD_BUTTON_SELECTOR, loginTimeoutMs, isCancelled);
        } catch (err) {
          if (isCancelError(err)) return cancelResult("Upload скасовано — вікно закрито під час авторизації");
          return { success: false, error: "Timeout (10 хв) — кнопка завантаження не з'явилась. Перевірте, чи вдалось увійти у сховище" };
        }
        if (isCancelled()) return cancelResult();
      }
    }

    // ── Step 3: Duplicate check ─────────────────────────────────────────────
    uploadWindow.setTitle("Storage — перевірка дублікатів...");
    const filename = path.basename(req.tempPath);

    const fileExists: boolean = await uploadWindow.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('tr[data-slot="table-row"] span.truncate')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
    ).catch(() => false);

    if (fileExists) {
      const publicPath = [publicRoot, effectiveCat, formattedName, filename].filter(Boolean).join("/");
      isDuplicate = true;
      keepWindowOpen = true;
      uploadWindow.setTitle("Storage — файл вже існує");
      scheduleSessionClose(req.provider, idleCloseMs);
      return { success: true, skipped: true, publicUrl: `${publicBase}/${publicPrefix}/${publicPath}`, filePath: publicPath };
    }

    // ── Steps 4-6: Upload with retry ───────────────────────────────────────
    const checkInListing = () => uploadWindow.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('tr[data-slot="table-row"] span.truncate')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
    ).catch(() => false) as Promise<boolean>;

    let uploaded = false;
    let uploadError = "";

    attemptLoop: for (let attempt = 1; attempt <= uploadAttempts; attempt++) {
      if (attempt > 1) {
        uploadWindow.setTitle(`Storage — повтор ${attempt}/${uploadAttempts}...`);
        await sleep(uploadWindow, 2_000);
        if (isCancelled()) return cancelResult();
        uploaded = await checkInListing();
        if (uploaded) break;
      }

      // ── Step 4: Open the upload dialog ────────────────────────────────────
      uploadWindow.setTitle("Storage — завантаження файлу...");
      await uploadWindow.webContents.executeJavaScript(
        `document.querySelector(${JSON.stringify(UPLOAD_BUTTON_SELECTOR)})?.click()`
      );

      try {
        await waitForSelector(uploadWindow, DIALOG_SELECTOR, elementWaitMs, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        uploadError = "Діалог завантаження не відкрився — можливо, змінився UI сховища";
        continue attemptLoop;
      }
      if (isCancelled()) return cancelResult();

      // ── Step 5: Attach debugger and suppress native file dialog ───────────
      // Must happen BEFORE clicking the dropzone so the OS file picker (Finder
      // on macOS) never appears. Page.setInterceptFileChooserDialog tells
      // Chromium to suppress the native dialog — identical to what Playwright's
      // page.waitForEvent("filechooser") does internally.
      const dbg = uploadWindow.webContents.debugger;
      try {
        dbg.attach("1.3");
        debuggerAttached = true;
        await dbg.sendCommand("Page.setInterceptFileChooserDialog", { enabled: true });
      } catch {
        uploadError = "Не вдалось підключити CDP debugger — спробуйте ще раз";
        continue attemptLoop;
      }

      // Click the dropzone inside the dialog — it wraps a hidden <input type="file">.
      await uploadWindow.webContents.executeJavaScript(`
        (() => {
          const dialog = document.querySelector(${JSON.stringify(DIALOG_SELECTOR)});
          const dropzone = dialog && Array.from(dialog.querySelectorAll("*"))
            .find((el) => el.children.length === 0 && el.textContent && el.textContent.trim() === ${JSON.stringify(DROPZONE_TEXT)});
          if (dropzone) dropzone.click();
        })()
      `);

      try {
        await waitForSelector(uploadWindow, `${DIALOG_SELECTOR} input[type="file"]`, elementWaitMs, isCancelled);
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        uploadError = "Поле вибору файлу не з'явилось — можливо, змінився UI сховища";
        continue attemptLoop;
      }

      // ── Step 6: Set file via CDP, then confirm the upload inside the dialog ─
      try {
        const { root } = await dbg.sendCommand("DOM.getDocument");
        const { nodeId } = await dbg.sendCommand("DOM.querySelector", {
          nodeId: root.nodeId,
          selector: `${DIALOG_SELECTOR} input[type="file"]`,
        });
        if (!nodeId) {
          uploadError = "Поле вибору файлу не знайдено на сторінці";
          continue attemptLoop;
        }
        await dbg.sendCommand("DOM.setFileInputFiles", { nodeId, files: [req.tempPath] });
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        uploadError = `CDP помилка при завантаженні файлу: ${(err as Error).message}`;
        continue attemptLoop;
      } finally {
        try {
          await dbg.sendCommand("Page.setInterceptFileChooserDialog", { enabled: false });
          dbg.detach();
          debuggerAttached = false;
        } catch {}
      }

      // The dialog shows the picked filename and enables its own confirm "Upload"
      // button (distinct element from the toolbar button that opened the dialog).
      try {
        await waitForCondition(
          uploadWindow,
          `(() => {
            const dialog = document.querySelector(${JSON.stringify(DIALOG_SELECTOR)});
            const btn = dialog && Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent.trim() === "Upload");
            return !!(btn && !btn.disabled);
          })()`,
          elementWaitMs,
          isCancelled,
          "Кнопка підтвердження завантаження не стала активною"
        );
      } catch (err) {
        if (isCancelError(err)) return cancelResult();
        uploadError = "Кнопка підтвердження завантаження не з'явилась — можливо, файл не обрався";
        continue attemptLoop;
      }
      if (isCancelled()) return cancelResult();

      await uploadWindow.webContents.executeJavaScript(`
        (() => {
          const dialog = document.querySelector(${JSON.stringify(DIALOG_SELECTOR)});
          const btn = dialog && Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent.trim() === "Upload");
          if (btn) btn.click();
        })()
      `);

      // ── Step 6: Wait for file to appear in folder listing ─────────────────
      uploadWindow.setTitle("Storage — очікування завершення...");
      const deadline = Date.now() + uploadCompletionMs;
      while (!uploaded) {
        if (isCancelled()) return cancelResult("Upload скасовано під час передачі файлу");
        if (Date.now() > deadline) {
          uploadError = `Timeout завантаження (${Math.round(uploadCompletionMs / 1000)}s) — файл міг не завантажитись. Перевірте інтернет та спробуйте ще раз`;
          break;
        }
        await sleep(uploadWindow, 1_000);
        uploaded = await checkInListing();
      }
      if (uploaded) break;
    }

    if (!uploaded) return { success: false, error: uploadError || "Upload не вдався" };

    const publicPath = [publicRoot, effectiveCat, formattedName, filename].filter(Boolean).join("/");
    const publicUrl  = `${publicBase}/${publicPrefix}/${publicPath}`;

    uploadSucceeded = true;
    keepWindowOpen = true;
    uploadWindow.setTitle("✅ Завантажено — вікно закриється автоматично");
    await sleep(uploadWindow, closeDelay);
    scheduleSessionClose(req.provider, idleCloseMs);

    return { success: true, publicUrl, filePath: publicPath };

  } catch (err) {
    if (isCancelled()) return cancelResult();
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (debuggerAttached) {
      try { uploadWindow.webContents.debugger.detach(); } catch {}
    }
    if (uploadSucceeded)  playSound("success", storageConfig);
    else if (isDuplicate) playSound("warning", storageConfig);
    else if (!cancelled)  playSound("error",   storageConfig);

    if (!keepWindowOpen) {
      // Error or cancel path — destroy window and clear session immediately
      clearSession(req.provider);
    }
  }
}
