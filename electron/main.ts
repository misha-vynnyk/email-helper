import { app, BrowserWindow, shell, ipcMain, dialog, Notification } from "electron";
import path from "path";
import type { Server } from "http";
import { uploadFile } from "./upload/uploadManager";

// ── Embedded Express server ───────────────────────────────────────────────────

let serverInstance: Server | null = null;

async function startEmbeddedServer(): Promise<void> {
  // path resolves to <project-root>/server/index.js both in dev and packaged
  const serverPath = path.join(__dirname, "../../server/index.js");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startServer } = require(serverPath) as { startServer: (port: number) => Promise<Server> };

  const preferred = parseInt(process.env.PORT || "3001");

  for (let port = preferred; port <= preferred + 9; port++) {
    try {
      serverInstance = await startServer(port);
      console.log(`✅ Embedded server on port ${port}`);
      return;
    } catch (err: any) {
      if (err.code === "EADDRINUSE") {
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

  ipcMain.handle("upload:executeFile", async (event, req) => {
    // ../../ from dist-electron/main/ → project root → automation/config.json
    const configPath = path.join(__dirname, "../../automation/config.json");
    let storageProviders: Record<string, unknown> = {};
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const raw = require("fs").readFileSync(configPath, "utf8");
      const fullConfig = JSON.parse(raw);
      storageProviders = fullConfig.storageProviders ?? {};
      if (fullConfig.storage?.baseUrl) {
        (storageProviders as Record<string, unknown>).consoleUrl = fullConfig.storage.baseUrl;
      }
      const scale = fullConfig.ui?.uploadWindowScale ?? 0.8;
      const mainWin = BrowserWindow.fromWebContents(event.sender);
      if (mainWin) {
        const { width, height } = mainWin.getBounds();
        (storageProviders as Record<string, unknown>).windowWidth  = Math.round(width  * scale);
        (storageProviders as Record<string, unknown>).windowHeight = Math.round(height * scale);
      }
      const ui = fullConfig.ui ?? {};
      if (ui.uploadCloseDelayMs        !== undefined) (storageProviders as Record<string, unknown>).closeDelayMs       = ui.uploadCloseDelayMs;
      if (ui.uploadIdleCloseMs         !== undefined) (storageProviders as Record<string, unknown>).idleCloseMs        = ui.uploadIdleCloseMs;
      if (ui.loginTimeoutMs            !== undefined) (storageProviders as Record<string, unknown>).loginTimeoutMs     = ui.loginTimeoutMs;
      if (ui.uploadCompletionTimeoutMs !== undefined) (storageProviders as Record<string, unknown>).uploadCompletionMs = ui.uploadCompletionTimeoutMs;
      const timeouts = fullConfig.timeouts ?? {};
      if (timeouts.elementWait !== undefined) (storageProviders as Record<string, unknown>).elementWaitMs = timeouts.elementWait;
      const retries = fullConfig.retries ?? {};
      if (retries.uploadAttempts !== undefined) (storageProviders as Record<string, unknown>).uploadAttempts = retries.uploadAttempts;
      const notif = fullConfig.notifications ?? {};
      (storageProviders as Record<string, unknown>).soundsEnabled = notif.soundsEnabled ?? notif.enabled ?? true;
      (storageProviders as Record<string, unknown>).sounds        = notif.sounds ?? {};
    } catch (e) {
      return { success: false, error: `Cannot read automation/config.json: ${(e as Error).message}` };
    }
    return uploadFile(req, storageProviders);
  });
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "FlexiBuilder Pro",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
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
  await startEmbeddedServer().catch((err) => {
    console.error("❌ Embedded server failed to start:", err.message);
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopEmbeddedServer);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
