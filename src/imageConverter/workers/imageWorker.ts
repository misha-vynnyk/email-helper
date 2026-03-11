/**
 * Web Worker for Image Processing
 * Offloads image conversion to a separate thread for better performance
 */

import { ConversionSettings, ImageFormat } from "../types";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { encode as encodePng } from "@jsquash/png";
import { encode as encodeWebp } from "@jsquash/webp";
import { encode as encodeAvif } from "@jsquash/avif";

interface WorkerMessage {
  type: "convert";
  id: string;
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
  settings: ConversionSettings;
}

interface WorkerResponse {
  type: "success" | "error" | "progress";
  id: string;
  blob?: Blob;
  size?: number;
  error?: string;
  progress?: number;
}

/**
 * Detect image format from file name/type
 */
function detectImageFormat(fileName: string, fileType: string): ImageFormat {
  const mimeType = fileType.toLowerCase();
  const name = fileName.toLowerCase();

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpeg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("avif")) return "avif";

  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  if (extension === "avif") return "avif";

  return "jpeg";
}

/**
 * Get format to use for conversion
 */
function getConversionFormat(fileName: string, fileType: string, settings: ConversionSettings): ImageFormat {
  if (settings.preserveFormat) {
    return detectImageFormat(fileName, fileType);
  }
  return settings.format;
}

/**
 * Convert image in worker thread
 */
async function convertImage(message: WorkerMessage): Promise<Blob> {
  const { fileData, fileName, fileType, settings } = message;

  // Create blob from array buffer
  const file = new Blob([fileData], { type: fileType });

  // Create image bitmap for efficient decoding
  const imageBitmap = await createImageBitmap(file);

  // Calculate dimensions
  let width = imageBitmap.width;
  let height = imageBitmap.height;

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
        const ratio = Math.min(settings.resize.width / width, settings.resize.height / height);
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

  // Use OffscreenCanvas if available
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Get output format
  const outputFormat = getConversionFormat(fileName, fileType, settings);

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
  ctx.drawImage(imageBitmap, 0, 0, width, height);

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

  // Convert ArrayBuffer back to blob
  const blob = new Blob([buffer], { type: `image/${outputFormat}` });

  // Clean up
  imageBitmap.close();

  return blob;
}

// Worker message handler
self.addEventListener("message", async (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  try {
    // Send progress update
    self.postMessage({
      type: "progress",
      id: message.id,
      progress: 30,
    } as WorkerResponse);

    // Convert image
    const blob = await convertImage(message);

    // Send progress update
    self.postMessage({
      type: "progress",
      id: message.id,
      progress: 90,
    } as WorkerResponse);

    // Send success response
    self.postMessage({
      type: "success",
      id: message.id,
      blob,
      size: blob.size,
    } as WorkerResponse);
  } catch (error) {
    // Send error response
    self.postMessage({
      type: "error",
      id: message.id,
      error: error instanceof Error ? error.message : "Conversion failed",
    } as WorkerResponse);
  }
});

export {};
