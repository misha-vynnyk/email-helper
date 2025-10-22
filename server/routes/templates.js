/**
 * Template Management API Routes
 * RESTful endpoints for managing email templates
 */

const express = require("express");
const router = express.Router();

// Will be compiled from TypeScript
let templateManager = null;

// Lazy load template manager
async function getManager() {
  if (!templateManager) {
    const { getTemplateManager } = require("../dist/templateManager");
    templateManager = await getTemplateManager();
  }
  return templateManager;
}

/**
 * GET /api/templates/list
 * List all templates
 */
router.get("/list", async (req, res) => {
  try {
    const manager = await getManager();
    const templates = await manager.listTemplates();

    // Return array directly (not wrapped in object)
    res.json(templates);
  } catch (error) {
    console.error("❌ Error listing templates:", error);
    res.status(500).json({
      error: error.message || "Failed to list templates",
    });
  }
});

/**
 * POST /api/templates/add
 * Add a new template
 * Body: { filePath, name?, category?, tags?, description? }
 */
router.post("/add", async (req, res) => {
  try {
    const { filePath, name, category, tags, description } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: "filePath is required",
      });
    }

    const manager = await getManager();
    const template = await manager.addTemplate(filePath, {
      name,
      category,
      tags: tags || [],
      description,
    });

    // Return template directly
    res.status(201).json(template);
  } catch (error) {
    console.error("❌ Error adding template:", error);
    res.status(400).json({
      error: error.message || "Failed to add template",
    });
  }
});

/**
 * GET /api/templates/:id
 * Get template metadata by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await getManager();
    const template = await manager.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    // Return template directly
    res.json(template);
  } catch (error) {
    console.error("❌ Error getting template:", error);
    res.status(500).json({
      error: error.message || "Failed to get template",
    });
  }
});

/**
 * GET /api/templates/:id/content
 * Get template HTML content
 */
router.get("/:id/content", async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await getManager();
    const content = await manager.getTemplateContent(id);

    // Return HTML content as text (not JSON)
    res.type("text/html").send(content);
  } catch (error) {
    console.error("❌ Error getting template content:", error);
    res.status(404).json({
      error: error.message || "Failed to get template content",
    });
  }
});

/**
 * PUT /api/templates/:id
 * Update template metadata
 * Body: { name?, category?, tags?, description? }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const manager = await getManager();
    const template = await manager.updateTemplate(id, updates);

    // Return updated template directly
    res.json(template);
  } catch (error) {
    console.error("❌ Error updating template:", error);
    res.status(400).json({
      error: error.message || "Failed to update template",
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Remove template from library (doesn't delete file)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await getManager();
    await manager.removeTemplate(id);

    // Return 204 No Content on successful deletion
    res.status(204).send();
  } catch (error) {
    console.error("❌ Error removing template:", error);
    res.status(404).json({
      error: error.message || "Failed to remove template",
    });
  }
});

/**
 * POST /api/templates/import-folder
 * Import all .html files from a folder
 * Body: { folderPath, recursive?, category?, tags? }
 */
router.post("/import-folder", async (req, res) => {
  try {
    const { folderPath, recursive, category, tags } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        error: "folderPath is required",
      });
    }

    const manager = await getManager();
    const templates = await manager.importFolder(folderPath, {
      recursive: recursive || false,
      category,
      tags: tags || [],
    });

    // Return array of imported templates
    res.status(201).json(templates);
  } catch (error) {
    console.error("❌ Error importing folder:", error);
    res.status(400).json({
      error: error.message || "Failed to import folder",
    });
  }
});

/**
 * POST /api/templates/:id/sync
 * Sync template metadata with file system
 */
router.post("/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await getManager();
    const template = await manager.syncTemplate(id);

    // Return synced template directly
    res.json(template);
  } catch (error) {
    console.error("❌ Error syncing template:", error);
    res.status(400).json({
      error: error.message || "Failed to sync template",
    });
  }
});

/**
 * GET /api/templates/stats
 * Get library statistics
 */
router.get("/stats/summary", async (req, res) => {
  try {
    const manager = await getManager();
    const stats = await manager.getStats();

    // Return stats directly
    res.json(stats);
  } catch (error) {
    console.error("❌ Error getting stats:", error);
    res.status(500).json({
      error: error.message || "Failed to get stats",
    });
  }
});

/**
 * GET /api/templates/settings/allowed-roots
 * Get allowed root directories
 */
router.get("/settings/allowed-roots", async (req, res) => {
  try {
    const manager = await getManager();
    const roots = manager.getAllowedRoots();

    // Return array of allowed roots
    res.json(roots);
  } catch (error) {
    console.error("❌ Error getting allowed roots:", error);
    res.status(500).json({
      error: error.message || "Failed to get allowed roots",
    });
  }
});

/**
 * POST /api/templates/settings/allowed-roots
 * Add allowed root directory
 * Body: { rootPath }
 */
router.post("/settings/allowed-roots", async (req, res) => {
  try {
    const { rootPath } = req.body;

    if (!rootPath) {
      return res.status(400).json({
        error: "rootPath is required",
      });
    }

    const manager = await getManager();
    await manager.addAllowedRoot(rootPath);
    const roots = manager.getAllowedRoots();

    // Return updated list of allowed roots
    res.status(201).json(roots);
  } catch (error) {
    console.error("❌ Error adding allowed root:", error);
    res.status(400).json({
      error: error.message || "Failed to add allowed root",
    });
  }
});

/**
 * DELETE /api/templates/settings/allowed-roots
 * Remove allowed root directory
 * Body: { rootPath }
 */
router.delete("/settings/allowed-roots", async (req, res) => {
  try {
    const { rootPath } = req.body;

    if (!rootPath) {
      return res.status(400).json({
        error: "rootPath is required",
      });
    }

    const manager = await getManager();
    const result = await manager.removeAllowedRoot(rootPath);
    const roots = manager.getAllowedRoots();

    console.log(`🗑️ Removed ${result.removed} templates from directory: ${rootPath}`);

    // Return updated list of allowed roots and cleanup info
    res.json({
      allowedRoots: roots,
      removedTemplates: result.removed,
      message: `Removed directory and ${result.removed} templates from library`,
    });
  } catch (error) {
    console.error("❌ Error removing allowed root:", error);
    res.status(400).json({
      error: error.message || "Failed to remove allowed root",
    });
  }
});

/**
 * POST /api/templates/sync-all
 * Sync all templates - scan all allowed roots and update database
 */
router.post("/sync-all", async (req, res) => {
  try {
    const manager = await getManager();
    const { recursive = true, category = "Other", paths } = req.body;

    console.log("🔄 Starting full template sync...");

    // First, cleanup templates with missing files
    console.log("🧹 Cleaning up templates with missing files...");
    const cleanup = await manager.cleanupMissingFiles();
    console.log(`🧹 Removed ${cleanup.removed} templates with missing files`);

    // Determine which roots to scan
    let rootsToScan;
    if (paths && Array.isArray(paths) && paths.length > 0) {
      // Use provided paths from frontend storage locations
      rootsToScan = paths;
      console.log(`📂 Syncing ${paths.length} custom paths from frontend`);
    } else {
      // Fallback to backend allowed roots
      rootsToScan = manager.getAllowedRoots();
      console.log(`📂 Syncing ${rootsToScan.length} backend allowed roots`);
    }

    const allTemplates = [];
    const errors = [];

    // Scan each root
    for (const rootPath of rootsToScan) {
      try {
        console.log(`📁 Scanning root: ${rootPath}`);

        // Check if root exists
        const fs = require("fs");
        if (!fs.existsSync(rootPath)) {
          console.log(`⚠️ Root does not exist: ${rootPath}`);
          errors.push({
            root: rootPath,
            error: "Directory does not exist",
          });
          continue;
        }

        // Import all HTML files from this root
        const templates = await manager.importFolder(rootPath, {
          recursive,
          category,
          tags: ["synced"],
        });

        allTemplates.push(...templates);
        console.log(`✅ Found ${templates.length} templates in ${rootPath}`);
      } catch (error) {
        console.error(`❌ Error scanning ${rootPath}:`, error.message);
        errors.push({
          root: rootPath,
          error: error.message,
        });
      }
    }

    console.log(`🎉 Sync complete: ${allTemplates.length} templates found`);

    res.json({
      success: true,
      templatesFound: allTemplates.length,
      templates: allTemplates,
      removed: cleanup.removed,
      errors: errors,
      scannedRoots: rootsToScan.length,
      message: `Synced ${allTemplates.length} new templates from ${rootsToScan.length} roots. Removed ${cleanup.removed} missing files.`,
    });
  } catch (error) {
    console.error("❌ Error syncing templates:", error);
    res.status(500).json({
      error: error.message || "Failed to sync templates",
    });
  }
});

module.exports = router;
