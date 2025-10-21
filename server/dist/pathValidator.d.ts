/**
 * Path Validator
 * macOS-specific security for file system access
 *
 * Validates file paths to prevent unauthorized access to system directories
 */
/**
 * Validation Result
 */
export interface ValidationResult {
    valid: boolean;
    reason?: string;
    normalizedPath?: string;
}
/**
 * PathValidator Configuration
 */
export interface PathValidatorConfig {
    allowedRoots: string[];
    blockedPaths: string[];
    allowedExtensions: string[];
    maxFileSize: number;
    allowDirectories: boolean;
}
/**
 * Path Validator Class
 */
export declare class PathValidator {
    private config;
    constructor(config?: Partial<PathValidatorConfig>);
    /**
     * Validate a file or directory path
     */
    validate(filePath: string): Promise<ValidationResult>;
    /**
     * Validate directory path
     */
    private validateDirectory;
    /**
     * Validate file path
     */
    private validateFile;
    /**
     * Check if path is within allowed roots
     */
    private isInAllowedRoots;
    /**
     * Check if path is in blocked list
     */
    private isBlocked;
    /**
     * Normalize path (resolve ~, .., symlinks)
     */
    private normalizePath;
    /**
     * Get allowed roots
     */
    getAllowedRoots(): string[];
    /**
     * Add allowed root
     */
    addAllowedRoot(rootPath: string): void;
    /**
     * Remove allowed root
     */
    removeAllowedRoot(rootPath: string): void;
    /**
     * Get blocked paths
     */
    getBlockedPaths(): string[];
    /**
     * Check if path is safe (quick check without file I/O)
     */
    isSafe(filePath: string): boolean;
    /**
     * Sanitize path (remove dangerous characters)
     */
    sanitizePath(filePath: string): string;
    /**
     * Get configuration
     */
    getConfig(): PathValidatorConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<PathValidatorConfig>): void;
}
/**
 * Get PathValidator singleton
 */
export declare function getPathValidator(): PathValidator;
/**
 * Validate path (convenience function)
 */
export declare function validatePath(filePath: string): Promise<ValidationResult>;
/**
 * Check if path is safe (convenience function)
 */
export declare function isSafePath(filePath: string): boolean;
//# sourceMappingURL=pathValidator.d.ts.map