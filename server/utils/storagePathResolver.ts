/**
 * Universal Storage Path Resolver
 * Cross-platform storage paths for Windows, macOS, and Linux
 * Supports environment variable overrides and localStorage configuration
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface AppPaths {
  data: string; // User data (blocks, templates)
  config: string; // Configuration files
  cache: string; // Temporary/cache
  logs: string; // Log files
}

export interface StoragePaths {
  customBlocks: string; // JSON custom blocks
  blockFiles: string; // TypeScript block files
  templates: string; // Email templates
  templateMetadata: string; // Template metadata JSON
  images: string; // Uploaded images
  userConfig: string; // User configuration
  logs: string; // Application logs
}

/**
 * Get OS-specific application directories
 * Follows platform conventions:
 * - macOS: ~/Library/Application Support/AppName
 * - Windows: %APPDATA%/AppName
 * - Linux: ~/.local/share/AppName (XDG Base Directory)
 */
export function getAppPaths(appName: string = 'EmailBuilder'): AppPaths {
  const homeDir = os.homedir();
  const platform = os.platform();

  let dataDir: string;
  let configDir: string;
  let cacheDir: string;
  let logsDir: string;

  switch (platform) {
    case 'darwin': // macOS
      dataDir = path.join(homeDir, 'Library', 'Application Support', appName);
      configDir = path.join(homeDir, 'Library', 'Preferences', appName);
      cacheDir = path.join(homeDir, 'Library', 'Caches', appName);
      logsDir = path.join(homeDir, 'Library', 'Logs', appName);
      break;

    case 'win32': // Windows
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
      dataDir = path.join(appData, appName);
      configDir = path.join(appData, appName);
      cacheDir = path.join(localAppData, appName, 'Cache');
      logsDir = path.join(localAppData, appName, 'Logs');
      break;

    case 'linux': // Linux (XDG Base Directory spec)
    default:
      const xdgDataHome = process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
      const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
      const xdgCacheHome = process.env.XDG_CACHE_HOME || path.join(homeDir, '.cache');
      dataDir = path.join(xdgDataHome, appName);
      configDir = path.join(xdgConfigHome, appName);
      cacheDir = path.join(xdgCacheHome, appName);
      logsDir = path.join(dataDir, 'logs');
      break;
  }

  return {
    data: dataDir,
    config: configDir,
    cache: cacheDir,
    logs: logsDir,
  };
}

/**
 * Ensure directory exists (create if needed)
 */
export async function ensureDir(dirPath: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get universal storage paths for EmailBuilder
 * Supports environment variable overrides for custom locations
 */
export function getStoragePaths(): StoragePaths {
  const appPaths = getAppPaths('EmailBuilder');

  // Allow environment variable overrides
  // Falls back to default local paths for development
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultDataDir = isDev ? path.join(process.cwd(), 'data') : appPaths.data;

  return {
    // Blocks storage
    customBlocks: process.env.CUSTOM_BLOCKS_DIR || path.join(defaultDataDir, 'blocks', 'custom'),
    blockFiles: process.env.BLOCK_FILES_DIR || path.join(defaultDataDir, 'blocks', 'files'),

    // Templates storage
    templates: process.env.TEMPLATES_DIR || path.join(defaultDataDir, 'templates'),
    templateMetadata: process.env.TEMPLATE_METADATA_PATH || path.join(appPaths.config, 'template-metadata.json'),

    // Images/assets
    images: process.env.IMAGES_DIR || path.join(defaultDataDir, 'images'),

    // User preferences
    userConfig: process.env.USER_CONFIG_PATH || path.join(appPaths.config, 'config.json'),

    // Logs
    logs: process.env.LOGS_DIR || appPaths.logs,
  };
}

/**
 * Get allowed template roots (cross-platform)
 * Supports both environment variables and localStorage configuration
 */
export function getTemplateRoots(): string[] {
  const homeDir = os.homedir();
  const platform = os.platform();

  // Default roots based on OS
  const defaultRoots: string[] = [];

  switch (platform) {
    case 'darwin': // macOS
      defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'Templates'));
      break;

    case 'win32': // Windows
      defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'Templates'));
      break;

    case 'linux': // Linux
    default:
      defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'templates'));
      break;
  }

  // Add from environment variable
  if (process.env.TEMPLATE_ROOTS) {
    const envRoots = process.env.TEMPLATE_ROOTS.split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return [...envRoots, ...defaultRoots];
  }

  // Add storage paths
  const storagePaths = getStoragePaths();
  return [storagePaths.templates, ...defaultRoots];
}

/**
 * Initialize all storage directories
 * Creates necessary folders if they don't exist
 */
export async function initializeStorage(): Promise<void> {
  const paths = getStoragePaths();

  try {
    // Create all directories
    await ensureDir(paths.customBlocks);
    await ensureDir(paths.blockFiles);
    await ensureDir(paths.templates);
    await ensureDir(paths.images);
    await ensureDir(path.dirname(paths.templateMetadata));
    await ensureDir(path.dirname(paths.userConfig));
    await ensureDir(paths.logs);

    console.log('📁 Storage initialized successfully:');
    console.log(`   Platform: ${os.platform()} (${os.arch()})`);
    console.log(`   Blocks: ${paths.customBlocks}`);
    console.log(`   Templates: ${paths.templates}`);
    console.log(`   Config: ${path.dirname(paths.userConfig)}`);
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error);
    throw error;
  }
}

/**
 * Get storage info for frontend display
 */
export function getStorageInfo(): {
  platform: string;
  paths: StoragePaths;
  templateRoots: string[];
  homeDir: string;
} {
  return {
    platform: `${os.platform()} ${os.arch()}`,
    paths: getStoragePaths(),
    templateRoots: getTemplateRoots(),
    homeDir: os.homedir(),
  };
}

/**
 * Validate if path is safe (prevent directory traversal)
 */
export function isPathSafe(requestedPath: string, allowedRoots: string[]): boolean {
  const normalizedPath = path.normalize(requestedPath);
  const absolutePath = path.isAbsolute(normalizedPath) ? normalizedPath : path.resolve(normalizedPath);

  // Check if path is within allowed roots
  return allowedRoots.some((root) => {
    const normalizedRoot = path.normalize(path.resolve(root));
    return absolutePath.startsWith(normalizedRoot);
  });
}

/**
 * Expand tilde (~) to home directory (cross-platform)
 */
export function expandTilde(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

/**
 * Convert path to platform-specific format
 */
export function toPlatformPath(filepath: string): string {
  const expanded = expandTilde(filepath);
  // Node.js path.normalize handles platform differences automatically
  return path.normalize(expanded);
}
