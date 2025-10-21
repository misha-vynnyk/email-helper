"use strict";
/**
 * Path Validator
 * macOS-specific security for file system access
 *
 * Validates file paths to prevent unauthorized access to system directories
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
exports.PathValidator = void 0;
exports.getPathValidator = getPathValidator;
exports.validatePath = validatePath;
exports.isSafePath = isSafePath;
const path = __importStar(require("path"));
const fs_1 = require("fs");
const os = __importStar(require("os"));
/**
 * Path Validator Class
 */
class PathValidator {
    constructor(config) {
        const homeDir = os.homedir();
        // Default configuration for macOS
        this.config = {
            // Whitelist: User can access these directories
            // RESTRICTED: Only specific folders for security
            allowedRoots: [
                path.join(homeDir, 'Templates'),
                path.join(homeDir, 'Documents', 'EPC-Network', 'email-devs', 'Templates'), // User's work templates
            ],
            // Blacklist: System directories that should never be accessed
            blockedPaths: [
                '/System', // macOS system files
                '/Library', // System library
                '/private/etc', // System config
                '/private/var', // System var
                '/usr', // Unix system resources
                '/bin', // System binaries
                '/sbin', // System binaries
                '/Applications', // Apps (prevent reading app bundles)
                '/Volumes', // Mounted volumes (security risk)
                homeDir + '/Library', // User library (sensitive)
                homeDir + '/.Trash', // Trash folder
            ],
            // Allowed file extensions
            allowedExtensions: ['.html', '.htm'],
            // Maximum file size (5 MB)
            maxFileSize: 5 * 1024 * 1024,
            // Allow directories (for folder scanning)
            allowDirectories: true,
            ...config,
        };
    }
    /**
     * Validate a file or directory path
     */
    async validate(filePath) {
        try {
            // Step 1: Normalize and resolve path
            const normalized = this.normalizePath(filePath);
            // Step 2: Check if path exists
            if (!(0, fs_1.existsSync)(normalized)) {
                return {
                    valid: false,
                    reason: 'Path does not exist',
                };
            }
            // Step 3: Get file stats
            const stats = (0, fs_1.statSync)(normalized);
            // Step 4: Check if it's a directory
            if (stats.isDirectory()) {
                return this.validateDirectory(normalized);
            }
            // Step 5: Validate file
            return this.validateFile(normalized, stats);
        }
        catch (error) {
            return {
                valid: false,
                reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Validate directory path
     */
    validateDirectory(dirPath) {
        if (!this.config.allowDirectories) {
            return {
                valid: false,
                reason: 'Directories are not allowed',
            };
        }
        // Check if in allowed roots
        if (!this.isInAllowedRoots(dirPath)) {
            return {
                valid: false,
                reason: 'Directory not in allowed roots',
            };
        }
        // Check if blocked
        if (this.isBlocked(dirPath)) {
            return {
                valid: false,
                reason: 'System directory blocked for security',
            };
        }
        return {
            valid: true,
            normalizedPath: dirPath,
        };
    }
    /**
     * Validate file path
     */
    validateFile(filePath, stats) {
        // Check extension
        const ext = path.extname(filePath).toLowerCase();
        if (!this.config.allowedExtensions.includes(ext)) {
            return {
                valid: false,
                reason: `Invalid file extension. Allowed: ${this.config.allowedExtensions.join(', ')}`,
            };
        }
        // Check if in allowed roots
        if (!this.isInAllowedRoots(filePath)) {
            return {
                valid: false,
                reason: 'File not in allowed roots',
            };
        }
        // Check if blocked
        if (this.isBlocked(filePath)) {
            return {
                valid: false,
                reason: 'System directory blocked for security',
            };
        }
        // Check file size
        if (stats.size > this.config.maxFileSize) {
            const maxMB = this.config.maxFileSize / 1024 / 1024;
            return {
                valid: false,
                reason: `File too large (max ${maxMB.toFixed(1)} MB)`,
            };
        }
        // Check read permissions
        try {
            (0, fs_1.accessSync)(filePath, fs_1.constants.R_OK);
        }
        catch {
            return {
                valid: false,
                reason: 'No read permission',
            };
        }
        return {
            valid: true,
            normalizedPath: filePath,
        };
    }
    /**
     * Check if path is within allowed roots
     */
    isInAllowedRoots(filePath) {
        return this.config.allowedRoots.some((root) => {
            const normalizedRoot = this.normalizePath(root);
            return filePath.startsWith(normalizedRoot);
        });
    }
    /**
     * Check if path is in blocked list
     */
    isBlocked(filePath) {
        return this.config.blockedPaths.some((blocked) => {
            const normalizedBlocked = this.normalizePath(blocked);
            return filePath.startsWith(normalizedBlocked);
        });
    }
    /**
     * Normalize path (resolve ~, .., symlinks)
     */
    normalizePath(filePath) {
        // Replace ~ with home directory
        if (filePath.startsWith('~')) {
            filePath = path.join(os.homedir(), filePath.slice(1));
        }
        // Resolve to absolute path and normalize
        return path.normalize(path.resolve(filePath));
    }
    /**
     * Get allowed roots
     */
    getAllowedRoots() {
        return [...this.config.allowedRoots];
    }
    /**
     * Add allowed root
     */
    addAllowedRoot(rootPath) {
        const normalized = this.normalizePath(rootPath);
        // Check if directory exists
        if (!(0, fs_1.existsSync)(normalized) || !(0, fs_1.statSync)(normalized).isDirectory()) {
            throw new Error('Path must be an existing directory');
        }
        // Check if not blocked
        if (this.isBlocked(normalized)) {
            throw new Error('Cannot add blocked system directory');
        }
        // Add if not already present
        if (!this.config.allowedRoots.includes(normalized)) {
            this.config.allowedRoots.push(normalized);
        }
    }
    /**
     * Remove allowed root
     */
    removeAllowedRoot(rootPath) {
        const normalized = this.normalizePath(rootPath);
        this.config.allowedRoots = this.config.allowedRoots.filter((root) => root !== normalized);
    }
    /**
     * Get blocked paths
     */
    getBlockedPaths() {
        return [...this.config.blockedPaths];
    }
    /**
     * Check if path is safe (quick check without file I/O)
     */
    isSafe(filePath) {
        const normalized = this.normalizePath(filePath);
        // Must be in allowed roots
        if (!this.isInAllowedRoots(normalized)) {
            return false;
        }
        // Must not be blocked
        if (this.isBlocked(normalized)) {
            return false;
        }
        return true;
    }
    /**
     * Sanitize path (remove dangerous characters)
     */
    sanitizePath(filePath) {
        // Remove null bytes
        filePath = filePath.replace(/\0/g, '');
        // Remove control characters
        filePath = filePath.replace(/[\x00-\x1F\x7F]/g, '');
        // Normalize path separators
        filePath = filePath.replace(/\\/g, '/');
        return filePath;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates,
        };
    }
}
exports.PathValidator = PathValidator;
/**
 * Singleton instance
 */
let pathValidatorInstance = null;
/**
 * Get PathValidator singleton
 */
function getPathValidator() {
    if (!pathValidatorInstance) {
        pathValidatorInstance = new PathValidator();
    }
    return pathValidatorInstance;
}
/**
 * Validate path (convenience function)
 */
async function validatePath(filePath) {
    const validator = getPathValidator();
    return validator.validate(filePath);
}
/**
 * Check if path is safe (convenience function)
 */
function isSafePath(filePath) {
    const validator = getPathValidator();
    return validator.isSafe(filePath);
}
//# sourceMappingURL=pathValidator.js.map