/**
 * Universal Storage Path Resolver
 * Cross-platform storage paths for Windows, macOS, and Linux
 * Supports environment variable overrides and localStorage configuration
 */
export interface AppPaths {
    data: string;
    config: string;
    cache: string;
    logs: string;
}
export interface StoragePaths {
    customBlocks: string;
    blockFiles: string;
    templates: string;
    templateMetadata: string;
    images: string;
    userConfig: string;
    logs: string;
}
/**
 * Get OS-specific application directories
 * Follows platform conventions:
 * - macOS: ~/Library/Application Support/AppName
 * - Windows: %APPDATA%/AppName
 * - Linux: ~/.local/share/AppName (XDG Base Directory)
 */
export declare function getAppPaths(appName?: string): AppPaths;
/**
 * Ensure directory exists (create if needed)
 */
export declare function ensureDir(dirPath: string): Promise<void>;
/**
 * Get universal storage paths for EmailBuilder
 * Supports environment variable overrides for custom locations
 */
export declare function getStoragePaths(): StoragePaths;
/**
 * Get allowed template roots (cross-platform)
 * Supports both environment variables and localStorage configuration
 */
export declare function getTemplateRoots(): string[];
/**
 * Initialize all storage directories
 * Creates necessary folders if they don't exist
 */
export declare function initializeStorage(): Promise<void>;
/**
 * Get storage info for frontend display
 */
export declare function getStorageInfo(): {
    platform: string;
    paths: StoragePaths;
    templateRoots: string[];
    homeDir: string;
};
/**
 * Validate if path is safe (prevent directory traversal)
 */
export declare function isPathSafe(requestedPath: string, allowedRoots: string[]): boolean;
/**
 * Expand tilde (~) to home directory (cross-platform)
 */
export declare function expandTilde(filepath: string): string;
/**
 * Convert path to platform-specific format
 */
export declare function toPlatformPath(filepath: string): string;
//# sourceMappingURL=storagePathResolver.d.ts.map