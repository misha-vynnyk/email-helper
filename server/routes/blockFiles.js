/**
 * Block Files API Routes
 * RESTful API for managing TypeScript block files in src/blocks/
 */

const express = require("express");
const router = express.Router();

// Import compiled TypeScript module
let blockFileManager;
try {
  const { blockFileManager: manager } = require("../dist/blockFileManager");
  blockFileManager = manager;
} catch (error) {
  console.warn("BlockFileManager not available:", error.message);
}

/**
 * GET /api/blocks/list
 * List all block files
 */
router.get("/list", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { search, category } = req.query;

    let blocks;
    if (search || category) {
      blocks = await blockFileManager.searchBlocks(search || "", category);
    } else {
      blocks = await blockFileManager.listBlocks();
    }

    res.json({
      success: true,
      blocks,
      count: blocks.length,
    });
  } catch (error) {
    console.error("Failed to list block files:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve block files",
      message: error.message,
    });
  }
});

/**
 * GET /api/block-files/:id
 * Get a specific block file by ID
 */
router.get("/:id", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { id } = req.params;
    const block = await blockFileManager.getBlock(id);

    if (!block) {
      return res.status(404).json({
        success: false,
        error: "Block file not found",
      });
    }

    res.json({
      success: true,
      block,
    });
  } catch (error) {
    console.error("Failed to get block file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve block file",
      message: error.message,
    });
  }
});

/**
 * POST /api/block-files
 * Create a new block file
 */
router.post("/", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { id, name, category, keywords, html, preview, targetPath, targetDir } = req.body;

    // Validation
    if (!id || !name || !category || !keywords || !html) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, name, category, keywords, html",
      });
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Keywords must be a non-empty array",
      });
    }

    // Validate targetPath if provided (arbitrary path)
    if (targetPath) {
      if (typeof targetPath !== "string" || targetPath.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "targetPath must be a non-empty string",
        });
      }

      // Basic security check: no null bytes, control characters
      if (/[\x00-\x1F\x7F]/.test(targetPath)) {
        return res.status(400).json({
          success: false,
          error: "targetPath contains invalid characters",
        });
      }
    }

    // Validate targetDir if provided (legacy support)
    if (targetDir && targetDir !== "src" && targetDir !== "data") {
      return res.status(400).json({
        success: false,
        error: 'targetDir must be either "src" or "data"',
      });
    }

    const block = await blockFileManager.createBlock({
      id,
      name,
      category,
      keywords,
      html,
      preview,
      targetPath, // Custom path (preferred)
      targetDir: targetDir || (!targetPath ? "data" : undefined), // Legacy fallback
    });

    res.status(201).json({
      success: true,
      block,
      message: "Block file created successfully",
    });
  } catch (error) {
    console.error("Failed to create block file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create block file",
      message: error.message,
    });
  }
});

/**
 * PUT /api/block-files/:id
 * Update an existing block file
 */
router.put("/:id", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { id } = req.params;
    const { name, category, keywords, html, preview } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (keywords !== undefined) updates.keywords = keywords;
    if (html !== undefined) updates.html = html;
    if (preview !== undefined) updates.preview = preview;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    const block = await blockFileManager.updateBlock(id, updates);

    if (!block) {
      return res.status(404).json({
        success: false,
        error: "Block file not found",
      });
    }

    res.json({
      success: true,
      block,
      message: "Block file updated successfully",
    });
  } catch (error) {
    console.error("Failed to update block file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update block file",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/block-files/:id
 * Delete a block file
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { id } = req.params;
    const success = await blockFileManager.deleteBlock(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Block file not found",
      });
    }

    res.json({
      success: true,
      message: "Block file deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete block file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete block file",
      message: error.message,
    });
  }
});

/**
 * GET /api/block-files/settings/paths
 * Get current block storage paths
 */
router.get("/settings/paths", async (req, res) => {
  try {
    const path = require("path");

    res.json({
      srcBlocksPath: path.resolve(__dirname, "../../src/blocks"),
      dataBlocksPath: path.resolve(__dirname, "../data/blocks/files"),
      relativeSrcPath: "../../src/blocks",
      relativeDataPath: "../data/blocks/files",
    });
  } catch (error) {
    console.error("Failed to get block paths:", error);
    res.status(500).json({
      error: "Failed to get block paths",
      message: error.message,
    });
  }
});

/**
 * GET /api/block-files/settings/allowed-roots
 * Get allowed root directories for block files
 */
router.get("/settings/allowed-roots", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const allowedRoots = blockFileManager.getAllowedRoots();
    res.json({ allowedRoots });
  } catch (error) {
    console.error("Failed to get allowed roots:", error);
    res.status(500).json({
      error: "Failed to get allowed roots",
      message: error.message,
    });
  }
});

/**
 * POST /api/block-files/settings/allowed-roots
 * Add allowed root directory for block files
 */
router.post("/settings/allowed-roots", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { rootPath } = req.body;

    if (!rootPath) {
      return res.status(400).json({
        error: "rootPath is required",
      });
    }

    await blockFileManager.addAllowedRoot(rootPath);
    const allowedRoots = blockFileManager.getAllowedRoots();

    console.log(`✅ Added allowed root for blocks: ${rootPath}`);

    res.json({
      allowedRoots,
      message: "Directory added successfully",
    });
  } catch (error) {
    console.error("❌ Error adding allowed root:", error);
    res.status(400).json({
      error: error.message || "Failed to add allowed root",
    });
  }
});

/**
 * DELETE /api/block-files/settings/allowed-roots
 * Remove allowed root directory for block files
 */
router.delete("/settings/allowed-roots", async (req, res) => {
  try {
    if (!blockFileManager) {
      return res.status(503).json({ error: "BlockFileManager not available" });
    }

    const { rootPath } = req.body;

    if (!rootPath) {
      return res.status(400).json({
        error: "rootPath is required",
      });
    }

    const result = await blockFileManager.removeAllowedRoot(rootPath);
    const allowedRoots = blockFileManager.getAllowedRoots();

    console.log(`🗑️ Removed ${result.removed} blocks from directory: ${rootPath}`);

    // Return updated list of allowed roots and cleanup info
    res.json({
      allowedRoots,
      removedBlocks: result.removed,
      message: `Removed directory and ${result.removed} blocks from library`,
    });
  } catch (error) {
    console.error("❌ Error removing allowed root:", error);
    res.status(400).json({
      error: error.message || "Failed to remove allowed root",
    });
  }
});

module.exports = router;
