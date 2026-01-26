const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");
const router = express.Router();

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
    const tempPath = path.join(tempDir, safeName);

    // Check if file already exists and create unique name if needed
    let finalPath = tempPath;
    let counter = 1;
    while (fs.existsSync(finalPath)) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalPath = path.join(tempDir, `${base}-${counter}${ext}`);
      counter++;
    }

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
  const { filePath, category, folderName, skipConfirmation = true } = req.body;

  // Validation
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({
      success: false,
      error: "File not found"
    });
  }

  const validCategories = ["finance", "health"];
  if (!category || !validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${validCategories.join(", ")}`
    });
  }

  if (!folderName || !/[a-zA-Z]+\d+/.test(folderName)) {
    return res.status(400).json({
      success: false,
      error: "Invalid folder name format. Expected format like: ABCD123"
    });
  }

  try {
    const automationScriptPath = path.join(__dirname, "../../automation/scripts/upload-playwright-brave.js");

    if (!fs.existsSync(automationScriptPath)) {
      return res.status(500).json({
        success: false,
        error: "Automation script not found"
      });
    }

    // Copy folder name to clipboard (required by the script)
    const pbcopyCmd = `echo "${folderName}" | pbcopy`;
    exec(pbcopyCmd, (pbError) => {
      if (pbError) {
        console.error("Failed to copy to clipboard:", pbError);
      }
    });

    // Build command
    const skipFlag = skipConfirmation ? "--no-confirm" : "";
    const command = `node "${automationScriptPath}" "${filePath}" ${category} ${skipFlag}`;

    console.log(`🚀 Executing: ${command}`);

    // Execute automation script with extended timeout for slow internet (5 minutes)
    exec(command, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
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

        let errorMessage = error.message;

        // Provide more specific error messages
        if (error.killed && error.signal === 'SIGTERM') {
          errorMessage = "Upload timeout (5 minutes). Check your internet connection.";
        } else if (stderr && stderr.includes("ECONNREFUSED")) {
          errorMessage = "Cannot connect to storage server";
        } else if (stderr && stderr.includes("ENOTFOUND")) {
          errorMessage = "Storage server not found. Check your internet connection.";
        } else if (stderr) {
          errorMessage = `Upload failed: ${stderr.substring(0, 200)}`;
        }

        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: stderr || error.stderr
        });
      }

      // Parse output to extract file path (from clipboard copy)
      const lines = stdout.split("\n");
      let uploadedPath = null;

      for (const line of lines) {
        if (line.includes("Скопійовано в буфер:")) {
          uploadedPath = line.split("Скопійовано в буфер:")[1].trim();
          break;
        }
      }

      // Success response
      res.json({
        success: true,
        filePath: uploadedPath,
        output: stdout,
        message: "File uploaded successfully"
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
      error: error.message
    });
  }
});

module.exports = router;
