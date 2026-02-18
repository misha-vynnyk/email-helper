"use strict";
/**
 * Block Manager - File-based block storage
 * Manages custom email blocks using Node.js file system
 * Cross-platform support (Windows, macOS, Linux)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockManager = exports.BlockManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const storagePathResolver_1 = require("./utils/storagePathResolver");
const DEFAULT_CONFIG = {
    blocksDir: (0, storagePathResolver_1.getStoragePaths)().customBlocks, // Universal cross-platform path
    maxBlockSize: 100 * 1024, // 100KB
    maxBlocks: 100,
};
/**
 * Block Manager Class
 */
class BlockManager {
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.ensureBlocksDirectory();
    }
    /**
     * Ensure blocks directory exists
     */
    async ensureBlocksDirectory() {
        try {
            if (!(0, fs_1.existsSync)(this.config.blocksDir)) {
                await promises_1.default.mkdir(this.config.blocksDir, { recursive: true });
            }
        }
        catch (error) {
            console.error("Failed to create blocks directory:", error);
            throw new Error("Failed to initialize block storage");
        }
    }
    /**
     * Get file path for a block
     */
    getBlockFilePath(blockId) {
        // Sanitize block ID to prevent directory traversal
        const sanitizedId = blockId.replace(/[^a-zA-Z0-9-_]/g, "");
        return path_1.default.join(this.config.blocksDir, `${sanitizedId}.json`);
    }
    /**
     * Validate block data
     */
    validateBlock(block) {
        if (!block.name || block.name.trim().length === 0) {
            throw new Error("Block name is required");
        }
        if (!block.category || block.category.trim().length === 0) {
            throw new Error("Block category is required");
        }
        if (!block.html || block.html.trim().length === 0) {
            throw new Error("Block HTML is required");
        }
        if (!block.keywords || !Array.isArray(block.keywords) || block.keywords.length === 0) {
            throw new Error("At least one keyword is required");
        }
        // Check HTML size
        const htmlSize = Buffer.byteLength(block.html, "utf8");
        if (htmlSize > this.config.maxBlockSize) {
            throw new Error(`Block HTML exceeds maximum size of ${this.config.maxBlockSize} bytes`);
        }
    }
    /**
     * Generate unique block ID
     */
    generateBlockId() {
        return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create a new custom block
     */
    async createBlock(data) {
        this.validateBlock(data);
        // Check if max blocks reached
        const existingBlocks = await this.listBlocks();
        if (existingBlocks.length >= this.config.maxBlocks) {
            throw new Error(`Maximum number of blocks (${this.config.maxBlocks}) reached`);
        }
        const blockId = this.generateBlockId();
        const now = Date.now();
        const block = {
            id: blockId,
            name: data.name.trim(),
            category: data.category.trim(),
            keywords: data.keywords.map((k) => k.trim()),
            html: data.html.trim(),
            preview: data.preview,
            createdAt: now,
            updatedAt: now,
            isCustom: true,
        };
        const filePath = this.getBlockFilePath(blockId);
        try {
            await promises_1.default.writeFile(filePath, JSON.stringify(block, null, 2), "utf8");
            return block;
        }
        catch (error) {
            console.error("Failed to create block:", error);
            throw new Error("Failed to save block to file system");
        }
    }
    /**
     * Get a block by ID
     */
    async getBlock(blockId) {
        const filePath = this.getBlockFilePath(blockId);
        try {
            if (!(0, fs_1.existsSync)(filePath)) {
                return null;
            }
            const content = await promises_1.default.readFile(filePath, "utf8");
            const block = JSON.parse(content);
            return block;
        }
        catch (error) {
            console.error("Failed to read block:", error);
            return null;
        }
    }
    /**
     * Update an existing block
     */
    async updateBlock(blockId, updates) {
        const existingBlock = await this.getBlock(blockId);
        if (!existingBlock) {
            return null;
        }
        const updatedBlock = {
            ...existingBlock,
            ...updates,
            id: blockId, // Ensure ID doesn't change
            isCustom: true, // Ensure it stays custom
            updatedAt: Date.now(),
        };
        this.validateBlock(updatedBlock);
        const filePath = this.getBlockFilePath(blockId);
        try {
            await promises_1.default.writeFile(filePath, JSON.stringify(updatedBlock, null, 2), "utf8");
            return updatedBlock;
        }
        catch (error) {
            console.error("Failed to update block:", error);
            throw new Error("Failed to update block file");
        }
    }
    /**
     * Delete a block
     */
    async deleteBlock(blockId) {
        const filePath = this.getBlockFilePath(blockId);
        try {
            if (!(0, fs_1.existsSync)(filePath)) {
                return false;
            }
            await promises_1.default.unlink(filePath);
            return true;
        }
        catch (error) {
            console.error("Failed to delete block:", error);
            throw new Error("Failed to delete block file");
        }
    }
    /**
     * List all custom blocks
     */
    async listBlocks() {
        try {
            await this.ensureBlocksDirectory();
            const files = await promises_1.default.readdir(this.config.blocksDir);
            // Filter out macOS resource fork files (._filename) and only keep JSON files
            const jsonFiles = files.filter((file) => !file.startsWith("._") && file.endsWith(".json"));
            const blocks = [];
            for (const file of jsonFiles) {
                try {
                    const filePath = path_1.default.join(this.config.blocksDir, file);
                    const content = await promises_1.default.readFile(filePath, "utf8");
                    const block = JSON.parse(content);
                    blocks.push(block);
                }
                catch (error) {
                    console.error(`Failed to read block file ${file}:`, error);
                    // Continue with other files
                }
            }
            // Sort by creation date (newest first)
            blocks.sort((a, b) => b.createdAt - a.createdAt);
            return blocks;
        }
        catch (error) {
            console.error("Failed to list blocks:", error);
            return [];
        }
    }
    /**
     * Search blocks by query
     */
    async searchBlocks(query, category) {
        const allBlocks = await this.listBlocks();
        let filtered = allBlocks;
        // Filter by category
        if (category && category !== "All") {
            filtered = filtered.filter((block) => block.category === category);
        }
        // Filter by search query
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter((block) => block.name.toLowerCase().includes(lowerQuery) || block.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) || block.category.toLowerCase().includes(lowerQuery));
        }
        return filtered;
    }
    /**
     * Get block statistics
     */
    async getStats() {
        const blocks = await this.listBlocks();
        const stats = {
            totalBlocks: blocks.length,
            categories: {},
            totalSize: 0,
        };
        for (const block of blocks) {
            // Count by category
            stats.categories[block.category] = (stats.categories[block.category] || 0) + 1;
            // Calculate total size
            stats.totalSize += Buffer.byteLength(block.html, "utf8");
        }
        return stats;
    }
    /**
     * Export all blocks as JSON
     */
    async exportBlocks() {
        return this.listBlocks();
    }
    /**
     * Import blocks from JSON
     */
    async importBlocks(blocks) {
        const result = {
            imported: 0,
            failed: 0,
            errors: [],
        };
        for (const block of blocks) {
            try {
                // Validate and create new block
                await this.createBlock({
                    name: block.name,
                    category: block.category,
                    keywords: block.keywords,
                    html: block.html,
                    preview: block.preview,
                });
                result.imported++;
            }
            catch (error) {
                result.failed++;
                result.errors.push(`Failed to import block "${block.name}": ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }
        return result;
    }
}
exports.BlockManager = BlockManager;
// Export singleton instance
exports.blockManager = new BlockManager();
//# sourceMappingURL=blockManager.js.map