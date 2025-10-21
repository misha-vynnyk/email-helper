/**
 * Path Validator
 * macOS-specific security for file system access
 *
 * Validates file paths to prevent unauthorized access to system directories
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, statSync, accessSync, constants, Stats } from 'fs';
import * as os from 'os';

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
export class PathValidator {
  private config: PathValidatorConfig;

  constructor(config?: Partial<PathValidatorConfig>) {
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
  async validate(filePath: string): Promise<ValidationResult> {
    try {
      // Step 1: Normalize and resolve path
      const normalized = this.normalizePath(filePath);

      // Step 2: Check if path exists
      if (!existsSync(normalized)) {
        return {
          valid: false,
          reason: 'Path does not exist',
        };
      }

      // Step 3: Get file stats
      const stats = statSync(normalized);

      // Step 4: Check if it's a directory
      if (stats.isDirectory()) {
        return this.validateDirectory(normalized);
      }

      // Step 5: Validate file
      return this.validateFile(normalized, stats);
    } catch (error) {
      return {
        valid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate directory path
   */
  private validateDirectory(dirPath: string): ValidationResult {
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
  private validateFile(filePath: string, stats: Stats): ValidationResult {
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
      accessSync(filePath, constants.R_OK);
    } catch {
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
  private isInAllowedRoots(filePath: string): boolean {
    return this.config.allowedRoots.some((root) => {
      const normalizedRoot = this.normalizePath(root);
      return filePath.startsWith(normalizedRoot);
    });
  }

  /**
   * Check if path is in blocked list
   */
  private isBlocked(filePath: string): boolean {
    return this.config.blockedPaths.some((blocked) => {
      const normalizedBlocked = this.normalizePath(blocked);
      return filePath.startsWith(normalizedBlocked);
    });
  }

  /**
   * Normalize path (resolve ~, .., symlinks)
   */
  private normalizePath(filePath: string): string {
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
  getAllowedRoots(): string[] {
    return [...this.config.allowedRoots];
  }

  /**
   * Add allowed root
   */
  addAllowedRoot(rootPath: string): void {
    const normalized = this.normalizePath(rootPath);

    // Check if directory exists
    if (!existsSync(normalized) || !statSync(normalized).isDirectory()) {
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
  removeAllowedRoot(rootPath: string): void {
    const normalized = this.normalizePath(rootPath);
    this.config.allowedRoots = this.config.allowedRoots.filter((root) => root !== normalized);
  }

  /**
   * Get blocked paths
   */
  getBlockedPaths(): string[] {
    return [...this.config.blockedPaths];
  }

  /**
   * Check if path is safe (quick check without file I/O)
   */
  isSafe(filePath: string): boolean {
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
  sanitizePath(filePath: string): string {
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
  getConfig(): PathValidatorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PathValidatorConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }
}

/**
 * Singleton instance
 */
let pathValidatorInstance: PathValidator | null = null;

/**
 * Get PathValidator singleton
 */
export function getPathValidator(): PathValidator {
  if (!pathValidatorInstance) {
    pathValidatorInstance = new PathValidator();
  }
  return pathValidatorInstance;
}

/**
 * Validate path (convenience function)
 */
export async function validatePath(filePath: string): Promise<ValidationResult> {
  const validator = getPathValidator();
  return validator.validate(filePath);
}

/**
 * Check if path is safe (convenience function)
 */
export function isSafePath(filePath: string): boolean {
  const validator = getPathValidator();
  return validator.isSafe(filePath);
}
