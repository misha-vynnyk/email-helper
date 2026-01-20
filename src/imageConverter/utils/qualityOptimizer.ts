/**
 * Smart Quality Optimizer
 * Calculates optimal quality based on file characteristics
 */

export interface QualityRecommendation {
  quality: number;
  reason: string;
}

/**
 * Calculate optimal quality for an image based on its properties
 */
export async function calculateOptimalQuality(file: File): Promise<QualityRecommendation> {
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
