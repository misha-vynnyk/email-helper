import { ConversionResult, ConversionSettings, ImageFormat } from "../types";
import { detectImageFormat } from "./imageFormatDetector";

/**
 * Get format to use for conversion (original or specified)
 */
function getConversionFormat(file: File, settings: ConversionSettings): ImageFormat {
  if (settings.preserveFormat) {
    return detectImageFormat(file);
  }
  return settings.format;
}

/**
 * Convert image using Canvas API (client-side)
 */
export async function convertImageClient(
  file: File,
  settings: ConversionSettings
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Calculate dimensions
        let width = img.width;
        let height = img.height;

        if (settings.resize.mode === "preset" && settings.resize.preset) {
          const maxDimension = settings.resize.preset;
          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
        } else if (settings.resize.mode === "custom") {
          if (settings.resize.width && settings.resize.height) {
            if (settings.resize.preserveAspectRatio) {
              const ratio = Math.min(
                settings.resize.width / width,
                settings.resize.height / height
              );
              width = width * ratio;
              height = height * ratio;
            } else {
              width = settings.resize.width;
              height = settings.resize.height;
            }
          } else if (settings.resize.width) {
            height = (height * settings.resize.width) / width;
            width = settings.resize.width;
          } else if (settings.resize.height) {
            width = (width * settings.resize.height) / height;
            height = settings.resize.height;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Get format to use (original or specified)
        const outputFormat = getConversionFormat(file, settings);

        // Fill background for formats that don't support transparency
        if (outputFormat === "jpeg") {
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                size: blob.size,
              });
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          `image/${outputFormat}`,
          settings.quality / 100
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if format is supported by browser
 */
export function isFormatSupported(format: string): boolean {
  const canvas = document.createElement("canvas");
  const mimeType = `image/${format}`;
  return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(original: number, converted: number): number {
  return Math.round(((original - converted) / original) * 100);
}
