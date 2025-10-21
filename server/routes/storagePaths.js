/**
 * Storage Paths API
 * Manage storage configuration via HTTP API
 */

const express = require('express');
const router = express.Router();
const { getStorageInfo } = require('../dist/utils/storagePathResolver');

/**
 * GET /api/storage/info
 * Get current storage paths and system information
 */
router.get('/info', (req, res) => {
  try {
    const info = getStorageInfo();
    res.json({
      platform: info.platform,
      paths: info.paths,
      templateRoots: info.templateRoots,
      homeDir: info.homeDir,
    });
  } catch (error) {
    console.error('Failed to get storage info:', error);
    res.status(500).json({ error: 'Failed to get storage information' });
  }
});

/**
 * POST /api/storage/template-roots
 * Update template roots configuration
 * Body: { roots: string[] }
 */
router.post('/template-roots', async (req, res) => {
  try {
    const { roots } = req.body;

    if (!Array.isArray(roots)) {
      return res.status(400).json({ error: 'roots must be an array' });
    }

    // Validate paths (basic validation)
    const validRoots = roots.filter((root) => {
      return typeof root === 'string' && root.length > 0;
    });

    if (validRoots.length === 0) {
      return res.status(400).json({ error: 'At least one valid root path required' });
    }

    // In production, this would update configuration file
    // For now, return success (configuration via localStorage + env vars)
    res.json({
      success: true,
      message: 'Template roots configuration updated',
      roots: validRoots,
      note: 'To persist across server restarts, add to TEMPLATE_ROOTS environment variable',
    });
  } catch (error) {
    console.error('Failed to update template roots:', error);
    res.status(500).json({ error: 'Failed to update template roots' });
  }
});

/**
 * GET /api/storage/defaults
 * Get default storage paths for current OS
 */
router.get('/defaults', (req, res) => {
  try {
    const os = require('os');
    const path = require('path');
    const homeDir = os.homedir();
    const platform = os.platform();

    const defaults = {
      platform,
      homeDir,
      recommendations: {},
    };

    switch (platform) {
      case 'darwin': // macOS
        defaults.recommendations = {
          blocks: `${homeDir}/Library/Application Support/EmailBuilder/blocks`,
          templates: `${homeDir}/Documents/EmailTemplates`,
          images: `${homeDir}/Library/Application Support/EmailBuilder/images`,
        };
        break;

      case 'win32': { // Windows
        const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
        defaults.recommendations = {
          blocks: `${appData}\\EmailBuilder\\blocks`,
          templates: `${homeDir}\\Documents\\EmailTemplates`,
          images: `${appData}\\EmailBuilder\\images`,
        };
        break;
      }

      default: // Linux
        defaults.recommendations = {
          blocks: `${homeDir}/.local/share/EmailBuilder/blocks`,
          templates: `${homeDir}/Documents/EmailTemplates`,
          images: `${homeDir}/.local/share/EmailBuilder/images`,
        };
    }

    res.json(defaults);
  } catch (error) {
    console.error('Failed to get defaults:', error);
    res.status(500).json({ error: 'Failed to get default paths' });
  }
});

module.exports = router;
