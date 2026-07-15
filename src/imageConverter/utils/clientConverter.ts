import { ConversionResult, ConversionSettings } from "../types";
import { getConversionFormat } from "./imageFormatDetector";
import { encodeAtQuality } from "./jsquashEncode";
import { resizeImageData } from "./resizeImageData";

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

        // Get format to use (original or specified)
        const outputFormat = getConversionFormat(file.name, file.type, settings.preserveFormat, settings.format);

        // Decode + composite background at native resolution first, then resize
        // through @jsquash/resize (lanczos3) — sharper than scaling inside drawImage.
        canvas.width = img.width;
        canvas.height = img.height;

        // Handle background based on format
        if (outputFormat === "jpeg") {
          // JPEG doesn't support transparency - fill with background color
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, img.width, img.height);
        } else {
          // PNG/WebP/AVIF support transparency - ensure canvas is transparent
          ctx.clearRect(0, 0, img.width, img.height);
        }

        // Draw image at native size
        ctx.drawImage(img, 0, 0);

        // Get ImageData to pass to WebAssembly encoders, then resize to target dimensions
        const nativeData = ctx.getImageData(0, 0, img.width, img.height);
        const imageData = await resizeImageData(nativeData, width, height);
        const buffer = await encodeAtQuality(imageData, outputFormat, settings.quality, settings.compressionMode);

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
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
