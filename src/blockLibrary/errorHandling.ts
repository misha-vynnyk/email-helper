/**
 * Error Handling Utilities for Block Library
 */

export class BlockStorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "BlockStorageError";
  }
}

export class BlockQuotaExceededError extends BlockStorageError {
  constructor(
    message: string = "Storage quota exceeded. Please delete some blocks or use file storage."
  ) {
    super(message);
    this.name = "BlockQuotaExceededError";
  }
}

export class BlockNetworkError extends BlockStorageError {
  constructor(message: string = "Network error. Please check your connection and try again.") {
    super(message);
    this.name = "BlockNetworkError";
  }
}

/**
 * Handle localStorage errors with specific error types
 */
export function handleStorageError(error: unknown): BlockStorageError {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return new BlockQuotaExceededError();
  }

  if (error instanceof Error) {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new BlockNetworkError(error.message);
    }
    return new BlockStorageError(error.message, error);
  }

  return new BlockStorageError("Unknown error occurred");
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof BlockQuotaExceededError) {
    return "💾 Storage quota exceeded. Please delete some blocks or use file storage.";
  }

  if (error instanceof BlockNetworkError) {
    return "🌐 Network error. Check your connection and try again.";
  }

  if (error instanceof BlockStorageError) {
    return `❌ ${error.message}`;
  }

  if (error instanceof Error) {
    return `❌ ${error.message}`;
  }

  return "❌ An unknown error occurred";
}
