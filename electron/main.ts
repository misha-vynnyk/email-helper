import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";

let backendProcess: ChildProcess | null = null;

function startBackend(): Promise<void> {
  return new Promise((resolve) => {
    const serverDir = path.join(__dirname, "../../server");
    const serverEntry = path.join(serverDir, "index.js");

    backendProcess = spawn(process.execPath, [serverEntry], {
      cwd: serverDir,
      env: { ...process.env, PORT: "3001", NODE_ENV: process.env.NODE_ENV || "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    backendProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      console.log("[server]", msg);
      if (msg.includes("running on port")) resolve();
    });

    backendProcess.stderr?.on("data", (data: Buffer) => {
      console.error("[server:err]", data.toString().trim());
    });

    backendProcess.on("exit", (code) => {
      console.log(`[server] exited with code ${code}`);
      backendProcess = null;
    });

    // Resolve after timeout in case the ready message never comes
    setTimeout(resolve, 3000);
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
