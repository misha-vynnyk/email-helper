/**
 * Smart Quality Optimizer
 * Calculates optimal quality based on file characteristics
 */

import { ImageFormat, ResizeOptions } from "../types";
import { WorkerPool } from "../workers/workerPool";

export interface QualityRecommendation {
  quality: number;
  reason: string;
}

export interface OptimalQualityOptions {
  /** Target output format — only jpeg/webp/avif can be perceptually searched (png has no quality knob). */
  format?: ImageFormat;
  resize?: ResizeOptions;
  backgroundColor?: string;
  /** Worker pool to run the SSIM search in; pass null/undefined to use the heuristic instead. */
  workerPool?: WorkerPool | null;
  /** SSIM threshold considered "same quality" — 0.985 is a conservative "no visible difference" bar. */
  targetSimilarity?: number;
}

const DEFAULT_TARGET_SIMILARITY = 0.985;
const SEARCHABLE_FORMATS: ImageFormat[] = ["jpeg", "webp", "avif"];

/**
 * Calculate the quality that keeps the image perceptually identical (via an SSIM
 * binary search in a worker) while minimizing size. Falls back to the static
 * heuristic below for formats without a quality knob (png) or when no worker
 * pool is available (e.g. no OffscreenCanvas support).
 */
export async function calculateOptimalQuality(file: File, options: OptimalQualityOptions = {}): Promise<QualityRecommendation> {
  const { format, resize, backgroundColor, workerPool, targetSimilarity = DEFAULT_TARGET_SIMILARITY } = options;

  if (workerPool && format && SEARCHABLE_FORMATS.includes(format)) {
    try {
      const result = await workerPool.estimateQuality(
        file,
        format,
        resize ?? { mode: "original", preserveAspectRatio: true, allowUpscale: false },
        backgroundColor ?? "#FFFFFF",
        targetSimilarity
      );
      return {
        quality: result.quality,
        reason: `Perceptual match (SSIM ${result.ssim.toFixed(3)}) — smallest size with no visible difference`,
      };
    } catch {
      // Worker unavailable/failed for this file — fall back to the heuristic below.
    }
  }

  return calculateOptimalQualityHeuristic(file);
}

/**
 * Static fallback: estimates quality from file size/dimensions/type alone,
 * with no comparison against the actual output. Used when a perceptual
 * search isn't possible (png target, no worker support, or search failure).
 */
async function calculateOptimalQualityHeuristic(file: File): Promise<QualityRecommendation> {
  const size = file.size;
  const type = file.type.toLowerCase();

  // Get image dimensions
  const dimensions = await getImageDimensions(file);
  const pixelCount = dimensions.width * dimensions.height;

  // Very small files - preserve quality
  if (size < 50_000) {
    return {
      quality: 95,
      reason: "Small file size - preserving quality",
    };
  }

  // Small images (thumbnails/icons) - high quality
  if (pixelCount < 100_000) {
    // Less than ~316x316
    return {
      quality: 90,
      reason: "Small dimensions - high quality recommended",
    };
  }

  // Large files need more compression
  if (size > 5_000_000) {
    // > 5MB
    return {
      quality: 70,
      reason: "Large file - aggressive compression",
    };
  }

  if (size > 2_000_000) {
    // > 2MB
    return {
      quality: 75,
      reason: "Large file - moderate compression",
    };
  }

  // PNG files - typically already optimized
  if (type.includes("png")) {
    return {
      quality: 85,
      reason: "PNG format - balanced compression",
    };
  }

  // WebP - can handle lower quality well
  if (type.includes("webp")) {
    return {
      quality: 80,
      reason: "WebP format - efficient compression",
    };
  }

  // High resolution photos
  if (pixelCount > 2_000_000) {
    // > ~1414x1414
    return {
      quality: 80,
      reason: "High resolution - balanced quality",
    };
  }

  // Default balanced quality
  return {
    quality: 85,
    reason: "Balanced quality for general use",
  };
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
