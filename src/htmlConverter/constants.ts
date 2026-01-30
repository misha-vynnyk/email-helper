/**
 * Constants for HTML Converter module
 */

import storageProvidersConfig from "./storageProviders.json";

// LocalStorage keys
export const STORAGE_KEYS = {
  IMAGE_SETTINGS: "html-converter-image-settings",
  UPLOAD_HISTORY: "html-converter-upload-history",
  UI_SETTINGS: "html-converter-ui-settings",
} as const;

// Symbols
export const SYMBOLS = {
  ONE_BR: "§", // § is a symbol that is not used in HTML
} as const;

// UI timing constants (in milliseconds)
export const UI_TIMINGS = {
  COPIED_FEEDBACK: 2000, // How long to show "copied" feedback
  SNACKBAR_DURATION: 4000, // Toast notification duration
  SUCCESS_DIALOG_CLOSE: 2000, // Auto-close delay for success dialogs
  SLIDER_DEBOUNCE_MS: 400, // Wait after quality/maxWidth change before re-processing
} as const;

// Upload configuration
export const UPLOAD_CONFIG = {
  MAX_HISTORY_SESSIONS: 50, // Maximum number of upload sessions to keep in history
  SESSIONS_PER_PAGE: 5, // Number of sessions to display per page in history
  PREPARE_TIMEOUT: 30000, // 30 seconds for file preparation
  STORAGE_TIMEOUT: 180000, // 3 minutes for storage upload
  SERVER_TIMEOUT: 300000, // 5 minutes for server processing
} as const;

// Image processing defaults
export const IMAGE_DEFAULTS = {
  FORMAT: "jpeg" as const,
  QUALITY: 85,
  MAX_WIDTH: 600,
  AUTO_PROCESS: true,
  PRESERVE_FORMAT: true,
} as const;

// Storage URLs
export const STORAGE_URL_PREFIX = "https://storage.5th-elementagency.com/";

/** Exclude images with alt containing this (e.g. Signature, sign-i) from extraction & URL replacement */
export const IMAGE_EXCLUSION_ALT_REGEX = /Signature/i;

/**
 * Storage providers config (single source of truth for:
 * - consoleBaseUrl (MinIO Console)
 * - bucket/root prefixes
 * - public URL base
 * - Brave profiles (ports + userDataDir)
 *
 * Edit `src/htmlConverter/storageProviders.json` when you need to tweak paths/domains.
 */
export const STORAGE_PROVIDERS_CONFIG = storageProvidersConfig as {
  consoleBaseUrl: string;
  providers: Record<
    string,
    {
      bucket: string;
      usesCategory: boolean;
      consoleRootPrefix: string;
      loginWaitMs?: number;
      bootstrapWaitMs?: number;
      categories?: string[];
      defaultCategory?: string;
      closeTabAfterBatch?: boolean;
      publicBaseUrl: string;
      publicPathPrefix: string;
      publicRootPrefix: string;
    }
  >;
  browserProfiles?: Record<
    string,
    {
      debugPort: number;
      userDataDir: string;
      autoCloseTab?: boolean;
    }
  >;
};
export type StorageProviderKey = keyof typeof storageProvidersConfig.providers;
