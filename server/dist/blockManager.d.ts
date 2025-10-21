/**
 * Block Manager - File-based block storage
 * Manages custom email blocks using Node.js file system
 * Cross-platform support (Windows, macOS, Linux)
 */
/**
 * Block metadata structure (stored in JSON files)
 */
export interface BlockMetadata {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    html: string;
    preview?: string;
    createdAt: number;
    updatedAt: number;
    isCustom: true;
}
/**
 * Block Manager Configuration
 */
interface BlockManagerConfig {
    blocksDir: string;
    maxBlockSize: number;
    maxBlocks: number;
}
/**
 * Block Manager Class
 */
export declare class BlockManager {
    private config;
    constructor(config?: Partial<BlockManagerConfig>);
    /**
     * Ensure blocks directory exists
     */
    private ensureBlocksDirectory;
    /**
     * Get file path for a block
     */
    private getBlockFilePath;
    /**
     * Validate block data
     */
    private validateBlock;
    /**
     * Generate unique block ID
     */
    private generateBlockId;
    /**
     * Create a new custom block
     */
    createBlock(data: {
        name: string;
        category: string;
        keywords: string[];
        html: string;
        preview?: string;
    }): Promise<BlockMetadata>;
    /**
     * Get a block by ID
     */
    getBlock(blockId: string): Promise<BlockMetadata | null>;
    /**
     * Update an existing block
     */
    updateBlock(blockId: string, updates: {
        name?: string;
        category?: string;
        keywords?: string[];
        html?: string;
        preview?: string;
    }): Promise<BlockMetadata | null>;
    /**
     * Delete a block
     */
    deleteBlock(blockId: string): Promise<boolean>;
    /**
     * List all custom blocks
     */
    listBlocks(): Promise<BlockMetadata[]>;
    /**
     * Search blocks by query
     */
    searchBlocks(query: string, category?: string): Promise<BlockMetadata[]>;
    /**
     * Get block statistics
     */
    getStats(): Promise<{
        totalBlocks: number;
        categories: Record<string, number>;
        totalSize: number;
    }>;
    /**
     * Export all blocks as JSON
     */
    exportBlocks(): Promise<BlockMetadata[]>;
    /**
     * Import blocks from JSON
     */
    importBlocks(blocks: BlockMetadata[]): Promise<{
        imported: number;
        failed: number;
        errors: string[];
    }>;
}
export declare const blockManager: BlockManager;
export {};
//# sourceMappingURL=blockManager.d.ts.map