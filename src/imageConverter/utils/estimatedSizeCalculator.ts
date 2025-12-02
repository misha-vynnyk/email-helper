import { ConversionSettings, ImageFormat } from "../types";

/**
 * Estimate the output file size based on settings
 * This is an improved calculation based on format, quality, and compression mode
 */
export function estimateOutputSize(
  originalSize: number,
  originalFormat: string,
  settings: ConversionSettings
): number {
  if (!originalSize || originalSize === 0) return 0;

  // GIF target file size - exact value if specified
  if (settings.format === "gif" && settings.targetFileSize) {
    return settings.targetFileSize;
  }

  let estimatedRatio = 1.0;

  // Detect original format for better estimation
  const isOriginalJpeg = originalFormat.includes("jpeg") || originalFormat.includes("jpg");
  const isOriginalPng = originalFormat.includes("png");
  const isOriginalWebp = originalFormat.includes("webp");
  const isOriginalGif = originalFormat.includes("gif");

  // Base compression ratios - adjusted based on source format
  let baseRatio = 1.0;
  
  if (settings.format === "jpeg") {
    if (isOriginalJpeg) baseRatio = 0.8; // JPEG to JPEG
    else if (isOriginalPng) baseRatio = 0.4; // PNG to JPEG (significant compression)
    else if (isOriginalWebp) baseRatio = 1.2; // WebP to JPEG (may increase)
    else baseRatio = 0.7;
  } else if (settings.format === "webp") {
    if (isOriginalJpeg) baseRatio = 0.6; // JPEG to WebP (~40% reduction)
    else if (isOriginalPng) baseRatio = 0.5; // PNG to WebP
    else if (isOriginalWebp) baseRatio = 0.9; // WebP to WebP
    else baseRatio = 0.6;
  } else if (settings.format === "avif") {
    if (isOriginalJpeg) baseRatio = 0.45; // JPEG to AVIF (~55% reduction)
    else if (isOriginalPng) baseRatio = 0.35; // PNG to AVIF
    else if (isOriginalWebp) baseRatio = 0.75; // WebP to AVIF
    else baseRatio = 0.45;
  } else if (settings.format === "png") {
    if (isOriginalPng) baseRatio = 0.95; // PNG to PNG (minimal change)
    else if (isOriginalJpeg) baseRatio = 1.5; // JPEG to PNG (may increase significantly)
    else baseRatio = 1.3;
  } else if (settings.format === "gif") {
    if (isOriginalGif) baseRatio = 0.7; // GIF to GIF (optimization)
    else baseRatio = 0.85;
  }

  estimatedRatio *= baseRatio;

  // Quality impact (for lossy formats)
  if (settings.format !== "png" && !settings.autoQuality) {
    const qualityFactor = settings.quality / 100;
    
    // More accurate quality-to-size mapping
    // Quality 100: ratio ~1.0
    // Quality 85: ratio ~0.85
    // Quality 50: ratio ~0.5
    // Quality 1: ratio ~0.2
    const qualityImpact = 0.2 + (qualityFactor * 0.8);
    estimatedRatio *= qualityImpact;
  }

  // Compression mode adjustments
  switch (settings.compressionMode) {
    case "maximum-quality":
      estimatedRatio *= 1.15; // Larger files for quality
      break;
    case "maximum-compression":
      estimatedRatio *= 0.75; // Aggressive compression
      break;
    case "lossless":
      if (settings.format === "png") {
        estimatedRatio *= 1.2;
      } else if (settings.format === "webp") {
        estimatedRatio *= 1.4; // Lossless WebP is larger
      }
      break;
    case "balanced":
    default:
      // No adjustment
      break;
  }

  // Resize impact - more accurate calculation
  if (settings.resize.mode === "preset" && settings.resize.preset) {
    // Assume typical source is 2500px wide
    const assumedOriginalDimension = 2500;
    const dimensionRatio = settings.resize.preset / assumedOriginalDimension;
    const areaRatio = dimensionRatio * dimensionRatio;
    estimatedRatio *= Math.max(0.1, areaRatio); // At least 10% of original
  } else if (settings.resize.mode === "custom") {
    if (settings.resize.width || settings.resize.height) {
      // Conservative estimate - assume 50% reduction
      estimatedRatio *= 0.5;
    }
  }

  // GIF frame resize impact
  if (settings.format === "gif" && settings.gifFrameResize?.enabled) {
    if (settings.gifFrameResize.width || settings.gifFrameResize.height) {
      estimatedRatio *= 0.6; // Frame resizing can significantly reduce size
    }
  }

  // Ensure reasonable bounds
  const estimated = Math.round(originalSize * estimatedRatio);
  
  // Minimum size (can't be less than 1KB realistically)
  const minSize = 1024;
  // Maximum size (shouldn't exceed original by more than 2x)
  const maxSize = originalSize * 2;
  
  return Math.max(minSize, Math.min(maxSize, estimated));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate estimated compression ratio
 */
export function calculateCompressionRatio(originalSize: number, estimatedSize: number): number {
  if (!originalSize || originalSize === 0) return 0;
  const reduction = ((originalSize - estimatedSize) / originalSize) * 100;
  return Math.round(Math.max(0, reduction));
}
