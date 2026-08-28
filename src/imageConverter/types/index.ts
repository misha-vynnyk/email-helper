export type ImageFormat = "jpeg" | "webp" | "avif" | "png" | "gif";

export type ProcessingMode = "client" | "server";

export type ResizeMode = "original" | "preset" | "custom";

export interface ResizeOptions {
  mode: ResizeMode;
  width?: number;
  height?: number;
  preset?: number; // 1000, 600, 464, 364
  preserveAspectRatio: boolean;
  allowUpscale: boolean;
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
  preserveExif: boolean; // Preserve EXIF metadata during conversion
}

export type ConversionStatus = "pending" | "processing" | "done" | "error";

/** Normalized (0–1) crop rectangle — resolution-independent across the on-screen
 * crop preview and the full-res source image. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BackgroundReplaceMode = "transparent" | "color" | "image";

export interface BackgroundEditState {
  removed: boolean;
  replaceMode: BackgroundReplaceMode;
  replaceColor?: string; // hex, when replaceMode === "color"
  replaceImageUrl?: string; // objectURL, when replaceMode === "image"
}

export interface ImageEditState {
  crop?: CropRect;
  background?: BackgroundEditState;
  isEdited: boolean;
  /** Kept so the editor can re-open pre-populated and "reset to original" stays possible
   * after `ImageFile.file` has been overwritten with edited bytes. */
  originalFile: File;
}

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
  edit?: ImageEditState;
}

export interface ConversionResult {
  blob: Blob;
  size: number;
}
