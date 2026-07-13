/**
 * Limits and timing constants for image converter
 */

export const LIMITS = {
  MAX_CONCURRENT_CONVERSIONS: 3,
  MAX_RETRIES: 3,
} as const;

export const TIMING = {
  QUEUE_DELAY_MS: 50,
  CONVERSION_DELAY_MS: 10,
  RETRY_BASE_MS: 1000,
  // Worker tasks have no other cancellation path — a WASM encode that never posts
  // back (e.g. an unusually slow AVIF/WebP encode near quality 100) would otherwise
  // hold that worker "busy" forever, shrinking the pool until nothing converts.
  CONVERSION_TIMEOUT_MS: 60000,
} as const;

