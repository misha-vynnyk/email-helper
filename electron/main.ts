import { app, BrowserWindow, shell, ipcMain, dialog, Notification } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";

function registerIpcHandlers(): void {
  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("dialog:openFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
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
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}

const PREFERRED_PORT = 3001;
let backendProcess: ChildProcess | null = null;

function isOurServerRunning(port: number): Promise<boolean> {
  const http = require("http") as typeof import("http");
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

function findFreePort(from: number): Promise<number> {
  const net = require("net") as typeof import("net");
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(from, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      if (from < 3010) resolve(findFreePort(from + 1));
      else reject(new Error("No free port found in range 3001-3010"));
    });
  });
}

function waitForServer(port: number, maxWaitMs = 30000): Promise<void> {
  const http = require("http") as typeof import("http");
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on("error", retry);
    };
    const retry = () => {
      if (Date.now() - start > maxWaitMs) return reject(new Error("Server start timeout"));
      setTimeout(check, 500);
    };
    check();
  });
}

async function startBackend(): Promise<void> {
  // Reuse if already running (e.g. previous session that wasn't cleaned up)
  if (await isOurServerRunning(PREFERRED_PORT)) {
    console.log(`✅ Reusing existing server on port ${PREFERRED_PORT}`);
    return;
  }

  const port = await findFreePort(PREFERRED_PORT);

  if (port !== PREFERRED_PORT) {
    console.log(`⚠️  Port ${PREFERRED_PORT} is taken by another app, using ${port}`);
  }

  const serverDir = path.join(__dirname, "../../server");
  const serverEntry = path.join(serverDir, "index.js");

  // Use system node in dev; packaged builds will handle this differently (Phase 6)
  const nodeBin = app.isPackaged ? process.execPath : "node";

  backendProcess = spawn(nodeBin, [serverEntry], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(port), NODE_ENV: process.env.NODE_ENV || "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  backendProcess.stdout?.on("data", (data: Buffer) => {
    console.log("[server]", data.toString().trim());
  });

  backendProcess.stderr?.on("data", (data: Buffer) => {
    console.error("[server:err]", data.toString().trim());
  });

  backendProcess.on("exit", (code) => {
    console.log(`[server] exited with code ${code}`);
    backendProcess = null;
  });

  await waitForServer(port);
}

function stopBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

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

app.whenReady().then(async () => {
  registerIpcHandlers();
  await startBackend().catch((err) => {
    console.error("❌ Backend failed to start:", err.message);
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopBackend);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
