/**
 * Block Library Constants
 * Centralized configuration and validation limits
 */

// Validation limits
export const VALIDATION = {
  MAX_BLOCK_NAME_LENGTH: 100,
  MAX_HTML_LENGTH: 50000,
  MAX_KEYWORD_LENGTH: 50,
  MIN_KEYWORDS_REQUIRED: 1,
  MAX_KEYWORDS: 20,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  CUSTOM_BLOCKS: "email-builder-custom-blocks",
  BLOCK_PATH_CONFIG: "block-path-config",
  ALLOWED_DIRECTORIES: "blockAllowedDirectories",
} as const;

// Default paths
export const DEFAULT_PATHS = {
  SRC_BLOCKS: "src/blocks",
  DATA_BLOCKS: "data/blocks/files",
} as const;

// Block operation timeouts (ms)
export const TIMEOUTS = {
  AUTO_HIDE_SUCCESS: 3000,
  AUTO_HIDE_ERROR: 5000,
  DEBOUNCE_SEARCH: 300,
} as const;

// Grid layout
export const GRID = {
  SKELETON_COUNT: 6,
  PREVIEW_HEIGHT: 180,
  MAX_KEYWORDS_DISPLAY: 3,
} as const;
