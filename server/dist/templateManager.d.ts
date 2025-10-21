/**
 * Template Manager
 * Manages HTML email templates from arbitrary file system locations
 * Cross-platform support (Windows, macOS, Linux)
 */
/**
 * Email Template Structure
 */
export interface EmailTemplate {
    id: string;
    name: string;
    filePath: string;
    relativePath?: string;
    folderPath?: string;
    category: TemplateCategory;
    tags: string[];
    description?: string;
    thumbnail?: string;
    fileSize: number;
    lastModified: number;
    createdAt: number;
}
export type TemplateCategory = 'Newsletter' | 'Transactional' | 'Marketing' | 'Internal' | 'Other';
/**
 * Configuration
 */
interface TemplateManagerConfig {
    metadataPath: string;
    allowedRoots: string[];
    maxFileSize: number;
}
/**
 * Template Manager Class
 */
export declare class TemplateManager {
    private config;
    private metadata;
    constructor(config?: Partial<TemplateManagerConfig>);
    /**
     * Initialize - Load metadata from disk
     */
    init(): Promise<void>;
    /**
     * List all templates
     */
    listTemplates(): Promise<EmailTemplate[]>;
    /**
     * Get template by ID
     */
    getTemplate(id: string): Promise<EmailTemplate | null>;
    /**
     * Get template HTML content
     */
    getTemplateContent(id: string): Promise<string>;
    /**
     * Add new template
     */
    addTemplate(filePath: string, metadata: Partial<Omit<EmailTemplate, 'id' | 'filePath' | 'fileSize' | 'lastModified' | 'createdAt'>>): Promise<EmailTemplate>;
    /**
     * Update template metadata
     */
    updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
    /**
     * Remove template from library (doesn't delete file)
     */
    removeTemplate(id: string): Promise<void>;
    /**
     * Clean up templates with missing files
     * Removes templates from database if their files no longer exist
     */
    cleanupMissingFiles(): Promise<{
        removed: number;
        templates: EmailTemplate[];
    }>;
    /**
     * Import all .html files from a folder
     */
    importFolder(folderPath: string, options?: {
        recursive?: boolean;
        category?: TemplateCategory;
        tags?: string[];
    }): Promise<EmailTemplate[]>;
    /**
     * Sync template metadata with file system
     * Updates fileSize and lastModified if file changed
     */
    syncTemplate(id: string): Promise<EmailTemplate>;
    /**
     * Validate file path
     * macOS-specific security checks
     */
    validatePath(filePath: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    /**
     * Get allowed roots (for settings UI)
     */
    getAllowedRoots(): string[];
    /**
     * Add allowed root (for settings UI)
     */
    addAllowedRoot(rootPath: string): Promise<void>;
    /**
     * Remove allowed root and clean up templates from that directory
     */
    removeAllowedRoot(rootPath: string): Promise<{
        removed: number;
        templates: EmailTemplate[];
    }>;
    /**
     * Private: Save metadata to disk
     */
    private saveMetadata;
    /**
     * Private: Scan folder for .html files
     */
    private scanFolder;
    /**
     * Get statistics
     */
    getStats(): Promise<{
        totalTemplates: number;
        byCategory: Record<TemplateCategory, number>;
        totalSize: number;
        allowedRoots: number;
    }>;
}
/**
 * Get TemplateManager singleton
 */
export declare function getTemplateManager(): Promise<TemplateManager>;
export {};
//# sourceMappingURL=templateManager.d.ts.map