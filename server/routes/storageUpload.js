const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");
const router = express.Router();

let sharedStorageProviders = null;
try {
  sharedStorageProviders = require("../../src/htmlConverter/storageProviders.json");
} catch {
  // optional
}

// Configure multer for temporary file storage
const upload = multer({
  dest: path.join(os.tmpdir(), "email-helper-uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Ensure temp directory exists
const tempDir = path.join(os.tmpdir(), "email-helper-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * POST /api/storage-upload/prepare
 * Save uploaded file temporarily before uploading to storage
 *
 * Form Data:
 * - file: The image file to upload
 * - category: 'finance' or 'health'
 * - folderName: folder name (e.g., "ABCD123")
 */
router.post("/api/storage-upload/prepare", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Get original filename and create proper temp path with original name
    const originalName = req.file.originalname;

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(originalName);
    // Create unique temp directory to ensure no collisions (avoids stale files "banner-1.png")
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const uniqueDir = path.join(tempDir, uniqueId);
    if (!fs.existsSync(uniqueDir)) {
      fs.mkdirSync(uniqueDir, { recursive: true });
    }
    const finalPath = path.join(uniqueDir, safeName);

    // No need for collision check loop as dir is unique

    // Rename file from hash to original filename
    fs.renameSync(req.file.path, finalPath);

    console.log(`📁 File prepared: ${safeName} -> ${finalPath}`);

    res.json({
      success: true,
      tempPath: finalPath,
      filename: path.basename(finalPath),
    });
  } catch (error) {
    console.error("Prepare error:", error);

    // Clean up uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn("Failed to cleanup uploaded file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || "File preparation failed",
    });
  }
});

/**
 * POST /api/storage-upload/prepare-from-url
 * Fetch image from URL (cross-origin) and save to temp for later storage-upload.
 * Body: { url: string, filename: string }
 */
router.post("/api/storage-upload/prepare-from-url", async (req, res) => {
  const { url, filename: requestedFilename } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, error: "url required" });
  }
  let urlParsed;
  try {
    urlParsed = new URL(url);
    if (!["http:", "https:"].includes(urlParsed.protocol)) {
      return res.status(400).json({ success: false, error: "url must be http or https" });
    }
  } catch {
    return res.status(400).json({ success: false, error: "invalid url" });
  }

  const safeName = path.basename(requestedFilename || urlParsed.pathname || "image.png");

  const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const uniqueDir = path.join(tempDir, uniqueId);
  if (!fs.existsSync(uniqueDir)) {
    fs.mkdirSync(uniqueDir, { recursive: true });
  }
  const finalPath = path.join(uniqueDir, safeName);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Email-Helper/1.0" },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `Failed to fetch image: ${response.status} ${response.statusText}`,
      });
    }
    const buf = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(finalPath, buf);
    console.log(`📁 Prepared from URL: ${path.basename(finalPath)}`);
    return res.json({
      success: true,
      tempPath: finalPath,
      filename: path.basename(finalPath),
    });
  } catch (err) {
    if (fs.existsSync(finalPath)) {
      try {
        fs.unlinkSync(finalPath);
      } catch (_) {
        /* cleanup best-effort */
      }
    }
    console.error("prepare-from-url error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch image from URL",
    });
  }
});

/**
 * POST /api/storage-upload/finalize
 * Close current automation tab after successful batch.
 * Body: { provider?: string }
 */
router.post("/api/storage-upload/finalize", async (req, res) => {
  const providerKey = String(req.body?.provider || "default").toLowerCase();
  try {
    const runUploadPath = path.join(__dirname, "../../automation/run-upload.js");
    if (!fs.existsSync(runUploadPath)) {
      return res.status(500).json({
        success: false,
        error: "Automation entry point not found (automation/run-upload.js)",
      });
    }

    const args = [];
    if (providerKey && providerKey !== "default") args.push("--provider", providerKey);
    args.push("--finalize");
    const command = `node "${runUploadPath}" ${args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(" ")}`;

    exec(command, { timeout: 60000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
          details: stderr || error.stderr,
        });
      }
      return res.json({ success: true, output: stdout });
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/storage-upload
 * Upload converted images to storage using automation script
 *
 * Body:
 * - filePath: path to the file to upload
 * - category: 'finance' or 'health'
 * - folderName: folder name (e.g., "ABCD123")
 * - skipConfirmation: boolean (optional)
 */
router.post("/api/storage-upload", async (req, res) => {
  const { filePath, category, folderName, skipConfirmation = true, provider = "default" } = req.body;

  // Validation
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({
      success: false,
      error: "File not found",
    });
  }

  const providerKey = String(provider).toLowerCase();
  const isAlphaOne = providerKey === "alphaone";

  const validCategories = sharedStorageProviders?.providers?.default?.categories || ["finance", "health"];
  if (!isAlphaOne) {
    if (!category || !validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }
  }

  if (!folderName || !/[a-zA-Z]+\d+/.test(folderName)) {
    return res.status(400).json({
      success: false,
      error: "Invalid folder name format. Expected format like: ABCD123",
    });
  }

  try {
    const runUploadPath = path.join(__dirname, "../../automation/run-upload.js");

    if (!fs.existsSync(runUploadPath)) {
      return res.status(500).json({
        success: false,
        error: "Automation entry point not found (automation/run-upload.js)",
      });
    }

    // Крос-платформно: передаємо folderName аргументом (скрипт приймає argv[4] у --no-confirm)
    const args = [filePath, category];
    if (providerKey && providerKey !== "default") {
      args.push("--provider", providerKey);
    }
    if (skipConfirmation) {
      args.push("--no-confirm", folderName);
    }
    const command = `node "${runUploadPath}" ${args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(" ")}`;

    console.log(`🚀 Executing: ${command}`);

    // Execute automation script with extended timeout (login may require manual steps)
    exec(command, { timeout: 900000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());

      // Clean up temp file first (regardless of success/failure)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up temp file: ${filePath}`);
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp file:", cleanupError);
        }
      }

      if (error) {
        console.error("Upload error:", error);

        const stderrText = String(stderr || error.stderr || "");
        let errorMessage = error.message;
        let statusCode = 500;

        // Provide more specific error messages
        if (error.killed && error.signal === "SIGTERM") {
          errorMessage = "Upload timeout (5 minutes). Check your internet connection.";
        } else if (stderrText.includes("ERROR:LOGIN_REQUIRED")) {
          statusCode = 401;
          errorMessage = "Потрібен логін в MinIO Console (Brave профіль для цього provider). Відкрий AlfaOne, залогінься, і повтори upload.";
        } else if (stderrText.includes("ERROR:LOGIN_TIMEOUT")) {
          statusCode = 408;
          errorMessage = "Timeout: користувач не залогінився вчасно.";
        } else if (stderrText.includes("ERROR:UPLOAD_UI_TIMEOUT")) {
          statusCode = 408;
          errorMessage = "Timeout: MinIO UI не завантажилось. Перевірте, чи підключено VPN та чи доступний сервер сховища.";
        } else if (stderrText.includes("ERROR:BROWSER_CLOSED") || stderrText.includes("Target page, context or browser has been closed")) {
          statusCode = 499;
          errorMessage = "Браузер було закрито — завантаження скасовано.";
        } else if (stderrText.includes("connectOverCDP") && (stderrText.includes("127.0.0.1:9222") || stderrText.includes("127.0.0.1:9223"))) {
          errorMessage = "Brave CDP порт недоступний. Закрий BravePlaywright/BravePlaywright-AlfaOne або дай скрипту запустити Brave з потрібним портом, і повтори upload.";
        } else if (stderrText.includes("ECONNREFUSED") && stderrText.includes("127.0.0.1:")) {
          errorMessage = "Не вдалося підключитись до локального Brave CDP (remote debugging). Перевір, що Brave дозволено запускатись і порт не зайнятий.";
        } else if (stderr && stderr.includes("ENOTFOUND")) {
          errorMessage = "Storage server not found. Check your internet connection.";
        } else if (stderrText.includes("page.waitForSelector") && stderrText.includes("#upload-main")) {
          statusCode = 401;
          errorMessage = "MinIO UI не показало Upload (ймовірно потрібен логін або інша сторінка). Відкрий AlfaOne, залогінься, і повтори upload.";
        } else if (stderr) {
          errorMessage = `Upload failed: ${stderr.substring(0, 200)}`;
        }

        return res.status(statusCode).json({
          success: false,
          error: errorMessage,
          details: stderr || error.stderr,
        });
      }

      // Parse output to extract file path (from clipboard copy)
      const lines = stdout.split("\n");
      let uploadedPath = null;
      let publicUrl = null;

      for (const line of lines) {
        if (line.startsWith("RESULT_JSON=")) {
          try {
            const jsonStr = line.slice("RESULT_JSON=".length).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed && typeof parsed === "object") {
              if (typeof parsed.filePath === "string") uploadedPath = parsed.filePath;
              if (typeof parsed.publicUrl === "string") publicUrl = parsed.publicUrl;
            }
          } catch {
            // ignore parse errors; fallback to legacy format below
          }
        }
      }

      for (const line of lines) {
        if (line.includes("Скопійовано в буфер:")) {
          uploadedPath = line.split("Скопійовано в буфер:")[1].trim();
          break;
        }
      }

      if (!uploadedPath) {
        console.error("❌ Upload did not return file path. Script output:");
        console.error("STDOUT:", stdout);
        console.error("STDERR:", stderr);

        return res.status(500).json({
          success: false,
          error: "Upload did not return file path (not logged in, cancelled, or UI changed).",
          output: stdout,
        });
      }

      // Success response
      res.json({
        success: true,
        filePath: uploadedPath,
        publicUrl,
        output: stdout,
        message: "File uploaded successfully",
      });
    });
  } catch (error) {
    console.error("Storage upload error:", error);

    // Clean up temp file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
