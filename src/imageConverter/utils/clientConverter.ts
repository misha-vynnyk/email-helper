import { ConversionResult, ConversionSettings, ImageFormat } from "../types";
import { detectImageFormat } from "./imageFormatDetector";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { encode as encodePng } from "@jsquash/png";
import { encode as encodeWebp } from "@jsquash/webp";
import { encode as encodeAvif } from "@jsquash/avif";

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
export async function convertImageClient(file: File, settings: ConversionSettings): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    img.onload = async () => {
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
          const isLargerThanPreset = width > maxDimension || height > maxDimension;

          if (isLargerThanPreset || settings.resize.allowUpscale) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
        } else if (settings.resize.mode === "custom") {
          const targetWidth = settings.resize.width;
          const targetHeight = settings.resize.height;

          if (targetWidth && targetHeight) {
            if (settings.resize.preserveAspectRatio) {
              const ratio = Math.min(targetWidth / width, targetHeight / height);
              const shouldScale = ratio < 1 || settings.resize.allowUpscale;
              if (shouldScale) {
                width = width * ratio;
                height = height * ratio;
              }
            } else {
              const shouldScale = (targetWidth < width || targetHeight < height) || settings.resize.allowUpscale;
              if (shouldScale) {
                width = targetWidth;
                height = targetHeight;
              }
            }
          } else if (targetWidth) {
            const ratio = targetWidth / width;
            if (ratio < 1 || settings.resize.allowUpscale) {
              height = height * ratio;
              width = targetWidth;
            }
          } else if (targetHeight) {
            const ratio = targetHeight / height;
            if (ratio < 1 || settings.resize.allowUpscale) {
              width = width * ratio;
              height = targetHeight;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Get format to use (original or specified)
        const outputFormat = getConversionFormat(file, settings);

        // Handle background based on format
        if (outputFormat === "jpeg") {
          // JPEG doesn't support transparency - fill with background color
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        } else {
          // PNG/WebP/AVIF support transparency - ensure canvas is transparent
          ctx.clearRect(0, 0, width, height);
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Get ImageData to pass to WebAssembly encoders
        const imageData = ctx.getImageData(0, 0, width, height);
        let buffer: ArrayBuffer;

        switch (outputFormat) {
          case "jpeg":
            buffer = await encodeJpeg(imageData, { quality: settings.quality });
            break;
          case "webp":
            // For max compression, increase the "method" (effort) parameter (max 6, default 4)
            // For lossless, set lossless: 1
            const webpOptions: any = { quality: settings.quality };
            if (settings.compressionMode === "lossless") {
              webpOptions.lossless = 1;
              webpOptions.quality = 100; // Force 100% quality for lossless
            } else if (settings.compressionMode === "maximum-compression") {
              webpOptions.method = 6;
            }
            buffer = await encodeWebp(imageData, webpOptions);
            break;
          case "avif":
            // avif lossless requires both quality and qualityAlpha to be 100
            // and often lossless: true (if supported by the specific encoder version)
            // For max compression, decrease speed (0 = slowest/best, 10 = fastest, default 6)
            const avifOptions: any = { quality: settings.quality };
            if (settings.compressionMode === "lossless") {
              avifOptions.lossless = true;
              avifOptions.quality = 100;
              avifOptions.qualityAlpha = 100;
            } else if (settings.compressionMode === "maximum-compression") {
              avifOptions.speed = 4; // Slower but better compression
            }
            buffer = await encodeAvif(imageData, avifOptions);
            break;
          case "png":
            buffer = await encodePng(imageData);
            break;
          default:
            buffer = await encodeJpeg(imageData, { quality: settings.quality });
            break;
        }

        const blob = new Blob([buffer], { type: `image/${outputFormat}` });

        resolve({
          blob,
          size: blob.size,
        });
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
