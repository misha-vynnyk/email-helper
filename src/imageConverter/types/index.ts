export type ImageFormat = "jpeg" | "webp" | "avif" | "png" | "gif";

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
  preserveFormat: boolean; // Keep original image format instead of converting
  autoQuality: boolean; // Automatically calculate optimal quality
  selectedPreset?: string; // Currently selected preset ID
  preserveExif: boolean; // Preserve EXIF metadata during conversion
  targetFileSize?: number; // Target file size in bytes (e.g., 1.5 MB = 1572864)
  gifFrameResize?: {
    enabled: boolean;
    width?: number;
    height?: number;
    preserveAspectRatio: boolean;
  };
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
  retryCount?: number; // Number of retry attempts
  startTime?: number; // When conversion started
  eta?: number; // Estimated time remaining (seconds)
  selected?: boolean; // For bulk selection
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
