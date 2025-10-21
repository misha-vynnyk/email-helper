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
    fileName: string;
    filePath: string;
}
/**
 * Block File Manager Configuration
 */
interface BlockFileManagerConfig {
    blocksDir: string;
    scanDirectories?: string[];
}
/**
 * Block File Manager Class
 */
export declare class BlockFileManager {
    private config;
    private configFilePath;
    constructor(config?: Partial<BlockFileManagerConfig>);
    /**
     * Load persisted configuration (scan directories)
     */
    private loadPersistedConfig;
    /**
     * Save configuration to file
     */
    private saveConfig;
    /**
     * Add directory to scan list
     */
    private addScanDirectory;
    /**
     * Generate TypeScript code for a block
     */
    private generateBlockCode;
    /**
     * Convert kebab-case to PascalCase
     */
    private toPascalCase;
    /**
     * Convert PascalCase/camelCase to kebab-case
     */
    private toKebabCase;
    /**
     * Parse TypeScript block file
     */
    private parseBlockFile;
    /**
     * Scan a directory for block files
     */
    private scanDirectory;
    /**
     * List all block files from all configured directories
     */
    listBlocks(): Promise<BlockFile[]>;
    /**
     * Get a single block by ID
     */
    getBlock(blockId: string): Promise<BlockFile | null>;
    /**
     * Validate and resolve target directory path
     */
    private validateTargetPath;
    /**
     * Create a new block file
     */
    createBlock(data: {
        id: string;
        name: string;
        category: string;
        keywords: string[];
        html: string;
        preview?: string;
        targetPath?: string;
        targetDir?: "src" | "data";
    }): Promise<BlockFile>;
    /**
     * Update an existing block file
     */
    updateBlock(blockId: string, updates: {
        name?: string;
        category?: string;
        keywords?: string[];
        html?: string;
        preview?: string;
    }): Promise<BlockFile | null>;
    /**
     * Delete a block file
     */
    deleteBlock(blockId: string): Promise<boolean>;
    /**
     * Search blocks
     */
    searchBlocks(query: string, category?: string): Promise<BlockFile[]>;
    /**
     * Get allowed root directories
     */
    getAllowedRoots(): string[];
    /**
     * Add allowed root directory
     */
    addAllowedRoot(rootPath: string): Promise<void>;
    /**
     * Remove allowed root directory
     */
    removeAllowedRoot(rootPath: string): Promise<{
        removed: number;
        blocks: BlockFile[];
    }>;
}
export declare const blockFileManager: BlockFileManager;
export {};
//# sourceMappingURL=blockFileManager.d.ts.map