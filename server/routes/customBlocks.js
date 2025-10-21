/**
 * Custom Blocks API Routes
 * RESTful API for managing custom email blocks
 */

const express = require('express');
const router = express.Router();

// Import compiled TypeScript module
let blockManager;
try {
  const { blockManager: manager } = require('../dist/blockManager');
  blockManager = manager;
} catch (error) {
  console.warn('BlockManager not available:', error.message);
  console.warn('Make sure to run "npm run build" in server directory');
}

/**
 * GET /api/custom-blocks
 * List all custom blocks
 */
router.get('/', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const { search, category } = req.query;

    let blocks;
    if (search || category) {
      blocks = await blockManager.searchBlocks(search || '', category);
    } else {
      blocks = await blockManager.listBlocks();
    }

    res.json({
      success: true,
      blocks,
      count: blocks.length,
    });
  } catch (error) {
    console.error('Failed to list blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blocks',
      message: error.message,
    });
  }
});

/**
 * GET /api/custom-blocks/:id
 * Get a specific block by ID
 */
router.get('/:id', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const { id } = req.params;
    const block = await blockManager.getBlock(id);

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found',
      });
    }

    res.json({
      success: true,
      block,
    });
  } catch (error) {
    console.error('Failed to get block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve block',
      message: error.message,
    });
  }
});

/**
 * POST /api/custom-blocks
 * Create a new custom block
 */
router.post('/', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const { name, category, keywords, html, preview } = req.body;

    // Validation
    if (!name || !category || !keywords || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, keywords, html',
      });
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Keywords must be a non-empty array',
      });
    }

    const block = await blockManager.createBlock({
      name,
      category,
      keywords,
      html,
      preview,
    });

    res.status(201).json({
      success: true,
      block,
      message: 'Block created successfully',
    });
  } catch (error) {
    console.error('Failed to create block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create block',
      message: error.message,
    });
  }
});

/**
 * PUT /api/custom-blocks/:id
 * Update an existing block
 */
router.put('/:id', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
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
        error: 'No fields to update',
      });
    }

    const block = await blockManager.updateBlock(id, updates);

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found',
      });
    }

    res.json({
      success: true,
      block,
      message: 'Block updated successfully',
    });
  } catch (error) {
    console.error('Failed to update block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update block',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/custom-blocks/:id
 * Delete a block
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const { id } = req.params;
    const success = await blockManager.deleteBlock(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Block not found',
      });
    }

    res.json({
      success: true,
      message: 'Block deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete block',
      message: error.message,
    });
  }
});

/**
 * GET /api/custom-blocks/stats
 * Get block statistics
 */
router.get('/meta/stats', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const stats = await blockManager.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message,
    });
  }
});

/**
 * POST /api/custom-blocks/export
 * Export all blocks
 */
router.get('/meta/export', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const blocks = await blockManager.exportBlocks();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=custom-blocks.json');
    res.json({
      version: '1.0',
      exportedAt: Date.now(),
      blocks,
    });
  } catch (error) {
    console.error('Failed to export blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export blocks',
      message: error.message,
    });
  }
});

/**
 * POST /api/custom-blocks/import
 * Import blocks from JSON
 */
router.post('/meta/import', async (req, res) => {
  try {
    if (!blockManager) {
      return res.status(503).json({ error: 'Block manager not available' });
    }

    const { blocks } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data: blocks array required',
      });
    }

    const result = await blockManager.importBlocks(blocks);

    res.json({
      success: true,
      ...result,
      message: `Import completed: ${result.imported} imported, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Failed to import blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import blocks',
      message: error.message,
    });
  }
});

module.exports = router;
