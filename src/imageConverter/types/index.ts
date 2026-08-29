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

/** Normalized (0–1) click point — the seed pixel an Instant-Alpha-style flood fill
 * grows from, same resolution-independence convention as CropRect. */
export interface InstantAlphaSeed {
  x: number;
  y: number;
}

/** A committed magic-wand flood-fill selection — macOS-Instant-Alpha-style
 * click-and-drag background removal, not ML segmentation. */
export interface InstantAlphaPick {
  type: "pick";
  seed: InstantAlphaSeed;
  tolerance: number; // 0-100
  /** true (or omitted, for existing picks) = flood-fill from the seed pixel only
   * (current Wand behavior). false = Photoshop/Photopea "Color Range" style: every
   * pixel in the image is scored by color distance to the seed, independent of
   * connectivity — the only way a gradient background fades out smoothly instead of
   * being cut as a hard-edged blob. See instantAlpha.ts's two mask functions. */
  contiguous?: boolean;
}

/** A committed manual brush stroke — touches up spots the wand missed
 * (mode "erase") or wrongly removed (mode "restore"). */
export interface BrushStroke {
  type: "stroke";
  points: InstantAlphaSeed[]; // normalized 0-1 path
  radius: number; // normalized, relative to image width — resolution-independent like CropRect
  mode: "erase" | "restore";
}

export type BackgroundOperation = InstantAlphaPick | BrushStroke;

export interface BackgroundEditState {
  /** Committed picks + strokes, in order. Union of picks, then strokes painted
   * on top in sequence — this ordering is also what makes "undo last" well-defined.
   * An edit "exists" iff this is non-empty — there's no separate enable/disable flag,
   * since picking up the Wand/Eraser tool and painting IS the act of removing the background. */
  operations: BackgroundOperation[];
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
