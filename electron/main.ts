import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";

let backendProcess: ChildProcess | null = null;

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

function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverDir = path.join(__dirname, "../../server");
    const serverEntry = path.join(serverDir, "index.js");

    backendProcess = spawn(process.execPath, [serverEntry], {
      cwd: serverDir,
      env: { ...process.env, PORT: "3001", NODE_ENV: process.env.NODE_ENV || "production" },
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

    waitForServer(3001)
      .then(resolve)
      .catch(reject);
  });
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
  await startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopBackend);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
