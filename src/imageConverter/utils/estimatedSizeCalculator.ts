import { ConversionSettings, ImageFormat } from "../types";

/**
 * Estimate the output file size based on settings
 * This is an approximate calculation based on format and quality
 */
export function estimateOutputSize(
  originalSize: number,
  originalFormat: string,
  settings: ConversionSettings
): number {
  if (!originalSize || originalSize === 0) return 0;

  let estimatedRatio = 1.0;

  // Base compression ratios by format
  const formatRatios: Record<ImageFormat, number> = {
    jpeg: 0.7,
    webp: 0.5, // WebP is ~30% smaller than JPEG
    avif: 0.4, // AVIF is ~50% smaller than JPEG
    png: 1.2, // PNG can be larger (lossless)
    gif: 0.8,
  };

  // Apply format ratio
  estimatedRatio *= formatRatios[settings.format] || 1.0;

  // Adjust for quality (only for lossy formats)
  if (settings.format !== "png" && !settings.autoQuality) {
    // Quality impact: lower quality = smaller size
    const qualityFactor = settings.quality / 100;
    estimatedRatio *= 0.3 + (qualityFactor * 0.7); // Range from 0.3 to 1.0
  }

  // Adjust for compression mode
  switch (settings.compressionMode) {
    case "maximum-quality":
      estimatedRatio *= 1.2;
      break;
    case "maximum-compression":
      estimatedRatio *= 0.7;
      break;
    case "lossless":
      estimatedRatio *= 1.3;
      break;
    case "balanced":
    default:
      // No adjustment
      break;
  }

  // Adjust for resize
  if (settings.resize.mode === "preset" && settings.resize.preset) {
    // Rough estimate based on dimension reduction
    // Assuming original is ~2000px, preset reduces it
    const dimensionRatio = settings.resize.preset / 2000;
    estimatedRatio *= dimensionRatio * dimensionRatio; // Area reduction
  } else if (settings.resize.mode === "custom") {
    // If custom dimensions specified, estimate reduction
    // This is very rough without knowing original dimensions
    if (settings.resize.width || settings.resize.height) {
      estimatedRatio *= 0.5; // Assume 50% reduction as rough estimate
    }
  }

  // GIF target file size
  if (settings.format === "gif" && settings.targetFileSize) {
    return settings.targetFileSize;
  }

  return Math.round(originalSize * estimatedRatio);
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

