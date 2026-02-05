/**
 * Paste handler utilities for HTML converter
 */

import { IMAGE_EXCLUSION_ALT_REGEX } from "./constants";
import type { ProcessedImage, ImageFormat } from "./types";

/** Exclude from extraction: img with alt containing "Signature" (e.g. sign-i, sign-i-e) */
export function isSignatureImageAlt(alt: string | null): boolean {
  return !!(alt && IMAGE_EXCLUSION_ALT_REGEX.test(alt));
}

export const isCrossOrigin = (src: string): boolean => {
  try {
    if (src.startsWith("data:") || src.startsWith("blob:")) return false;
    return new URL(src, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

// Utility function to detect transparency in image
export const detectTransparency = async (src: string): Promise<boolean> => {
  try {
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      // локальні до сторінки — перевіряємо як завжди
    } else {
      const urlOrigin = new URL(src, window.location.href).origin;
      if (urlOrigin !== window.location.origin) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if any pixel has alpha < 255 (transparent)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      } catch (error) {
        // If error (e.g., CORS), assume no transparency
        resolve(false);
      }
    };

    img.onerror = () => resolve(false);
    img.src = src;
  });
};

// Get final format for image based on override and auto-detection
export const getImageFormat = (image: ProcessedImage, globalFormat: ImageFormat): ImageFormat => {
  // If manual override is set (not "auto"), use it
  if (image.formatOverride && image.formatOverride !== "auto") {
    return image.formatOverride;
  }

  // Auto-detection: if has transparency, use PNG
  if (image.hasTransparency) {
    return "png";
  }

  // Otherwise use global format
  return globalFormat;
};

export const EXT_BY_FORMAT: Record<ImageFormat, string> = { jpeg: ".jpg", png: ".png" };
export const getFileExtension = (f: ImageFormat) => EXT_BY_FORMAT[f] ?? ".jpg";
