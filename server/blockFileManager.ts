/**
 * BlockFileManager
 *
 * Handles creation, reading, updating, and deletion of TypeScript block files.
 * Cross-platform support (Windows, macOS, Linux)
 */
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import { getStoragePaths } from "./utils/storagePathResolver";

/**
 * Block file structure
 */
export interface BlockFile {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview: string;
  createdAt: number;
  fileName: string; // e.g., "hero-section.ts"
  filePath: string; // Full path to file
}

/**
 * Block File Manager Configuration
 */
interface BlockFileManagerConfig {
  blocksDir: string;
  scanDirectories?: string[]; // Additional directories to scan for blocks
}

const blocksDir = getStoragePaths().blockFiles;
const srcBlocksDir = path.resolve(__dirname, "../../src/blocks");

const DEFAULT_CONFIG: BlockFileManagerConfig = {
  blocksDir, // Universal cross-platform path
  scanDirectories: [],
};

/**
 * Block File Manager Class
 */
export class BlockFileManager {
  private config: BlockFileManagerConfig;
  private configFilePath: string;

  constructor(config?: Partial<BlockFileManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Path to persistent config file
    this.configFilePath = path.join(blocksDir, "..", "block-manager-config.json");
    this.loadPersistedConfig();
  }

  /**
   * Load persisted configuration (scan directories)
   */
  private loadPersistedConfig(): void {
    try {
      if (existsSync(this.configFilePath)) {
        const data = require("fs").readFileSync(this.configFilePath, "utf8");
        const persisted = JSON.parse(data);
        if (persisted.scanDirectories && Array.isArray(persisted.scanDirectories)) {
          this.config.scanDirectories = persisted.scanDirectories;
          console.log(`📂 Loaded ${persisted.scanDirectories.length} scan directories`);
        }
      }
    } catch (error) {
      console.warn("Failed to load persisted config:", error);
    }
  }

  /**
   * Save configuration to file
   */
  private async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configFilePath);
      if (!existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true });
      }
      await fs.writeFile(
        this.configFilePath,
        JSON.stringify({ scanDirectories: this.config.scanDirectories }, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  /**
   * Add directory to scan list
   */
  private async addScanDirectory(dirPath: string): Promise<void> {
    if (!this.config.scanDirectories) {
      this.config.scanDirectories = [];
    }

    const normalizedPath = path.normalize(dirPath);

    // Don't add if already in list or if it's a default path
    const defaultPaths = [path.normalize(this.config.blocksDir), path.normalize(srcBlocksDir)];

    if (
      !this.config.scanDirectories.includes(normalizedPath) &&
      !defaultPaths.includes(normalizedPath)
    ) {
      this.config.scanDirectories.push(normalizedPath);
      await this.saveConfig();
      console.log(`📁 Added scan directory: ${normalizedPath}`);
    }
  }

  /**
   * Generate TypeScript code for a block
   */
  private generateBlockCode(block: {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    html: string;
    preview?: string;
  }): string {
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
  private toPascalCase(str: string): string {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  /**
   * Convert PascalCase/camelCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
  }

  /**
   * Parse TypeScript block file
   */
  private async parseBlockFile(filePath: string, fileName: string): Promise<BlockFile | null> {
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
      let keywords: string[] = [];
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
    } catch (error) {
      console.error(`Failed to parse block file ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Scan a directory for block files
   */
  private async scanDirectory(dirPath: string): Promise<BlockFile[]> {
    const blocks: BlockFile[] = [];
    try {
      if (!existsSync(dirPath)) {
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
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
    return blocks;
  }

  /**
   * List all block files from all configured directories
   */
  async listBlocks(): Promise<BlockFile[]> {
    try {
      const blocks: BlockFile[] = [];

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
      const uniqueBlocks = Array.from(
        new Map(blocks.map((block) => [block.filePath, block])).values()
      );

      // Sort by creation date (newest first)
      uniqueBlocks.sort((a, b) => b.createdAt - a.createdAt);

      console.log(`📊 Total blocks found: ${uniqueBlocks.length}`);
      return uniqueBlocks;
    } catch (error) {
      console.error("Failed to list blocks:", error);
      return [];
    }
  }

  /**
   * Get a single block by ID
   */
  async getBlock(blockId: string): Promise<BlockFile | null> {
    const fileName = `${blockId}.ts`;
    const filePath = path.join(this.config.blocksDir, fileName);

    if (!existsSync(filePath)) {
      return null;
    }

    return this.parseBlockFile(filePath, fileName);
  }

  /**
   * Validate and resolve target directory path
   */
  private async validateTargetPath(targetPath: string): Promise<string> {
    const projectRoot = path.resolve(__dirname, "../..");

    // Resolve path: if absolute use as-is, if relative join with project root
    let resolvedPath: string;
    if (path.isAbsolute(targetPath)) {
      resolvedPath = targetPath;
    } else {
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
    if (!existsSync(normalizedPath)) {
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
  async createBlock(data: {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    html: string;
    preview?: string;
    targetPath?: string; // Arbitrary path (relative or absolute)
    targetDir?: "src" | "data"; // Legacy support for hardcoded paths
  }): Promise<BlockFile> {
    // Sanitize ID
    const blockId = this.toKebabCase(data.id.replace(/[^a-zA-Z0-9-]/g, "-"));
    const fileName = `${blockId}.ts`;

    // Determine target directory
    let targetDirectory: string;

    if (data.targetPath) {
      // Use custom path (new behavior)
      targetDirectory = await this.validateTargetPath(data.targetPath);
    } else if (data.targetDir === "src") {
      // Legacy: hardcoded 'src' path
      targetDirectory = srcBlocksDir;
    } else {
      // Legacy: default to 'data' path
      targetDirectory = this.config.blocksDir;
    }

    const filePath = path.join(targetDirectory, fileName);

    // Check if file already exists
    if (existsSync(filePath)) {
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
  async updateBlock(
    blockId: string,
    updates: {
      name?: string;
      category?: string;
      keywords?: string[];
      html?: string;
      preview?: string;
    }
  ): Promise<BlockFile | null> {
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
  async deleteBlock(blockId: string): Promise<boolean> {
    // First try to find the block to get its actual file path
    const allBlocks = await this.listBlocks();
    const blockToDelete = allBlocks.find((b) => b.id === blockId);

    if (!blockToDelete) {
      console.warn(`Block not found: ${blockId}`);
      return false;
    }

    // Use the actual file path from the block metadata
    const filePath = blockToDelete.filePath;

    if (!existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return false;
    }

    try {
      await fs.unlink(filePath);
      console.log(`✅ Deleted block file: ${filePath}`);
      return true;
    } catch (error) {
      console.error("Failed to delete block:", error);
      throw new Error("Failed to delete block file");
    }
  }

  /**
   * Search blocks
   */
  async searchBlocks(query: string, category?: string): Promise<BlockFile[]> {
    const allBlocks = await this.listBlocks();

    let filtered = allBlocks;

    // Filter by category
    if (category && category !== "All") {
      filtered = filtered.filter((block) => block.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (block) =>
          block.name.toLowerCase().includes(lowerQuery) ||
          block.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) ||
          block.id.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }

  /**
   * Get allowed root directories
   */
  getAllowedRoots(): string[] {
    // For now, return the blocks directory as the only allowed root
    // In the future, this could be configurable
    return [this.config.blocksDir];
  }

  /**
   * Add allowed root directory
   */
  async addAllowedRoot(rootPath: string): Promise<void> {
    const normalizedPath = path.resolve(rootPath);

    if (!existsSync(normalizedPath)) {
      throw new Error("Path must be an existing directory");
    }

    // For now, we only support the main blocks directory
    // In the future, this could be expanded to support multiple directories
    console.log(`📁 Block directory management: ${normalizedPath} would be added to allowed roots`);
  }

  /**
   * Remove allowed root directory
   */
  async removeAllowedRoot(rootPath: string): Promise<{ removed: number; blocks: BlockFile[] }> {
    const normalizedPath = path.resolve(rootPath);

    // Find and remove blocks from this directory
    const allBlocks = await this.listBlocks();
    const blocksToRemove: BlockFile[] = [];
    const validBlocks: BlockFile[] = [];

    for (const block of allBlocks) {
      if (block.filePath.startsWith(normalizedPath)) {
        console.log(`🗑️ Removing block from deleted directory: ${block.name} (${block.filePath})`);
        blocksToRemove.push(block);
      } else {
        validBlocks.push(block);
      }
    }

    // Note: In a real implementation, you would update the configuration
    // to remove the directory from allowed roots and clean up the database

    console.log(
      `🧹 Would remove ${blocksToRemove.length} blocks from deleted directory: ${normalizedPath}`
    );

    return {
      removed: blocksToRemove.length,
      blocks: blocksToRemove,
    };
  }
}

// Export singleton instance
export const blockFileManager = new BlockFileManager();
