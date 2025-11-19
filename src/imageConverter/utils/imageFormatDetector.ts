/**
 * Image Format Detection Utilities
 * Centralized format detection to avoid code duplication
 */

import { ImageFormat } from '../types';

/**
 * Detect image format from file
 */
export function detectImageFormat(file: File): ImageFormat {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Check MIME type first
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpeg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("avif")) return "avif";

  // Fallback to file extension
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  if (extension === "avif") return "avif";

  // Default to jpeg if unknown
  return "jpeg";
}

/**
 * Get file extension for image format
 */
export function getExtensionForFormat(format: ImageFormat): string {
  switch (format) {
    case "jpeg":
      return ".jpg";
    case "png":
      return ".png";
    case "webp":
      return ".webp";
    case "avif":
      return ".avif";
    default:
      return ".jpg";
  }
}

