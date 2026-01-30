/**
 * Error handling utilities for consistent error messages
 */

/**
 * Extracts error message from unknown error type
 * @param error - Unknown error object
 * @returns Human-readable error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return "Unknown error occurred";
};

/**
 * Logs error with context and emoji
 * @param log - Logging function to use
 * @param context - Context/description of where error occurred
 * @param error - Error object
 */
export const logError = (
  log: (msg: string) => void,
  context: string,
  error: unknown
): void => {
  const message = getErrorMessage(error);
  log(`❌ ${context}: ${message}`);
  console.error(`[${context}]`, error);
};

/**
 * Logs success message with emoji
 * @param log - Logging function to use
 * @param message - Success message
 */
export const logSuccess = (log: (msg: string) => void, message: string): void => {
  log(`✅ ${message}`);
};

/**
 * Logs warning message with emoji
 * @param log - Logging function to use
 * @param message - Warning message
 */
export const logWarning = (log: (msg: string) => void, message: string): void => {
  log(`⚠️ ${message}`);
};

/**
 * Logs info message with emoji
 * @param log - Logging function to use
 * @param message - Info message
 */
export const logInfo = (log: (msg: string) => void, message: string): void => {
  log(`ℹ️ ${message}`);
};
