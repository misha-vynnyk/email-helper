/**
 * Types for HTML Converter module
 */

// Image processing types
export type ImageFormat = "jpeg" | "png";
export type ImageFormatOverride = ImageFormat | "auto";
export type ImageStatus = "pending" | "processing" | "done" | "error";

export interface ProcessedImage {
  id: string;
  src: string;
  name: string;
  customName?: string; // Custom name set by user (without extension)
  previewUrl: string;
  convertedBlob?: Blob;
  originalSize: number;
  convertedSize?: number;
  status: ImageStatus;
  error?: string;
  formatOverride?: ImageFormatOverride; // Per-image format override
  hasTransparency?: boolean; // Detected transparency
}

export interface ImageSettings {
  format: ImageFormat;
  quality: number;
  maxWidth: number;
  autoProcess: boolean;
  preserveFormat: boolean;
}

// Storage upload types
export type UploadCategory = "finance" | "health";

export interface UploadResult {
  filename: string;
  url: string;
  success: boolean;
  error?: string;
}

export interface StorageUploadResponse {
  results: UploadResult[];
  category: string;
  folderName: string;
}

// Upload history types
export interface UploadHistoryEntry {
  id: string;
  timestamp: number;
  filename: string;
  url: string;
  shortPath: string;
  category: string;
  folderName: string;
}

export interface UploadSession {
  id: string;
  timestamp: number;
  category: string;
  folderName: string;
  files: UploadHistoryEntry[];
}
