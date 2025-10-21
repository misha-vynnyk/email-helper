const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Path to blocks directory
const BLOCKS_DIR = path.join(process.cwd(), 'blocks');

// Ensure blocks directory exists
async function ensureBlocksDir() {
  try {
    await fs.mkdir(BLOCKS_DIR, { recursive: true });

    // Create category directories
    const categories = ['content', 'layout', 'components', 'forms'];
    for (const category of categories) {
      const categoryDir = path.join(BLOCKS_DIR, category);
      await fs.mkdir(categoryDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to initialize blocks directory:', error);
  }
}

// Initialize blocks directory on startup
ensureBlocksDir();

// GET /api/blocks - Get all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = [];
    const categories = ['content', 'layout', 'components', 'forms'];

    for (const category of categories) {
      const categoryDir = path.join(BLOCKS_DIR, category);

      try {
        const files = await fs.readdir(categoryDir);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));

        for (const file of jsonFiles) {
          try {
            const filePath = path.join(categoryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const blockFile = JSON.parse(content);

            // Convert to SearchableBlock format
            const searchableBlock = convertToSearchableBlock(blockFile);
            blocks.push(searchableBlock);
          } catch (error) {
            console.warn(`Failed to load block file ${file}:`, error);
          }
        }
      } catch (error) {
        // Category directory doesn't exist, skip
        continue;
      }
    }

    res.json(blocks);
  } catch (error) {
    console.error('Failed to load blocks:', error);
    res.status(500).json({ error: 'Failed to load blocks' });
  }
});

// GET /api/blocks/:id - Get block by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categories = ['content', 'layout', 'components', 'forms'];

    for (const category of categories) {
      const categoryDir = path.join(BLOCKS_DIR, category);

      try {
        const files = await fs.readdir(categoryDir);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));

        for (const file of jsonFiles) {
          try {
            const filePath = path.join(categoryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const blockFile = JSON.parse(content);

            if (blockFile.id === id) {
              const searchableBlock = convertToSearchableBlock(blockFile);
              return res.json(searchableBlock);
            }
          } catch (error) {
            console.warn(`Failed to load block file ${file}:`, error);
          }
        }
      } catch (error) {
        continue;
      }
    }

    res.status(404).json({ error: 'Block not found' });
  } catch (error) {
    console.error(`Failed to get block ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get block' });
  }
});

// POST /api/blocks - Create new block
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const blockFile = {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      type: data.type,
      html: data.htmlContent,
      metadata: {
        keywords: data.keywords || [],
        tags: data.tags || [],
        author: data.author || 'unknown',
        supportedClients: data.supportedClients || ['gmail', 'outlook', 'apple-mail', 'yahoo'],
        isPublic: data.isPublic || false,
        createdAt: now,
        updatedAt: now,
      },
      contentSlots: data.contentSlots,
      styleVariables: data.styleVariables,
      extractedComponents: data.extractedComponents,
    };

    // Save to file
    const categoryDir = path.join(BLOCKS_DIR, data.category.toLowerCase());
    const fileName = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}.json`;
    const filePath = path.join(categoryDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(blockFile, null, 2));

    const searchableBlock = convertToSearchableBlock(blockFile);
    res.json({ success: true, data: searchableBlock });
  } catch (error) {
    console.error('Failed to create block:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/blocks/:id - Update block
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Find existing block file
    const categories = ['content', 'layout', 'components', 'forms'];
    let existingBlockFile = null;
    let existingFilePath = null;

    for (const category of categories) {
      const categoryDir = path.join(BLOCKS_DIR, category);

      try {
        const files = await fs.readdir(categoryDir);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));

        for (const file of jsonFiles) {
          try {
            const filePath = path.join(categoryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const blockFile = JSON.parse(content);

            if (blockFile.id === id) {
              existingBlockFile = blockFile;
              existingFilePath = filePath;
              break;
            }
          } catch (error) {
            console.warn(`Failed to load block file ${file}:`, error);
          }
        }

        if (existingBlockFile) break;
      } catch (error) {
        continue;
      }
    }

    if (!existingBlockFile) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    const now = new Date().toISOString();

    const updatedBlockFile = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      type: data.type,
      html: data.htmlContent,
      metadata: {
        ...existingBlockFile.metadata,
        keywords: data.keywords || existingBlockFile.metadata.keywords,
        tags: data.tags || existingBlockFile.metadata.tags,
        author: data.author || existingBlockFile.metadata.author,
        supportedClients: data.supportedClients || existingBlockFile.metadata.supportedClients,
        isPublic: data.isPublic !== undefined ? data.isPublic : existingBlockFile.metadata.isPublic,
        updatedAt: now,
      },
      contentSlots: data.contentSlots,
      styleVariables: data.styleVariables,
      extractedComponents: data.extractedComponents,
    };

    // Save to file
    await fs.writeFile(existingFilePath, JSON.stringify(updatedBlockFile, null, 2));

    const searchableBlock = convertToSearchableBlock(updatedBlockFile);
    res.json({ success: true, data: searchableBlock });
  } catch (error) {
    console.error('Failed to update block:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/blocks/:id - Delete block
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categories = ['content', 'layout', 'components', 'forms'];

    for (const category of categories) {
      const categoryDir = path.join(BLOCKS_DIR, category);

      try {
        const files = await fs.readdir(categoryDir);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));

        for (const file of jsonFiles) {
          try {
            const filePath = path.join(categoryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const blockFile = JSON.parse(content);

            if (blockFile.id === id) {
              await fs.unlink(filePath);
              return res.json({ success: true });
            }
          } catch (error) {
            console.warn(`Failed to load block file ${file}:`, error);
          }
        }
      } catch (error) {
        continue;
      }
    }

    res.status(404).json({ success: false, error: 'Block not found' });
  } catch (error) {
    console.error('Failed to delete block:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert BlockFile to SearchableBlock format
function convertToSearchableBlock(blockFile) {
  const baseBlock = {
    metadata: {
      id: blockFile.id,
      name: blockFile.name,
      description: blockFile.description,
      category: blockFile.category,
      keywords: blockFile.metadata.keywords,
      tags: blockFile.metadata.tags,
      author: blockFile.metadata.author,
      supportedClients: blockFile.metadata.supportedClients,
      isPublic: blockFile.metadata.isPublic,
      createdAt: new Date(blockFile.metadata.createdAt),
      updatedAt: new Date(blockFile.metadata.updatedAt),
    },
  };

  if (blockFile.type === 'HtmlContainer') {
    return {
      ...baseBlock,
      type: 'HtmlContainer',
      template: {
        html: blockFile.html,
        contentSlots: blockFile.contentSlots || [],
        styleVariables: blockFile.styleVariables || {},
      },
    };
  } else {
    return {
      ...baseBlock,
      type: 'HtmlContent',
      content: {
        html: blockFile.html,
        extractedComponents: blockFile.extractedComponents || [],
      },
    };
  }
}

module.exports = router;
