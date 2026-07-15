/**
 * Web Worker for Image Processing
 * Offloads image conversion to a separate thread for better performance
 */

import { ConversionSettings, ImageFormat, ResizeOptions } from "../types";
import { getConversionFormat } from "../utils/imageFormatDetector";
import { encodeAtQuality } from "../utils/jsquashEncode";
import { resizeImageData } from "../utils/resizeImageData";
import { computeSSIM } from "../utils/ssim";

interface ConvertWorkerMessage {
  type: "convert";
  id: string;
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
  settings: ConversionSettings;
}

interface EstimateQualityWorkerMessage {
  type: "estimate-quality";
  id: string;
  fileData: ArrayBuffer;
  fileType: string;
  format: ImageFormat;
  resize: ResizeOptions;
  backgroundColor: string;
  targetSimilarity: number;
}

type WorkerMessage = ConvertWorkerMessage | EstimateQualityWorkerMessage;

interface WorkerResponse {
  type: "success" | "error" | "progress" | "quality-estimated";
  id: string;
  blob?: Blob;
  size?: number;
  error?: string;
  progress?: number;
  quality?: number;
  ssim?: number;
  estimatedSize?: number;
}

/**
 * Resolve target dimensions for a resize setting, given the source size.
 */
function calculateResizedDimensions(sourceWidth: number, sourceHeight: number, resize: ResizeOptions): { width: number; height: number } {
  let width = sourceWidth;
  let height = sourceHeight;

  if (resize.mode === "preset" && resize.preset) {
    const maxDimension = resize.preset;
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
  } else if (resize.mode === "custom") {
    if (resize.width && resize.height) {
      if (resize.preserveAspectRatio) {
        const ratio = Math.min(resize.width / width, resize.height / height);
        width = width * ratio;
        height = height * ratio;
      } else {
        width = resize.width;
        height = resize.height;
      }
    } else if (resize.width) {
      height = (height * resize.width) / width;
      width = resize.width;
    } else if (resize.height) {
      width = (width * resize.height) / height;
      height = resize.height;
    }
  }

  return { width, height };
}

/** Draw a bitmap onto a fresh canvas at the given size, filling the background for opaque formats. */
function drawToCanvas(bitmap: ImageBitmap, width: number, height: number, format: ImageFormat, backgroundColor: string): ImageData {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  if (format === "jpeg") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Convert image in worker thread
 */
async function convertImage(message: ConvertWorkerMessage): Promise<Blob> {
  const { fileData, fileName, fileType, settings } = message;

  const file = new Blob([fileData], { type: fileType });
  const imageBitmap = await createImageBitmap(file);

  const outputFormat = getConversionFormat(fileName, fileType, settings.preserveFormat, settings.format);
  const { width, height } = calculateResizedDimensions(imageBitmap.width, imageBitmap.height, settings.resize);
  // Decode + composite background at native resolution first, then resize through
  // @jsquash/resize (lanczos3) — much sharper than scaling inside the drawImage call.
  const nativeData = drawToCanvas(imageBitmap, imageBitmap.width, imageBitmap.height, outputFormat, settings.backgroundColor);
  imageBitmap.close();

  const imageData = await resizeImageData(nativeData, width, height);
  const buffer = await encodeAtQuality(imageData, outputFormat, settings.quality, settings.compressionMode);

  return new Blob([buffer], { type: `image/${outputFormat}` });
}

// Bounds for the perceptual quality search — mirrors the UI's own floor so the
// "optimal quality" the search picks never lands in territory the user has to
// explicitly unlock to reach manually (see QualityControl's extreme-unlock).
const MIN_SEARCH_QUALITY = 40;
const MAX_SEARCH_QUALITY = 95;
const MAX_SEARCH_ITERATIONS = 6;
// SSIM comparisons run on a downsampled copy so a 4K source doesn't blow up
// per-iteration cost; perceptual similarity at this size still tracks the
// full-resolution result closely enough for a quality pick.
const COMPARE_MAX_DIMENSION = 600;

/**
 * Binary-search the lowest quality whose SSIM against the original still meets
 * targetSimilarity — i.e. the smallest file that still looks the same.
 * Only meaningful for lossy formats; PNG has no quality knob to search.
 * The returned `estimatedSize` is the size of the downsampled reference encode, not the
 * final full-resolution file — approximate by design; only `.quality` is used downstream
 * (the real encode at full resolution happens separately in workerPool.process()).
 */
async function estimateOptimalQuality(message: EstimateQualityWorkerMessage): Promise<{ quality: number; ssim: number; estimatedSize: number }> {
  const { fileData, fileType, format, resize, backgroundColor, targetSimilarity } = message;

  const file = new Blob([fileData], { type: fileType });
  const sourceBitmap = await createImageBitmap(file);

  const { width, height } = calculateResizedDimensions(sourceBitmap.width, sourceBitmap.height, resize);
  const fullImageData = drawToCanvas(sourceBitmap, width, height, format, backgroundColor);
  sourceBitmap.close();

  const longestSide = Math.max(width, height);
  const scale = Math.min(1, COMPARE_MAX_DIMENSION / longestSide);
  const compareWidth = Math.max(1, Math.round(width * scale));
  const compareHeight = Math.max(1, Math.round(height * scale));

  const referenceCanvas = new OffscreenCanvas(compareWidth, compareHeight);
  const referenceCtx = referenceCanvas.getContext("2d");
  if (!referenceCtx) throw new Error("Failed to get canvas context");
  const fullBitmap = await createImageBitmap(fullImageData);
  referenceCtx.drawImage(fullBitmap, 0, 0, compareWidth, compareHeight);
  fullBitmap.close();
  const referenceCompareData = referenceCtx.getImageData(0, 0, compareWidth, compareHeight);

  const ssimAt = async (buffer: ArrayBuffer): Promise<number> => {
    const blob = new Blob([buffer], { type: `image/${format}` });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(compareWidth, compareHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(bitmap, 0, 0, compareWidth, compareHeight);
    bitmap.close();
    return computeSSIM(referenceCompareData, ctx.getImageData(0, 0, compareWidth, compareHeight));
  };

  let lo = MIN_SEARCH_QUALITY;
  let hi = MAX_SEARCH_QUALITY;
  let best: { quality: number; ssim: number; estimatedSize: number } | null = null;

  for (let i = 0; i < MAX_SEARCH_ITERATIONS && lo <= hi; i++) {
    const mid = Math.round((lo + hi) / 2);
    // Encode the downsampled reference copy, not the full-resolution source — SSIM only
    // ever compares against referenceCompareData anyway (see COMPARE_MAX_DIMENSION above),
    // so a full-res encode on every search iteration was pure waste that also pushed large
    // sources past the worker timeout.
    const buffer = await encodeAtQuality(referenceCompareData, format, mid, "balanced");
    const ssim = await ssimAt(buffer);

    if (ssim >= targetSimilarity) {
      best = { quality: mid, ssim, estimatedSize: buffer.byteLength };
      hi = mid - 1; // still indistinguishable — try to shrink further
    } else {
      lo = mid + 1; // visibly degraded — need more quality
    }
  }

  if (!best) {
    // Even the top of the range didn't reach target similarity; that's the best we can offer.
    const buffer = await encodeAtQuality(referenceCompareData, format, MAX_SEARCH_QUALITY, "balanced");
    best = { quality: MAX_SEARCH_QUALITY, ssim: await ssimAt(buffer), estimatedSize: buffer.byteLength };
  }

  return best;
}

// Worker message handler
self.addEventListener("message", async (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  try {
    if (message.type === "convert") {
      self.postMessage({ type: "progress", id: message.id, progress: 30 } as WorkerResponse);
      const blob = await convertImage(message);
      self.postMessage({ type: "progress", id: message.id, progress: 90 } as WorkerResponse);
      self.postMessage({ type: "success", id: message.id, blob, size: blob.size } as WorkerResponse);
    } else {
      const { quality, ssim, estimatedSize } = await estimateOptimalQuality(message);
      self.postMessage({ type: "quality-estimated", id: message.id, quality, ssim, estimatedSize } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      id: message.id,
      error: error instanceof Error ? error.message : "Worker task failed",
    } as WorkerResponse);
  }
});

export {};
