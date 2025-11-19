/**
 * Limits and timing constants for image converter
 */

export const LIMITS = {
  MAX_CONCURRENT_CONVERSIONS: 3,
  MAX_RETRIES: 3,
  MAX_HISTORY_SIZE: 50,
} as const;

export const TIMING = {
  QUEUE_DELAY_MS: 50,
  CONVERSION_DELAY_MS: 10,
  RETRY_BASE_MS: 1000,
} as const;

