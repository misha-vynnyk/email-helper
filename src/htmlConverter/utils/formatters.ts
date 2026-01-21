/**
 * Formatting utilities for HTML Converter
 */

/**
 * Formats byte size to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
};

/**
 * Extracts folder name from file name input
 * Prioritizes uppercase patterns (e.g., "ABCD123")
 * Falls back to any alphanumeric pattern
 *
 * @param name - Input file name (e.g., "promo-ABCD123")
 * @returns Extracted folder name (e.g., "ABCD123")
 *
 * @example
 * extractFolderName("promo-ABCD123") // "ABCD123"
 * extractFolderName("Finance-456") // "Finance456"
 * extractFolderName("test") // ""
 */
export const extractFolderName = (name: string): string => {
  // First try to match uppercase patterns (e.g., ABCD123)
  const uppercaseMatch = name.match(/([A-Z]+\d+)/);
  if (uppercaseMatch) {
    return uppercaseMatch[1];
  }

  // Remove hyphens and try to match any alphanumeric pattern
  const cleaned = name.replace(/-/g, '');
  const match = cleaned.match(/([a-zA-Z]+\d+)/);
  return match ? match[1] : "";
};

/**
 * Formats timestamp to human-readable date/time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string (e.g., "21.01.2026, 15:30")
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Removes storage URL prefix from full URL
 * @param url - Full storage URL
 * @param prefix - URL prefix to remove
 * @returns Short path without prefix
 *
 * @example
 * getShortPath("https://storage.example.com/images/test.jpg", "https://storage.example.com/")
 * // "images/test.jpg"
 */
export const getShortPath = (url: string, prefix: string): string => {
  return url.replace(prefix, '');
};
