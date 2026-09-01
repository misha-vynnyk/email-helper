/**
 * Shared jsquash encode step — the per-format option-building logic used by
 * both the main-thread client converter and the Web Worker, so an encoder
 * option change (e.g. tuning webp "method") only has to happen in one place.
 */

import { encode as encodeAvif } from "@jsquash/avif";
import type { EncodeOptions as AvifEncodeOptions } from "@jsquash/avif/meta";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { optimise as optimisePng } from "@jsquash/oxipng";
import { encode as encodePng } from "@jsquash/png";
import { encode as encodeWebp } from "@jsquash/webp";
import type { EncodeOptions as WebpEncodeOptions } from "@jsquash/webp/meta";

import { CompressionMode, ImageFormat } from "../types";

/** oxipng docs discourage going above 4 — diminishing returns for much higher WASM cost. */
async function encodePngOptimized(imageData: ImageData): Promise<ArrayBuffer> {
  const buffer = await encodePng(imageData);
  try {
    return await optimisePng(buffer, { level: 2 });
  } catch {
    // oxipng WASM failed to load/run — ship the unoptimized (but still valid) PNG.
    return buffer;
  }
}

export async function encodeAtQuality(imageData: ImageData, format: ImageFormat, quality: number, compressionMode: CompressionMode): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg":
      return encodeJpeg(imageData, { quality });
    case "webp": {
      const webpOptions: Partial<WebpEncodeOptions> = { quality };
      if (compressionMode === "lossless") {
        webpOptions.lossless = 1;
        webpOptions.quality = 100; // Force 100% quality for lossless
      }
      return encodeWebp(imageData, webpOptions);
    }
    case "avif": {
      // avif lossless requires both quality and qualityAlpha to be 100.
      const avifOptions: Omit<Partial<AvifEncodeOptions>, "bitDepth"> = { quality };
      if (compressionMode === "lossless") {
        avifOptions.lossless = true;
        avifOptions.quality = 100;
        avifOptions.qualityAlpha = 100;
      }
      return encodeAvif(imageData, avifOptions);
    }
    case "png":
      return encodePngOptimized(imageData);
    default:
      return encodeJpeg(imageData, { quality });
  }
}
