/**
 * Dimension Optimizer
 * Analyzes images and suggests optimal dimensions
 */

export interface DimensionSuggestion {
  width: number;
  height: number;
  reason: string;
  category: 'thumbnail' | 'web' | 'email' | 'print' | 'original';
  estimatedSize?: string;
}

export interface ImageAnalysis {
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  isLarge: boolean;
  isSmall: boolean;
  pixelCount: number;
}

/**
 * Analyze image dimensions
 */
export async function analyzeImageDimensions(file: File): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      const pixelCount = width * height;

      let orientation: 'landscape' | 'portrait' | 'square' = 'square';
      if (aspectRatio > 1.1) orientation = 'landscape';
      else if (aspectRatio < 0.9) orientation = 'portrait';

      resolve({
        originalWidth: width,
        originalHeight: height,
        aspectRatio,
        orientation,
        isLarge: width > 1920 || height > 1080,
        isSmall: width < 500 && height < 500,
        pixelCount,
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate dimension suggestions
 */
export function generateDimensionSuggestions(
  analysis: ImageAnalysis
): DimensionSuggestion[] {
  const suggestions: DimensionSuggestion[] = [];
  const { originalWidth, originalHeight, aspectRatio, orientation, isLarge } = analysis;

  // Original (always include)
  suggestions.push({
    width: originalWidth,
    height: originalHeight,
    reason: 'Keep original dimensions',
    category: 'original',
  });

  // Thumbnail (300px longest side)
  const thumbnailSize = 300;
  if (originalWidth > thumbnailSize || originalHeight > thumbnailSize) {
    const scale = Math.min(thumbnailSize / originalWidth, thumbnailSize / originalHeight);
    suggestions.push({
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
      reason: 'Perfect for previews and thumbnails',
      category: 'thumbnail',
      estimatedSize: '< 50KB',
    });
  }

  // Email (800px longest side)
  const emailSize = 800;
  if (originalWidth > emailSize || originalHeight > emailSize) {
    const scale = Math.min(emailSize / originalWidth, emailSize / originalHeight);
    suggestions.push({
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
      reason: 'Optimized for email (fast loading)',
      category: 'email',
      estimatedSize: '< 200KB',
    });
  }

  // Web Standard (1200px longest side)
  const webSize = 1200;
  if (originalWidth > webSize || originalHeight > webSize) {
    const scale = Math.min(webSize / originalWidth, webSize / originalHeight);
    suggestions.push({
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
      reason: 'Great for websites and blogs',
      category: 'web',
      estimatedSize: '< 500KB',
    });
  }

  // Print Quality (if original is large)
  if (isLarge) {
    // Keep large for print, but suggest a reasonable max
    const printSize = 2400;
    if (originalWidth > printSize || originalHeight > printSize) {
      const scale = Math.min(printSize / originalWidth, printSize / originalHeight);
      suggestions.push({
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale),
        reason: 'High quality for printing (300 DPI at 8")',
        category: 'print',
        estimatedSize: '< 2MB',
      });
    }
  }

  // Social Media specific sizes
  if (orientation === 'landscape') {
    suggestions.push({
      width: 1200,
      height: Math.round(1200 / aspectRatio),
      reason: 'Facebook/Twitter landscape (1200x630 ideal)',
      category: 'web',
      estimatedSize: '< 300KB',
    });
  } else if (orientation === 'square') {
    suggestions.push({
      width: 1080,
      height: 1080,
      reason: 'Instagram square post',
      category: 'web',
      estimatedSize: '< 250KB',
    });
  } else if (orientation === 'portrait') {
    suggestions.push({
      width: 1080,
      height: Math.round(1080 / aspectRatio),
      reason: 'Instagram portrait (4:5 ratio)',
      category: 'web',
      estimatedSize: '< 350KB',
    });
  }

  // Remove duplicates (similar dimensions)
  const uniqueSuggestions: DimensionSuggestion[] = [];
  for (const suggestion of suggestions) {
    const isDuplicate = uniqueSuggestions.some(
      (existing) =>
        Math.abs(existing.width - suggestion.width) < 50 &&
        Math.abs(existing.height - suggestion.height) < 50
    );
    if (!isDuplicate) {
      uniqueSuggestions.push(suggestion);
    }
  }

  // Sort by size (largest first)
  return uniqueSuggestions.sort((a, b) => b.width * b.height - a.width * a.height);
}

/**
 * Get smart dimension recommendation
 */
export async function getSmartDimensionRecommendation(
  file: File,
  useCase?: 'email' | 'web' | 'social' | 'print'
): Promise<DimensionSuggestion> {
  const analysis = await analyzeImageDimensions(file);
  const suggestions = generateDimensionSuggestions(analysis);

  // Filter by use case
  if (useCase) {
    const filtered = suggestions.filter((s) => s.category === useCase);
    if (filtered.length > 0) return filtered[0];
  }

  // Default: return web-optimized if large, otherwise original
  if (analysis.isLarge) {
    const webSuggestion = suggestions.find((s) => s.category === 'web');
    if (webSuggestion) return webSuggestion;
  }

  return suggestions[0]; // Original
}
