/**
 * Constants for HTML Converter module
 */

// LocalStorage keys
export const STORAGE_KEYS = {
  IMAGE_SETTINGS: "html-converter-image-settings",
  UPLOAD_HISTORY: "html-converter-upload-history",
} as const;

// UI timing constants (in milliseconds)
export const UI_TIMINGS = {
  COPIED_FEEDBACK: 2000,        // How long to show "copied" feedback
  SNACKBAR_DURATION: 4000,      // Toast notification duration
  SUCCESS_DIALOG_CLOSE: 2000,   // Auto-close delay for success dialogs
} as const;

// Upload configuration
export const UPLOAD_CONFIG = {
  MAX_HISTORY_SESSIONS: 50,     // Maximum number of upload sessions to keep in history
  PREPARE_TIMEOUT: 30000,       // 30 seconds for file preparation
  STORAGE_TIMEOUT: 180000,      // 3 minutes for storage upload
  SERVER_TIMEOUT: 300000,       // 5 minutes for server processing
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
