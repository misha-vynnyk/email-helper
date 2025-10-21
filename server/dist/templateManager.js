"use strict";
/**
 * Template Manager
 * Manages HTML email templates from arbitrary file system locations
 * Cross-platform support (Windows, macOS, Linux)
 */
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
exports.TemplateManager = void 0;
exports.getTemplateManager = getTemplateManager;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const storagePathResolver_1 = require("./utils/storagePathResolver");
/**
 * Template Manager Class
 */
class TemplateManager {
    constructor(config) {
        const paths = (0, storagePathResolver_1.getStoragePaths)();
        this.config = {
            metadataPath: paths.templateMetadata,
            // Universal cross-platform allowed roots
            allowedRoots: (0, storagePathResolver_1.getTemplateRoots)(),
            maxFileSize: 5 * 1024 * 1024, // 5 MB
            ...config,
        };
        this.metadata = {
            templates: [],
            lastUpdated: Date.now(),
        };
    }
    /**
     * Initialize - Load metadata from disk
     */
    async init() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.config.metadataPath);
            if (!(0, fs_1.existsSync)(dataDir)) {
                await fs.mkdir(dataDir, { recursive: true });
            }
            // Load existing metadata
            if ((0, fs_1.existsSync)(this.config.metadataPath)) {
                const content = await fs.readFile(this.config.metadataPath, 'utf-8');
                this.metadata = JSON.parse(content);
            }
            else {
                // Create initial metadata file
                await this.saveMetadata();
            }
            console.log(`✅ TemplateManager initialized with ${this.metadata.templates.length} templates`);
        }
        catch (error) {
            console.error('❌ Failed to initialize TemplateManager:', error);
            throw error;
        }
    }
    /**
     * List all templates
     */
    async listTemplates() {
        return this.metadata.templates;
    }
    /**
     * Get template by ID
     */
    async getTemplate(id) {
        const template = this.metadata.templates.find((t) => t.id === id);
        return template || null;
    }
    /**
     * Get template HTML content
     */
    async getTemplateContent(id) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }
        try {
            // Check if file still exists
            if (!(0, fs_1.existsSync)(template.filePath)) {
                throw new Error(`Template file no longer exists: ${template.filePath}`);
            }
            // Read HTML content
            const content = await fs.readFile(template.filePath, 'utf-8');
            return content;
        }
        catch (error) {
            console.error(`❌ Failed to read template ${id}:`, error);
            throw error;
        }
    }
    /**
     * Add new template
     */
    async addTemplate(filePath, metadata) {
        try {
            // Expand tilde and normalize path
            const expandedPath = (0, storagePathResolver_1.expandTilde)(filePath);
            const normalizedPath = path.normalize(path.resolve(expandedPath));
            // Validate path
            const validation = await this.validatePath(expandedPath);
            if (!validation.valid) {
                throw new Error(`Invalid path: ${validation.reason}`);
            }
            // Get file stats
            const stats = (0, fs_1.statSync)(normalizedPath);
            // Check if already exists
            const existing = this.metadata.templates.find((t) => t.filePath === normalizedPath);
            if (existing) {
                throw new Error('Template already exists in library');
            }
            // Create template object
            const template = {
                id: (0, uuid_1.v4)(),
                filePath: normalizedPath,
                name: metadata.name || path.basename(filePath, '.html'),
                relativePath: metadata.relativePath, // Preserve folder structure
                folderPath: metadata.folderPath, // Parent folder(s)
                category: metadata.category || 'Other',
                tags: metadata.tags || [],
                description: metadata.description,
                thumbnail: metadata.thumbnail,
                fileSize: stats.size,
                lastModified: stats.mtimeMs,
                createdAt: Date.now(),
            };
            // Add to metadata
            this.metadata.templates.push(template);
            this.metadata.lastUpdated = Date.now();
            // Save
            await this.saveMetadata();
            console.log(`✅ Added template: ${template.name} (${template.id})`);
            return template;
        }
        catch (error) {
            console.error('❌ Failed to add template:', error);
            throw error;
        }
    }
    /**
     * Update template metadata
     */
    async updateTemplate(id, updates) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }
        // Update fields (except id, filePath)
        const updated = {
            ...template,
            ...updates,
            id: template.id, // Never change ID
            filePath: template.filePath, // Never change file path
        };
        // Update in metadata
        const index = this.metadata.templates.findIndex((t) => t.id === id);
        this.metadata.templates[index] = updated;
        this.metadata.lastUpdated = Date.now();
        // Save
        await this.saveMetadata();
        console.log(`✅ Updated template: ${updated.name}`);
        return updated;
    }
    /**
     * Remove template from library (doesn't delete file)
     */
    async removeTemplate(id) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }
        // Remove from metadata
        this.metadata.templates = this.metadata.templates.filter((t) => t.id !== id);
        this.metadata.lastUpdated = Date.now();
        // Save
        await this.saveMetadata();
        console.log(`✅ Removed template: ${template.name}`);
    }
    /**
     * Clean up templates with missing files
     * Removes templates from database if their files no longer exist
     */
    async cleanupMissingFiles() {
        const removed = [];
        const validTemplates = [];
        for (const template of this.metadata.templates) {
            try {
                // Check if file exists
                if (!(0, fs_1.existsSync)(template.filePath)) {
                    console.log(`⚠️ Removing template with missing file: ${template.name} (${template.filePath})`);
                    removed.push(template);
                }
                else {
                    validTemplates.push(template);
                }
            }
            catch (error) {
                console.error(`❌ Error checking template ${template.name}:`, error);
                // Keep template in list if we can't check
                validTemplates.push(template);
            }
        }
        // Update metadata with only valid templates
        if (removed.length > 0) {
            this.metadata.templates = validTemplates;
            this.metadata.lastUpdated = Date.now();
            await this.saveMetadata();
            console.log(`🧹 Cleaned up ${removed.length} templates with missing files`);
        }
        else {
            console.log(`✅ All templates have valid files`);
        }
        return {
            removed: removed.length,
            templates: removed,
        };
    }
    /**
     * Import all .html files from a folder
     */
    async importFolder(folderPath, options = {}) {
        try {
            // Expand tilde and normalize path
            const expandedPath = (0, storagePathResolver_1.expandTilde)(folderPath);
            const normalizedPath = path.normalize(path.resolve(expandedPath));
            // Validate folder path
            const validation = await this.validatePath(expandedPath);
            if (!validation.valid) {
                throw new Error(`Invalid folder path: ${validation.reason}`);
            }
            const imported = [];
            const files = await this.scanFolder(normalizedPath, options.recursive);
            // Normalize base path for relative path calculation
            const basePath = normalizedPath;
            for (const filePath of files) {
                try {
                    // Calculate relative path from import root
                    const normalizedFilePath = path.normalize(filePath);
                    const relativePath = path.relative(basePath, normalizedFilePath);
                    // Extract folder structure (e.g., "Finance/DailyMarketClue.com")
                    const folderParts = path
                        .dirname(relativePath)
                        .split(path.sep)
                        .filter((p) => p && p !== '.');
                    const folderPath = folderParts.length > 0 ? folderParts.join(' / ') : undefined;
                    const template = await this.addTemplate(filePath, {
                        name: path.basename(filePath, path.extname(filePath)),
                        category: options.category || 'Other',
                        tags: options.tags || [],
                        relativePath, // Store relative path
                        folderPath, // Store folder structure
                    });
                    imported.push(template);
                }
                catch (error) {
                    console.warn(`⚠️ Skipped ${filePath}:`, error);
                }
            }
            console.log(`✅ Imported ${imported.length} templates from ${folderPath}`);
            return imported;
        }
        catch (error) {
            console.error('❌ Failed to import folder:', error);
            throw error;
        }
    }
    /**
     * Sync template metadata with file system
     * Updates fileSize and lastModified if file changed
     */
    async syncTemplate(id) {
        const template = await this.getTemplate(id);
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }
        try {
            if (!(0, fs_1.existsSync)(template.filePath)) {
                throw new Error('File no longer exists');
            }
            const stats = (0, fs_1.statSync)(template.filePath);
            return await this.updateTemplate(id, {
                fileSize: stats.size,
                lastModified: stats.mtimeMs,
            });
        }
        catch (error) {
            console.error(`❌ Failed to sync template ${id}:`, error);
            throw error;
        }
    }
    /**
     * Validate file path
     * macOS-specific security checks
     */
    async validatePath(filePath) {
        try {
            // Expand tilde and normalize path
            const expanded = (0, storagePathResolver_1.expandTilde)(filePath);
            const normalized = path.normalize(path.resolve(expanded));
            // Check if path exists
            if (!(0, fs_1.existsSync)(normalized)) {
                return { valid: false, reason: 'Path does not exist' };
            }
            // Get stats
            const stats = (0, fs_1.statSync)(normalized);
            // For folder import, accept directories
            if (stats.isDirectory()) {
                // Check if within allowed roots
                const isAllowed = this.config.allowedRoots.some((root) => normalized.startsWith(path.normalize(root)));
                if (!isAllowed) {
                    return { valid: false, reason: 'Directory not in allowed roots' };
                }
                return { valid: true };
            }
            // For files, check extension
            if (!normalized.toLowerCase().endsWith('.html') && !normalized.toLowerCase().endsWith('.htm')) {
                return { valid: false, reason: 'Not an HTML file' };
            }
            // Check if within allowed roots
            const isAllowed = this.config.allowedRoots.some((root) => normalized.startsWith(path.normalize(root)));
            if (!isAllowed) {
                return { valid: false, reason: 'Path not in allowed roots' };
            }
            // Block system directories (macOS specific)
            const blockedPaths = ['/System', '/Library', '/private/etc', '/private/var', '/usr', '/bin', '/sbin'];
            const isBlocked = blockedPaths.some((blocked) => normalized.startsWith(blocked));
            if (isBlocked) {
                return { valid: false, reason: 'System directory blocked' };
            }
            // Check file size
            if (stats.size > this.config.maxFileSize) {
                return { valid: false, reason: `File too large (max ${this.config.maxFileSize / 1024 / 1024}MB)` };
            }
            // Check read permission
            try {
                await fs.access(normalized, fs.constants.R_OK);
            }
            catch {
                return { valid: false, reason: 'No read permission' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, reason: `Validation error: ${error}` };
        }
    }
    /**
     * Get allowed roots (for settings UI)
     */
    getAllowedRoots() {
        return [...this.config.allowedRoots];
    }
    /**
     * Add allowed root (for settings UI)
     */
    async addAllowedRoot(rootPath) {
        const normalized = path.normalize(path.resolve(rootPath));
        // Check if directory exists
        if (!(0, fs_1.existsSync)(normalized) || !(0, fs_1.statSync)(normalized).isDirectory()) {
            throw new Error('Path must be an existing directory');
        }
        // Add to allowed roots
        if (!this.config.allowedRoots.includes(normalized)) {
            this.config.allowedRoots.push(normalized);
            console.log(`✅ Added allowed root: ${normalized}`);
        }
    }
    /**
     * Remove allowed root and clean up templates from that directory
     */
    async removeAllowedRoot(rootPath) {
        const normalized = (0, storagePathResolver_1.expandTilde)(rootPath);
        // Remove from allowed roots
        this.config.allowedRoots = this.config.allowedRoots.filter((root) => root !== normalized);
        // Find and remove templates from this directory
        const templatesToRemove = [];
        const validTemplates = [];
        for (const template of this.metadata.templates) {
            if (template.filePath.startsWith(normalized)) {
                console.log(`🗑️ Removing template from deleted directory: ${template.name} (${template.filePath})`);
                templatesToRemove.push(template);
            }
            else {
                validTemplates.push(template);
            }
        }
        // Update metadata
        if (templatesToRemove.length > 0) {
            this.metadata.templates = validTemplates;
            this.metadata.lastUpdated = Date.now();
            await this.saveMetadata();
            console.log(`🧹 Removed ${templatesToRemove.length} templates from deleted directory: ${normalized}`);
        }
        console.log(`✅ Removed allowed root: ${normalized}`);
        return {
            removed: templatesToRemove.length,
            templates: templatesToRemove,
        };
    }
    /**
     * Private: Save metadata to disk
     */
    async saveMetadata() {
        try {
            const content = JSON.stringify(this.metadata, null, 2);
            await fs.writeFile(this.config.metadataPath, content, 'utf-8');
        }
        catch (error) {
            console.error('❌ Failed to save metadata:', error);
            throw error;
        }
    }
    /**
     * Private: Scan folder for .html files
     */
    async scanFolder(folderPath, recursive = false) {
        const htmlFiles = [];
        const scan = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && recursive) {
                    await scan(fullPath);
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (ext === '.html' || ext === '.htm') {
                        htmlFiles.push(fullPath);
                    }
                }
            }
        };
        await scan(folderPath);
        return htmlFiles;
    }
    /**
     * Get statistics
     */
    async getStats() {
        const byCategory = {
            Newsletter: 0,
            Transactional: 0,
            Marketing: 0,
            Internal: 0,
            Other: 0,
        };
        let totalSize = 0;
        for (const template of this.metadata.templates) {
            byCategory[template.category]++;
            totalSize += template.fileSize;
        }
        return {
            totalTemplates: this.metadata.templates.length,
            byCategory,
            totalSize,
            allowedRoots: this.config.allowedRoots.length,
        };
    }
}
exports.TemplateManager = TemplateManager;
// Singleton instance
let templateManagerInstance = null;
/**
 * Get TemplateManager singleton
 */
async function getTemplateManager() {
    if (!templateManagerInstance) {
        templateManagerInstance = new TemplateManager();
        await templateManagerInstance.init();
    }
    return templateManagerInstance;
}
//# sourceMappingURL=templateManager.js.map