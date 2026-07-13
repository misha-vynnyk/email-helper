/**
 * Image Format Detection Utilities
 * Centralized format detection to avoid code duplication
 */

import { ImageFormat } from '../types';

/**
 * Detect image format from a file's name/MIME type. Takes plain strings
 * (rather than a File) so it can also be called from a Web Worker message,
 * which only carries the name/type across, not the File object itself.
 */
export function detectImageFormat(fileName: string, fileType: string): ImageFormat {
  const mimeType = fileType.toLowerCase();
  const name = fileName.toLowerCase();

  // Check MIME type first
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpeg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("avif")) return "avif";
  if (mimeType.includes("gif")) return "gif";

  // Fallback to file extension
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  if (extension === "avif") return "avif";
  if (extension === "gif") return "gif";

  // Default to jpeg if unknown
  return "jpeg";
}

/** Resolve the format to actually convert to: original (if preserveFormat) or the target format. */
export function getConversionFormat(fileName: string, fileType: string, preserveFormat: boolean, targetFormat: ImageFormat): ImageFormat {
  return preserveFormat ? detectImageFormat(fileName, fileType) : targetFormat;
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
    case "gif":
      return ".gif";
    default:
      return ".jpg";
  }
}
