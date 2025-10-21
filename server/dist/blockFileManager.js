"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockFileManager = exports.BlockFileManager = void 0;
/**
 * BlockFileManager
 *
 * Handles creation, reading, updating, and deletion of TypeScript block files.
 * Cross-platform support (Windows, macOS, Linux)
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const storagePathResolver_1 = require("./utils/storagePathResolver");
const blocksDir = (0, storagePathResolver_1.getStoragePaths)().blockFiles;
const srcBlocksDir = path.resolve(__dirname, "../../src/blocks");
const DEFAULT_CONFIG = {
    blocksDir, // Universal cross-platform path
    scanDirectories: [],
};
/**
 * Block File Manager Class
 */
class BlockFileManager {
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Path to persistent config file
        this.configFilePath = path.join(blocksDir, "..", "block-manager-config.json");
        this.loadPersistedConfig();
    }
    /**
     * Load persisted configuration (scan directories)
     */
    loadPersistedConfig() {
        try {
            if ((0, fs_1.existsSync)(this.configFilePath)) {
                const data = require("fs").readFileSync(this.configFilePath, "utf8");
                const persisted = JSON.parse(data);
                if (persisted.scanDirectories && Array.isArray(persisted.scanDirectories)) {
                    this.config.scanDirectories = persisted.scanDirectories;
                    console.log(`📂 Loaded ${persisted.scanDirectories.length} scan directories`);
                }
            }
        }
        catch (error) {
            console.warn("Failed to load persisted config:", error);
        }
    }
    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            const configDir = path.dirname(this.configFilePath);
            if (!(0, fs_1.existsSync)(configDir)) {
                await fs.mkdir(configDir, { recursive: true });
            }
            await fs.writeFile(this.configFilePath, JSON.stringify({ scanDirectories: this.config.scanDirectories }, null, 2), "utf8");
        }
        catch (error) {
            console.error("Failed to save config:", error);
        }
    }
    /**
     * Add directory to scan list
     */
    async addScanDirectory(dirPath) {
        if (!this.config.scanDirectories) {
            this.config.scanDirectories = [];
        }
        const normalizedPath = path.normalize(dirPath);
        // Don't add if already in list or if it's a default path
        const defaultPaths = [path.normalize(this.config.blocksDir), path.normalize(srcBlocksDir)];
        if (!this.config.scanDirectories.includes(normalizedPath) &&
            !defaultPaths.includes(normalizedPath)) {
            this.config.scanDirectories.push(normalizedPath);
            await this.saveConfig();
            console.log(`📁 Added scan directory: ${normalizedPath}`);
        }
    }
    /**
     * Generate TypeScript code for a block
     */
    generateBlockCode(block) {
        const previewValue = block.preview || "";
        // Use original block HTML without wrapping
        const htmlEscaped = block.html
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\$/g, "\\$");
        // Format keywords with single quotes
        const keywordsFormatted = `[${block.keywords.map((k) => `'${k}'`).join(", ")}]`;
        return `import { EmailBlock } from '../types/block';

const ${this.toPascalCase(block.id)}: EmailBlock = {
  id: '${block.id}',
  name: '${block.name}',
  category: '${block.category}',
  keywords: ${keywordsFormatted},
  preview: '${previewValue}',
  html: \`
${htmlEscaped}
  \`.trim(),
  createdAt: Date.now(),
};

export default ${this.toPascalCase(block.id)};
`;
    }
    /**
     * Convert kebab-case to PascalCase
     */
    toPascalCase(str) {
        return str
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("");
    }
    /**
     * Convert PascalCase/camelCase to kebab-case
     */
    toKebabCase(str) {
        return str
            .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
            .toLowerCase();
    }
    /**
     * Parse TypeScript block file
     */
    async parseBlockFile(filePath, fileName) {
        try {
            const content = await fs.readFile(filePath, "utf8");
            // Extract values using regex
            const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
            const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
            const categoryMatch = content.match(/category:\s*['"]([^'"]+)['"]/);
            const keywordsMatch = content.match(/keywords:\s*(\[[^\]]+\])/);
            const previewMatch = content.match(/preview:\s*['"]([^'"]*)['"]/);
            const htmlMatch = content.match(/html:\s*`([\s\S]*?)`\s*\.trim\(\)/);
            const createdAtMatch = content.match(/createdAt:\s*(\d+)/);
            if (!idMatch || !nameMatch || !categoryMatch || !htmlMatch) {
                console.warn(`Invalid block file format: ${fileName}`);
                return null;
            }
            // Convert single quotes to double quotes for JSON.parse
            let keywords = [];
            if (keywordsMatch) {
                const keywordsStr = keywordsMatch[1].replace(/'/g, '"');
                keywords = JSON.parse(keywordsStr);
            }
            return {
                id: idMatch[1],
                name: nameMatch[1],
                category: categoryMatch[1],
                keywords,
                preview: previewMatch ? previewMatch[1] : "",
                html: htmlMatch[1].trim(),
                createdAt: createdAtMatch ? parseInt(createdAtMatch[1]) : Date.now(),
                fileName,
                filePath,
            };
        }
        catch (error) {
            console.error(`Failed to parse block file ${fileName}:`, error);
            return null;
        }
    }
    /**
     * Scan a directory for block files
     */
    async scanDirectory(dirPath) {
        const blocks = [];
        try {
            if (!(0, fs_1.existsSync)(dirPath)) {
                return blocks;
            }
            const files = await fs.readdir(dirPath);
            const tsFiles = files.filter((file) => file.endsWith(".ts") && file !== "README.md");
            for (const file of tsFiles) {
                const filePath = path.join(dirPath, file);
                const block = await this.parseBlockFile(filePath, file);
                if (block) {
                    blocks.push(block);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to scan directory ${dirPath}:`, error);
        }
        return blocks;
    }
    /**
     * List all block files from all configured directories
     */
    async listBlocks() {
        try {
            const blocks = [];
            // 1. Scan default blocksDir (data/blocks/files)
            const defaultBlocks = await this.scanDirectory(this.config.blocksDir);
            blocks.push(...defaultBlocks);
            // 2. Scan src/blocks (predefined blocks)
            const srcBlocks = await this.scanDirectory(srcBlocksDir);
            blocks.push(...srcBlocks);
            // 3. Scan all additional directories
            if (this.config.scanDirectories && this.config.scanDirectories.length > 0) {
                console.log(`📂 Scanning ${this.config.scanDirectories.length} additional directories...`);
                for (const dir of this.config.scanDirectories) {
                    const customBlocks = await this.scanDirectory(dir);
                    blocks.push(...customBlocks);
                    console.log(`  ✓ ${dir}: ${customBlocks.length} blocks`);
                }
            }
            // Remove duplicates based on file path
            const uniqueBlocks = Array.from(new Map(blocks.map((block) => [block.filePath, block])).values());
            // Sort by creation date (newest first)
            uniqueBlocks.sort((a, b) => b.createdAt - a.createdAt);
            console.log(`📊 Total blocks found: ${uniqueBlocks.length}`);
            return uniqueBlocks;
        }
        catch (error) {
            console.error("Failed to list blocks:", error);
            return [];
        }
    }
    /**
     * Get a single block by ID
     */
    async getBlock(blockId) {
        const fileName = `${blockId}.ts`;
        const filePath = path.join(this.config.blocksDir, fileName);
        if (!(0, fs_1.existsSync)(filePath)) {
            return null;
        }
        return this.parseBlockFile(filePath, fileName);
    }
    /**
     * Validate and resolve target directory path
     */
    async validateTargetPath(targetPath) {
        const projectRoot = path.resolve(__dirname, "../..");
        // Resolve path: if absolute use as-is, if relative join with project root
        let resolvedPath;
        if (path.isAbsolute(targetPath)) {
            resolvedPath = targetPath;
        }
        else {
            resolvedPath = path.join(projectRoot, targetPath);
        }
        // Normalize the path
        const normalizedPath = path.normalize(resolvedPath);
        // Security: Prevent directory traversal attacks
        // Ensure path is within project directory or explicitly allowed paths
        if (!normalizedPath.startsWith(projectRoot)) {
            // Check if it's in user's Documents (for external projects)
            const homeDir = require("os").homedir();
            const documentsDir = path.join(homeDir, "Documents");
            if (!normalizedPath.startsWith(documentsDir)) {
                throw new Error("Target path must be within project or Documents directory");
            }
        }
        // Check if directory exists, create if it doesn't
        if (!(0, fs_1.existsSync)(normalizedPath)) {
            await fs.mkdir(normalizedPath, { recursive: true });
            console.log(`📁 Created directory: ${normalizedPath}`);
        }
        // Verify it's a directory
        const stats = await fs.stat(normalizedPath);
        if (!stats.isDirectory()) {
            throw new Error("Target path must be a directory");
        }
        return normalizedPath;
    }
    /**
     * Create a new block file
     */
    async createBlock(data) {
        // Sanitize ID
        const blockId = this.toKebabCase(data.id.replace(/[^a-zA-Z0-9-]/g, "-"));
        const fileName = `${blockId}.ts`;
        // Determine target directory
        let targetDirectory;
        if (data.targetPath) {
            // Use custom path (new behavior)
            targetDirectory = await this.validateTargetPath(data.targetPath);
        }
        else if (data.targetDir === "src") {
            // Legacy: hardcoded 'src' path
            targetDirectory = srcBlocksDir;
        }
        else {
            // Legacy: default to 'data' path
            targetDirectory = this.config.blocksDir;
        }
        const filePath = path.join(targetDirectory, fileName);
        // Check if file already exists
        if ((0, fs_1.existsSync)(filePath)) {
            throw new Error(`Block with ID "${blockId}" already exists at ${filePath}`);
        }
        // Generate TypeScript code
        const code = this.generateBlockCode({
            ...data,
            id: blockId,
        });
        // Write file
        await fs.writeFile(filePath, code, "utf8");
        console.log(`✅ Created block file: ${filePath}`);
        // Add directory to scan list if it's a custom path
        if (data.targetPath) {
            await this.addScanDirectory(targetDirectory);
        }
        // Return created block
        return {
            id: blockId,
            name: data.name,
            category: data.category,
            keywords: data.keywords,
            html: data.html,
            preview: data.preview || "",
            createdAt: Date.now(),
            fileName,
            filePath,
        };
    }
    /**
     * Update an existing block file
     */
    async updateBlock(blockId, updates) {
        const existingBlock = await this.getBlock(blockId);
        if (!existingBlock) {
            return null;
        }
        // Merge updates
        const updatedData = {
            id: existingBlock.id,
            name: updates.name ?? existingBlock.name,
            category: updates.category ?? existingBlock.category,
            keywords: updates.keywords ?? existingBlock.keywords,
            html: updates.html ?? existingBlock.html,
            preview: updates.preview ?? existingBlock.preview,
        };
        // Generate new code
        const code = this.generateBlockCode(updatedData);
        // Write file
        await fs.writeFile(existingBlock.filePath, code, "utf8");
        // Return updated block
        return {
            ...updatedData,
            createdAt: existingBlock.createdAt,
            fileName: existingBlock.fileName,
            filePath: existingBlock.filePath,
        };
    }
    /**
     * Delete a block file
     */
    async deleteBlock(blockId) {
        // First try to find the block to get its actual file path
        const allBlocks = await this.listBlocks();
        const blockToDelete = allBlocks.find((b) => b.id === blockId);
        if (!blockToDelete) {
            console.warn(`Block not found: ${blockId}`);
            return false;
        }
        // Use the actual file path from the block metadata
        const filePath = blockToDelete.filePath;
        if (!(0, fs_1.existsSync)(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return false;
        }
        try {
            await fs.unlink(filePath);
            console.log(`✅ Deleted block file: ${filePath}`);
            return true;
        }
        catch (error) {
            console.error("Failed to delete block:", error);
            throw new Error("Failed to delete block file");
        }
    }
    /**
     * Search blocks
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
            filtered = filtered.filter((block) => block.name.toLowerCase().includes(lowerQuery) ||
                block.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) ||
                block.id.toLowerCase().includes(lowerQuery));
        }
        return filtered;
    }
    /**
     * Get allowed root directories
     */
    getAllowedRoots() {
        // For now, return the blocks directory as the only allowed root
        // In the future, this could be configurable
        return [this.config.blocksDir];
    }
    /**
     * Add allowed root directory
     */
    async addAllowedRoot(rootPath) {
        const normalizedPath = path.resolve(rootPath);
        if (!(0, fs_1.existsSync)(normalizedPath)) {
            throw new Error("Path must be an existing directory");
        }
        // For now, we only support the main blocks directory
        // In the future, this could be expanded to support multiple directories
        console.log(`📁 Block directory management: ${normalizedPath} would be added to allowed roots`);
    }
    /**
     * Remove allowed root directory
     */
    async removeAllowedRoot(rootPath) {
        const normalizedPath = path.resolve(rootPath);
        // Find and remove blocks from this directory
        const allBlocks = await this.listBlocks();
        const blocksToRemove = [];
        const validBlocks = [];
        for (const block of allBlocks) {
            if (block.filePath.startsWith(normalizedPath)) {
                console.log(`🗑️ Removing block from deleted directory: ${block.name} (${block.filePath})`);
                blocksToRemove.push(block);
            }
            else {
                validBlocks.push(block);
            }
        }
        // Note: In a real implementation, you would update the configuration
        // to remove the directory from allowed roots and clean up the database
        console.log(`🧹 Would remove ${blocksToRemove.length} blocks from deleted directory: ${normalizedPath}`);
        return {
            removed: blocksToRemove.length,
            blocks: blocksToRemove,
        };
    }
}
exports.BlockFileManager = BlockFileManager;
// Export singleton instance
exports.blockFileManager = new BlockFileManager();
//# sourceMappingURL=blockFileManager.js.map