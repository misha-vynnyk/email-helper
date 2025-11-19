/**
 * Image Analysis Utilities
 * Analyze images to determine optimal format and settings
 */

export interface ImageAnalysis {
  hasTransparency: boolean;
  hasText: boolean; // Heuristic based on sharp edges
  isPhoto: boolean;
  colors: number;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Analyze an image file to determine its characteristics
 */
export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas size (sample at lower resolution for performance)
        const sampleWidth = Math.min(img.width, 400);
        const sampleHeight = (img.height / img.width) * sampleWidth;
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

        // Analyze image properties
        const hasTransparency = detectTransparency(imageData);
        const colors = estimateColorCount(imageData);
        const hasText = detectSharpEdges(imageData);
        const isPhoto = !hasText && colors > 1000; // Photos typically have many colors and smooth gradients

        URL.revokeObjectURL(url);

        resolve({
          hasTransparency,
          hasText,
          isPhoto,
          colors,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Detect if image has transparency
 */
function detectTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  
  // Check alpha channel
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true; // Found transparent pixel
    }
  }
  
  return false;
}

/**
 * Estimate unique color count (simplified)
 */
function estimateColorCount(imageData: ImageData): number {
  const data = imageData.data;
  const colorSet = new Set<string>();
  const sampleRate = 10; // Sample every 10th pixel for performance

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Round to reduce precision (group similar colors)
    const color = `${Math.floor(r / 16)},${Math.floor(g / 16)},${Math.floor(b / 16)}`;
    colorSet.add(color);
  }

  // Estimate total colors based on sample
  return Math.min(colorSet.size * sampleRate, 16777216); // Max RGB colors
}

/**
 * Detect sharp edges (heuristic for text/graphics)
 */
function detectSharpEdges(imageData: ImageData): boolean {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let edgeCount = 0;
  const threshold = 50; // Edge detection threshold
  const sampleRate = 5;

  // Simple edge detection using Sobel-like filter
  for (let y = 1; y < height - 1; y += sampleRate) {
    for (let x = 1; x < width - 1; x += sampleRate) {
      const idx = (y * width + x) * 4;

      // Get luminance of current pixel
      const current = getLuminance(data[idx], data[idx + 1], data[idx + 2]);

      // Get luminance of right neighbor
      const right = getLuminance(
        data[idx + 4],
        data[idx + 5],
        data[idx + 6]
      );

      // Get luminance of bottom neighbor
      const bottom = getLuminance(
        data[idx + width * 4],
        data[idx + width * 4 + 1],
        data[idx + width * 4 + 2]
      );

      // Calculate gradients
      const gradientX = Math.abs(right - current);
      const gradientY = Math.abs(bottom - current);

      if (gradientX > threshold || gradientY > threshold) {
        edgeCount++;
      }
    }
  }

  // If more than 5% of sampled pixels are edges, likely contains text/graphics
  const totalSampled = ((width - 2) / sampleRate) * ((height - 2) / sampleRate);
  const edgeRatio = edgeCount / totalSampled;

  return edgeRatio > 0.05;
}

/**
 * Calculate luminance from RGB
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

