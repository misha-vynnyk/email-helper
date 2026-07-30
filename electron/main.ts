import { app, BrowserWindow, dialog, ipcMain, Notification, screen, shell } from "electron";
import fsSync from "fs";
import fs from "fs/promises";
import type { Server } from "http";
import path from "path";

import { uploadFile } from "./upload/uploadManager";

// ── Embedded Express server ───────────────────────────────────────────────────

let serverInstance: Server | null = null;

async function startEmbeddedServer(): Promise<number> {
  // Expose userData path so Express routes can persist settings across restarts
  process.env.ELECTRON_USER_DATA = app.getPath("userData");

  // path resolves to <project-root>/server/index.js both in dev and packaged
  const serverPath = path.join(__dirname, "../../server/index.js");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic runtime path, not statically importable
  const { startServer } = require(serverPath) as { startServer: (port: number, host?: string) => Promise<Server> };

  const preferred = parseInt(process.env.PORT || "3001");

  for (let port = preferred; port <= preferred + 9; port++) {
    try {
      // Loopback-only: this embedded server backs our own renderer, not other machines on the LAN.
      serverInstance = await startServer(port, "127.0.0.1");
      console.log(`✅ Embedded server on port ${port}`);
      return port;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error("No free port found in range 3001-3010");
}

function stopEmbeddedServer(): void {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("dialog:openFolder", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:openFile", async (_event, filters) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: filters ?? [{ name: "All Files", extensions: ["*"] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.on("notification:show", (_event, { title, body }: { title: string; body: string }) => {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  });

  ipcMain.handle("file:saveToPath", async (event, { content, folderPath, fileName }: { content: string; folderPath: string; fileName: string }) => {
    try {
      const fullPath = path.join(folderPath, fileName);

      if (fsSync.existsSync(fullPath)) {
        const mainWin = BrowserWindow.fromWebContents(event.sender);
        const messageBoxOptions: Electron.MessageBoxOptions = {
          type: "warning",
          buttons: ["Замінити", "Скасувати"],
          defaultId: 1,
          cancelId: 1,
          title: "Файл вже існує",
          message: `Файл "${fileName}" вже існує в цій папці.`,
          detail: "Замінити його новою версією?",
        };
        const { response } = mainWin ? await dialog.showMessageBox(mainWin, messageBoxOptions) : await dialog.showMessageBox(messageBoxOptions);
        if (response !== 0) return { saved: false, canceled: true };
      }

      await fs.writeFile(fullPath, content, "utf8");
      return { saved: true, filePath: fullPath };
    } catch (err) {
      return { saved: false, error: (err as Error).message };
    }
  });

  ipcMain.handle("upload:executeFile", async (event, req) => {
    // ../../ from dist-electron/main/ → project root → automation/config.json
    const configPath = path.join(__dirname, "../../automation/config.json");
    let storageProviders: Record<string, unknown> = {};
    try {
      const raw = fsSync.readFileSync(configPath, "utf8");
      const fullConfig = JSON.parse(raw);
      storageProviders = fullConfig.storageProviders ?? {};
      if (fullConfig.storage?.baseUrl) {
        (storageProviders as Record<string, unknown>).consoleUrl = fullConfig.storage.baseUrl;
      }
      const scale = fullConfig.ui?.uploadWindowScale ?? 0.8;
      const mainWin = BrowserWindow.fromWebContents(event.sender);
      if (mainWin) {
        const { width, height } = mainWin.getBounds();
        (storageProviders as Record<string, unknown>).windowWidth = Math.round(width * scale);
        (storageProviders as Record<string, unknown>).windowHeight = Math.round(height * scale);
      }
      const ui = fullConfig.ui ?? {};
      if (ui.uploadCloseDelayMs !== undefined) (storageProviders as Record<string, unknown>).closeDelayMs = ui.uploadCloseDelayMs;
      if (ui.uploadIdleCloseMs !== undefined) (storageProviders as Record<string, unknown>).idleCloseMs = ui.uploadIdleCloseMs;
      if (ui.loginTimeoutMs !== undefined) (storageProviders as Record<string, unknown>).loginTimeoutMs = ui.loginTimeoutMs;
      if (ui.uploadCompletionTimeoutMs !== undefined) (storageProviders as Record<string, unknown>).uploadCompletionMs = ui.uploadCompletionTimeoutMs;
      const timeouts = fullConfig.timeouts ?? {};
      if (timeouts.elementWait !== undefined) (storageProviders as Record<string, unknown>).elementWaitMs = timeouts.elementWait;
      const retries = fullConfig.retries ?? {};
      if (retries.uploadAttempts !== undefined) (storageProviders as Record<string, unknown>).uploadAttempts = retries.uploadAttempts;
      const notif = fullConfig.notifications ?? {};
      (storageProviders as Record<string, unknown>).soundsEnabled = notif.soundsEnabled ?? notif.enabled ?? true;
      (storageProviders as Record<string, unknown>).sounds = notif.sounds ?? {};
    } catch (e) {
      return { success: false, error: `Cannot read automation/config.json: ${(e as Error).message}` };
    }
    return uploadFile(req, storageProviders);
  });
}

// ── Window state persistence ────────────────────────────────────────────────────

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

const DEFAULT_WINDOW_STATE: WindowState = { width: 1400, height: 900 };
const WINDOW_STATE_SAVE_DEBOUNCE_MS = 500;

function windowStatePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState(): WindowState {
  try {
    const raw = fsSync.readFileSync(windowStatePath(), "utf8");
    const state = JSON.parse(raw) as WindowState;
    if (typeof state.width !== "number" || typeof state.height !== "number") return DEFAULT_WINDOW_STATE;

    // Discard a remembered position that no longer lands on any connected display
    // (e.g. an external monitor was unplugged) — Electron would otherwise open the
    // window off-screen and unreachable.
    if (typeof state.x === "number" && typeof state.y === "number") {
      const onScreen = screen.getAllDisplays().some(({ workArea }) => state.x! >= workArea.x && state.y! >= workArea.y && state.x! < workArea.x + workArea.width && state.y! < workArea.y + workArea.height);
      if (!onScreen) {
        state.x = undefined;
        state.y = undefined;
      }
    }
    return state;
  } catch {
    return DEFAULT_WINDOW_STATE;
  }
}

function saveWindowState(win: BrowserWindow): void {
  if (win.isDestroyed()) return;
  const isMaximized = win.isMaximized();
  // getNormalBounds() so a maximized window still remembers its restored size,
  // not the full-screen bounds it happens to occupy right now.
  const { width, height, x, y } = win.getNormalBounds();
  const state: WindowState = { width, height, x, y, isMaximized };
  try {
    fsSync.writeFileSync(windowStatePath(), JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save window state:", err);
  }
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  const savedState = loadWindowState();

  const win = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    minWidth: 400,
    minHeight: 400,
    title: "EmailHelper",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (savedState.isMaximized) win.maximize();

  let saveStateTimer: NodeJS.Timeout | null = null;
  const scheduleSaveState = () => {
    if (saveStateTimer) clearTimeout(saveStateTimer);
    saveStateTimer = setTimeout(() => saveWindowState(win), WINDOW_STATE_SAVE_DEBOUNCE_MS);
  };
  win.on("resize", scheduleSaveState);
  win.on("move", scheduleSaveState);
  win.on("close", () => {
    if (saveStateTimer) clearTimeout(saveStateTimer);
    saveWindowState(win);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIpcHandlers();
  const serverPort = await startEmbeddedServer().catch((err) => {
    console.error("❌ Embedded server failed to start:", err.message);
    return 3001; // fallback — renderer will show an error when API calls fail
  });
  // Make the actual port available to the preload script before the window loads
  process.env.ELECTRON_SERVER_PORT = String(serverPort);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopEmbeddedServer);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
