export type ImageFormat = "jpeg" | "webp" | "avif" | "png";

export type ProcessingMode = "client" | "server";

export type ResizeMode = "original" | "preset" | "custom";

export interface ResizeOptions {
  mode: ResizeMode;
  width?: number;
  height?: number;
  preset?: number; // 1920, 1200, 800
  preserveAspectRatio: boolean;
}

export type CompressionMode = "balanced" | "maximum-quality" | "maximum-compression" | "lossless";

export interface ConversionSettings {
  format: ImageFormat;
  quality: number; // 1-100
  backgroundColor: string; // hex color for transparency
  resize: ResizeOptions;
  processingMode: ProcessingMode;
  compressionMode: CompressionMode;
  autoConvert: boolean; // Auto-convert on file upload
}

export type ConversionStatus = "pending" | "processing" | "done" | "error";

export interface ImageFile {
  id: string;
  file: File;
  originalSize: number;
  status: ConversionStatus;
  progress: number; // 0-100
  convertedBlob?: Blob;
  convertedSize?: number;
  error?: string;
  previewUrl?: string;
  convertedUrl?: string;
}

export interface ConversionResult {
  blob: Blob;
  size: number;
}

export interface BatchConversionStats {
  totalFiles: number;
  completed: number;
  failed: number;
  originalTotalSize: number;
  convertedTotalSize: number;
}
