// Email validation constants - centralized configuration
// This file contains all hardcoded values used across the email validator

export const EMAIL_DEFAULTS = {
  // Image dimensions
  DEFAULT_IMAGE_WIDTH: 600,
  DEFAULT_IMAGE_HEIGHT: 400,
  DEFAULT_ALT_TEXT: "Image",

  // Table limits
  MAX_TABLES: 50,
  MAX_TABLE_NESTING: 5,

  // Iteration limits
  MAX_AUTOFIX_ITERATIONS: 10,
  MAX_STYLE_MERGE_ITERATIONS: 3,

  // File size limits
  MAX_FILE_SIZE_KB: 102,
  MAX_HTML_SIZE_KB: 130,
  MAX_HTML_SIZE_BYTES: 133120, // 130 * 1024

  // Cache limits
  REGEX_CACHE_SIZE: 100,
  AST_CACHE_SIZE: 50,
  TRAVERSAL_CACHE_SIZE: 50,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes

  // Cleanup intervals
  CACHE_CLEANUP_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes

  // Default styles
  DEFAULT_LINK_STYLES: "color:#0000ff; text-decoration:none;",
  DEFAULT_IMAGE_STYLES: "display:block",

  // Font sizes for headings
  HEADING_FONT_SIZES: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    h5: 16,
    h6: 14,
  } as const,

  // Email client specific
  TARGET_CLIENTS: {
    outlook: true,
    gmail: true,
    applemail: true,
    thunderbird: false,
    mobile: true,
  } as const,
} as const;

// Performance and memory management constants
export const PERFORMANCE_CONSTANTS = {
  // HTML Parser limits
  MAX_PARSER_ITERATIONS: 1000,
  MAX_PARSER_DEPTH: 100,
  MAX_PARSER_SAFETY_COUNTER: 10000,

  // Validation limits
  MAX_VALIDATION_RESULTS: 1000,
  MAX_TRAVERSAL_RESULTS: 1000,

  // Autofix limits
  MAX_AUTOFIX_ITERATIONS: 50, // Збільшено для кращого покриття всіх правил
  MAX_AUTOFIX_MULTIPLE_ITERATIONS: 25,
  MAX_HTML_SIZE_INCREASE_MULTIPLIER: 3, // Дозволити більший ріст для складних виправлень
  MAX_AUTOFIX_PASSES: 3, // Максимум проходів через всі правила

  // Cache cleanup percentages
  CACHE_CLEANUP_PERCENTAGE: 0.3, // Remove 30% of cache
  CACHE_CLEANUP_PERCENTAGE_REDUCED: 0.2, // Remove 20% for history
  CACHE_CLEANUP_THRESHOLD: 0.8, // Start cleanup at 80% capacity
  CACHE_CLEANUP_PERCENTAGE_LARGE: 0.4, // Remove 40% for operation cache

  // History and statistics limits
  MAX_FIX_HISTORY_SIZE: 100,
  MAX_FIX_HISTORY_AGE_MS: 30 * 60 * 1000, // 30 minutes
  MAX_CUSTOM_RULES_SIZE: 100,

  // StringBatcher limits
  MAX_STRING_BATCHER_OPERATIONS: 50,

  // Performance thresholds (logging)
  SLOW_VALIDATION_THRESHOLD_MS: 1000,
  SLOW_AUTOFIX_THRESHOLD_MS: 2000,

  // Loop and iteration limits
  MAX_HEADING_LEVELS: 6, // h1-h6
  MAX_RECENT_FIXES_TRACKED: 10,
} as const;

// Scoring and penalty constants
export const SCORING_CONSTANTS = {
  MAX_SCORE: 100,
  MAX_PENALTY: 100,
  ERROR_PENALTY: 20,
  WARNING_PENALTY: 10,
  INFO_PENALTY: 5,
} as const;

// Cache scoring weights for intelligent cleanup
export const CACHE_SCORING_WEIGHTS = {
  // RegexCache weights
  REGEX_ACCESS_COUNT_WEIGHT: 0.3,
  REGEX_AGE_WEIGHT: 0.7,

  // ASTCache weights
  AST_ACCESS_COUNT_WEIGHT: 0.4,
  AST_AGE_WEIGHT: 0.6,

  // TraversalCache weights
  TRAVERSAL_ACCESS_COUNT_WEIGHT: 0.2,
  TRAVERSAL_AGE_WEIGHT: 0.5,
  TRAVERSAL_SIZE_WEIGHT: 0.3,
} as const;

// Validation severity levels
export const VALIDATION_SEVERITY = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

// Validation categories
export const VALIDATION_CATEGORIES = {
  STRUCTURE: "structure",
  ACCESSIBILITY: "accessibility",
  COMPATIBILITY: "compatibility",
  PERFORMANCE: "performance",
  BEST_PRACTICE: "best-practice",
} as const;

// Common regex patterns that are reused
export const COMMON_PATTERNS = {
  STYLE_ATTRIBUTE: /style="([^"]*)"/gi,
  WIDTH_100_PERCENT: /width:\s*100%/gi,
  EMPTY_HREF: /href\s*=\s*["']?\s*["']?/gi,
  MALFORMED_SRC: /\bs\s+rc=/gi,
  // Link href patterns
  MALFORMED_HREF_NO_EQUALS: /\s+href\s+([^"\s>]+)/gi,
  MALFORMED_HREF_WITH_QUOTES: /\s+href\s+"([^"]*)"([^>]*)/gi,
  // Default values
  DEFAULT_HREF_VALUE: "urlhere",
} as const;

// HTML structure validation patterns
export const HTML_STRUCTURE_PATTERNS = {
  OPEN_TAGS: /<[^/][^>]*>/g,
  CLOSE_TAGS: /<\/[^>]*>/g,
  SELF_CLOSING_TAGS: /<[^>]*\/>/g,
  MALFORMED_TAGS: /<<|>>|<\/\/|\/\/>/g,
} as const;

// Time constants for better readability
export const TIME_CONSTANTS = {
  ONE_MINUTE_MS: 60 * 1000,
  FIVE_MINUTES_MS: 5 * 60 * 1000,
  TEN_MINUTES_MS: 10 * 60 * 1000,
  THIRTY_MINUTES_MS: 30 * 60 * 1000,
  ONE_HOUR_MS: 60 * 60 * 1000,
} as const;

// Error messages and constants
export const ERROR_MESSAGES = {
  HTML_TOO_LARGE: "HTML is too large for validation",
  HTML_TOO_LARGE_FOR_AUTOFIX: "HTML too large for autofix",
  VALIDATION_FAILED: "Validation failed",
  AUTOFIX_FAILED: "Autofix failed",
  RULE_NOT_FOUND: "Rule not found",
  INVALID_HTML_INPUT: "Invalid HTML input: must be a non-empty string",
  INVALID_RULE_NAME: "Rule name is required",
  INVALID_SEVERITY: "Invalid severity level. Must be error, warning, or info",
  INVALID_CONFIG: "Invalid configuration provided",
  VALIDATOR_DISPOSED: "EmailHTMLValidator has been disposed and cannot be used",
} as const;

// Configuration validation constants
export const CONFIG_VALIDATION = {
  MIN_HTML_SIZE_BYTES: 1,
  MIN_FILE_SIZE_KB: 1,
  VALID_SEVERITY_LEVELS: ["error", "warning", "info"] as const,
} as const;

// Logging constants
export const LOGGING_CONSTANTS = {
  SLOW_OPERATION_PREFIX: "Slow operation detected",
  CACHE_CLEANUP_PREFIX: "Cache cleanup completed",
  STATISTICS_RESET_PREFIX: "Statistics reset",
  DISPOSAL_PREFIX: "disposed successfully",
  GARBAGE_COLLECTION_PREFIX: "Garbage collection triggered",
} as const;

// Type exports for use in other files
export type ValidationSeverity = (typeof VALIDATION_SEVERITY)[keyof typeof VALIDATION_SEVERITY];
export type ValidationCategory = (typeof VALIDATION_CATEGORIES)[keyof typeof VALIDATION_CATEGORIES];
export type HeadingFontSize =
  (typeof EMAIL_DEFAULTS.HEADING_FONT_SIZES)[keyof typeof EMAIL_DEFAULTS.HEADING_FONT_SIZES];
export type TargetClient = keyof typeof EMAIL_DEFAULTS.TARGET_CLIENTS;
