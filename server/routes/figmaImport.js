/**
 * Figma Import API Routes
 * Stage 1: read-only endpoint that reads description.md/desktop.json/mobile.json
 * from a user-supplied folder path. No write access, no addTemplate call.
 */

const express = require("express");
const router = express.Router();

// Will be compiled from TypeScript
let figmaImportManager = null;

// Lazy load figma import manager
async function getManager() {
  if (!figmaImportManager) {
    try {
      const { getFigmaImportManager } = require("../dist/figmaImportManager");
      figmaImportManager = getFigmaImportManager();
    } catch (error) {
      console.error("❌ Failed to initialize FigmaImportManager in routes:", error);
      throw new Error(`FigmaImportManager initialization failed: ${error.message}`);
    }
  }
  return figmaImportManager;
}

/**
 * GET /api/figma-import/files?folder=<path>
 * Reads exactly 3 files from the given folder. Each is reported independently
 * as { exists, content? } — a missing file does not fail the whole request.
 */
router.get("/files", async (req, res) => {
  try {
    const { folder } = req.query;

    if (!folder || typeof folder !== "string") {
      return res.status(400).json({
        error: "folder query param is required",
      });
    }

    const manager = await getManager();

    const validation = await manager.validateFolderPath(folder);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason || "Invalid folder path",
      });
    }

    const result = await manager.readFolder(folder);
    res.json(result);
  } catch (error) {
    console.error("❌ Error reading figma-import folder:", error);
    res.status(500).json({
      error: error.message || "Failed to read folder",
    });
  }
});

module.exports = router;
