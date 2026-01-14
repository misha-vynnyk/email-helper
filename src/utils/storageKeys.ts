/**
 * Centralized localStorage keys
 * All localStorage keys used in the application
 */

export const STORAGE_KEYS = {
  // Block Library
  BLOCK_STORAGE_LOCATIONS: "block-storage-locations",
  CUSTOM_BLOCKS: "customBlocks",

  // Template Library
  TEMPLATE_STORAGE_LOCATIONS: "template-storage-locations",
  TEMPLATE_ALLOWED_DIRECTORIES: "emailBuilder_allowedDirectories",
  TEMPLATE_PREVIEW_CONFIG: "preview-config",

  // Email Sender
  EMAIL_CREDENTIALS: "emailSenderCredentials",
  EMAIL_FORM_DATA: "emailSenderForm",
  EMAIL_STORAGE_TOGGLE: "emailSenderUseStorageToggle",
  EMAIL_CREDENTIALS_EXPANDED: "emailCredentialsExpanded",

  // Theme
  THEME_MODE: "themeMode",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
