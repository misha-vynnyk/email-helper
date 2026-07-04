import { execSync } from "child_process";
import { app, BrowserWindow, dialog, ipcMain, Notification,shell } from "electron";
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

  // In a packaged macOS/Linux app launched from Finder/Dock/desktop, PATH is
  // stripped — homebrew, nvm, volta, fnm paths are all absent.
  // Strategy:
  //   1. Ask the user's login shell ("which node") — covers nvm, volta, fnm, etc.
  //   2. Prepend well-known static paths as a fast fallback (homebrew, /usr/local).
  // We set NODE_EXEC_PATH so storageUpload.js's getNodeExec() picks it up, and
  // we also patch process.env.PATH so all other child processes benefit.
  if (process.platform === "darwin" || process.platform === "linux") {
    // Fast static fallback paths (no subprocess needed)
    const staticPaths =
      process.platform === "darwin"
        ? ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin"]
        : ["/usr/local/bin", "/usr/bin"];
    const current = process.env.PATH ?? "";
    const missing = staticPaths.filter((p) => !current.split(":").includes(p));
    if (missing.length > 0) {
      process.env.PATH = [...missing, current].join(":");
    }

    // Login-shell lookup — reliably finds nvm/volta/fnm managed node binaries.
    if (!process.env.NODE_EXEC_PATH) {
      try {
        const shell = process.env.SHELL || "/bin/zsh";
        const found = execSync(`${shell} -l -c "which node" 2>/dev/null`, { timeout: 5000 })
          .toString()
          .trim();
        if (found && fsSync.existsSync(found)) {
          process.env.NODE_EXEC_PATH = found;
          // Also ensure its directory is in PATH for other tools (npx, etc.)
          const dir = path.dirname(found);
          if (!process.env.PATH!.split(":").includes(dir)) {
            process.env.PATH = `${dir}:${process.env.PATH}`;
          }
        }
      } catch {
        // Login shell failed (rare). Static paths above are still in effect.
      }
    }
  }

  // path resolves to <project-root>/server/index.js both in dev and packaged
  const serverPath = path.join(__dirname, "../../server/index.js");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic runtime path, not statically importable
  const { startServer } = require(serverPath) as { startServer: (port: number) => Promise<Server> };

  const preferred = parseInt(process.env.PORT || "3001");

  for (let port = preferred; port <= preferred + 9; port++) {
    try {
      serverInstance = await startServer(port);
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

  ipcMain.handle("file:saveToPath", async (_event, { content, folderPath, fileName }: { content: string; folderPath: string; fileName: string }) => {
    try {
      const fullPath = path.join(folderPath, fileName);
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
