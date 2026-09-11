/**
 * Paste handler utilities for HTML converter
 */

import { IMAGE_EXCLUSION_ALT_REGEX } from "../constants";
import type { ImageFormat,ProcessedImage } from "../types";

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
      } catch {
        // If error (e.g., CORS), assume no transparency
        resolve(false);
      }
    };

    img.onerror = () => resolve(false);
    img.src = src;
  });
};

/**
 * Parses width/height straight out of encoded image bytes (JPEG/PNG/GIF) —
 * no pixel decode, no async `<img>` load needed. Used to measure a pasted
 * image's REAL resolution synchronously at paste time (see useEditorSync),
 * instead of trusting whatever display width the source document declared.
 */
export function getImageDimensionsFromBytes(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG: 8-byte signature, then the IHDR chunk — width/height are big-endian
  // uint32 at fixed offsets 16 and 20.
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }

  // GIF: "GIF87a"/"GIF89a" header — width/height are little-endian uint16 at offset 6/8.
  if (bytes.length > 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    return { width, height };
  }

  // JPEG: scan markers after the SOI (0xFFD8) for the first SOF segment, which
  // carries height then width as big-endian uint16 right after its length field.
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break; // EOI / start-of-scan reached — no SOF found
      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/** Never upscale: cap a container's declared width down to a smaller real/declared image width, rounded down to a 10px step. */
export function capImageWidth(containerWidth: number, realWidth: number | undefined): number {
  if (!realWidth || realWidth >= containerWidth) return containerWidth;
  return Math.max(10, Math.floor(realWidth / 10) * 10);
}

/**
 * Reads the `width` HTML attribute straight off a source `<img ...>` tag string.
 * Google Docs paste keeps this even when it can't embed the real image bytes
 * (`src="[IMAGE: jpeg, N bytes]"`), since it's the doc's declared display size —
 * the only size signal available for those unresolvable images.
 */
export function extractDeclaredImageWidth(imgTag: string): number | undefined {
  const match = imgTag.match(/\swidth=["']?(\d+)(?:px)?["']?/i);
  if (!match) return undefined;
  const width = parseInt(match[1], 10);
  return Number.isFinite(width) && width > 0 ? width : undefined;
}

// Measure the real pixel dimensions of a converted image blob (used to avoid
// upscaling a low-res source image beyond its native size in the output HTML).
export const getBlobDimensions = (blob: Blob): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const cleanup = (result: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onload = () => cleanup({ width: img.width, height: img.height });
    img.onerror = () => cleanup(null);
    img.src = url;
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

export const EXT_BY_FORMAT: Record<ImageFormat, string> = { jpeg: ".jpg", png: ".png", gif: ".gif" };
export const getFileExtension = (f: ImageFormat) => EXT_BY_FORMAT[f] ?? ".jpg";
