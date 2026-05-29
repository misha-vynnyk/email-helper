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

// Separate persistent session per storage provider (survives app restarts)
function getProviderSession(provider: string) {
  return session.fromPartition(`persist:storage-${provider}`);
}

function waitForSelector(win: BrowserWindow, selector: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(async () => {
      try {
        const found = await win.webContents.executeJavaScript(
          `!!document.querySelector(${JSON.stringify(selector)})`
        );
        if (found) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() > deadline) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for ${selector}`));
        }
      } catch {
        clearInterval(interval);
        reject(new Error(`Error waiting for ${selector}`));
      }
    }, 500);
  });
}

export async function uploadFile(req: UploadRequest, storageConfig: Record<string, unknown>): Promise<UploadResult> {
  if (!fs.existsSync(req.tempPath)) {
    return { success: false, error: `Temp file not found: ${req.tempPath}` };
  }

  const providerCfg = (storageConfig as Record<string, Record<string, unknown>>)[req.provider];
  if (!providerCfg) {
    return { success: false, error: `Unknown provider: ${req.provider}` };
  }

  const providerSession = getProviderSession(req.provider);

  const uploadWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      session: providerSession,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const consoleRoot = providerCfg.consoleRootPrefix as string ?? "";
    const bucket = providerCfg.bucket as string ?? "";
    const publicBase = providerCfg.publicBaseUrl as string ?? "";
    const publicPrefix = providerCfg.publicPathPrefix as string ?? "files";
    const publicRoot = providerCfg.publicRootPrefix as string ?? "";

    // Build target URL — MinIO Console path
    const folderPath = [consoleRoot, req.category, req.folderName].filter(Boolean).join("/");
    const consoleHost = (storageConfig as Record<string, string>).consoleUrl ?? "http://localhost:9001";
    const targetUrl = `${consoleHost}/browser/${bucket}/${encodeURIComponent(folderPath)}/`;

    await uploadWindow.loadURL(targetUrl);

    // Wait up to 60 s for login or main upload area
    const needsLogin = await uploadWindow.webContents.executeJavaScript(
      `!!document.querySelector('button#go-to-login')`
    );

    if (needsLogin) {
      uploadWindow.show();
      uploadWindow.setTitle("Storage — увійдіть та закрийте це вікно");
      await waitForSelector(uploadWindow, "#upload-main", 600_000);
      uploadWindow.hide();
    }

    // Check for duplicate
    const filename = path.basename(req.tempPath);
    const fileExists = await uploadWindow.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('.fileNameText')).some(el => el.textContent.trim() === ${JSON.stringify(filename)})`
    );

    if (fileExists) {
      const publicPath = [publicRoot, req.category, req.folderName, filename].filter(Boolean).join("/");
      const publicUrl = `${publicBase}/${publicPrefix}/${publicPath}`;
      return { success: true, publicUrl, filePath: publicPath };
    }

    // Trigger upload button
    await waitForSelector(uploadWindow, "#upload-main", 10_000);
    await uploadWindow.webContents.executeJavaScript(`document.querySelector('#upload-main').click()`);
    await waitForSelector(uploadWindow, 'div[label="Upload File"]', 5_000);
    await uploadWindow.webContents.executeJavaScript(`document.querySelector('div[label="Upload File"]').click()`);

    // Set file via CDP
    const dbg = uploadWindow.webContents.debugger;
    dbg.attach("1.3");
    const { root } = await dbg.sendCommand("DOM.getDocument");
    const { nodeId } = await dbg.sendCommand("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: 'input[type="file"]',
    });
    await dbg.sendCommand("DOM.setFileInputFiles", { nodeId, files: [req.tempPath] });
    dbg.detach();

    // Wait for upload to complete (progress bar disappears)
    await waitForSelector(uploadWindow, ".uploaded-list .file-name", 60_000);

    const publicPath = [publicRoot, req.category, req.folderName, filename].filter(Boolean).join("/");
    const publicUrl = `${publicBase}/${publicPrefix}/${publicPath}`;

    return { success: true, publicUrl, filePath: publicPath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    uploadWindow.destroy();
  }
}
