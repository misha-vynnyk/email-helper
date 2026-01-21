/**
 * Types for HTML Converter module
 */

// Image processing types
export type ImageFormat = "jpeg" | "webp";
export type ImageStatus = "pending" | "processing" | "done" | "error";

export interface ProcessedImage {
  id: string;
  src: string;
  name: string;
  previewUrl: string;
  convertedBlob?: Blob;
  originalSize: number;
  convertedSize?: number;
  status: ImageStatus;
  error?: string;
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
