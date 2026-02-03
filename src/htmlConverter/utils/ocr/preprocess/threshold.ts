/**
 * Thresholding and contrast adjustment utilities for OCR preprocessing
 */

import { clampByte } from "./grayscale";

/**
 * Apply 3x3 box blur to grayscale image
 */
export function boxBlur3x3(gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(gray.length);
  const idx = (x: number, y: number) => y * width + x;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          sum += gray[idx(xx, yy)];
          count++;
        }
      }
      out[idx(x, y)] = Math.round(sum / count);
    }
  }
  return out;
}

/**
 * Compute optimal threshold using Otsu's method
 */
export function computeOtsuThreshold(gray: Uint8ClampedArray): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  if (total === 0) return 160;

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = -1;
  let threshold = 160;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > varMax) {
      varMax = between;
      threshold = t;
    }
  }
  return threshold;
}

/**
 * Apply contrast, brightness, and optional thresholding to grayscale image
 */
export function applyContrastAndThreshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  opts: { contrast: number; brightness: number; useThreshold: boolean; threshold: number }
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) return out;

  const img = ctx.createImageData(width, height);
  const d = img.data;
  const c = Math.max(1, Math.min(3, opts.contrast));
  const br = Math.max(0.8, Math.min(1.4, opts.brightness));
  const thr = clampByte(Math.round(opts.threshold));

  for (let p = 0, i = 0; i < d.length; i += 4, p++) {
    let v = (gray[p] - 128) * c + 128;
    v = v * br;
    v = clampByte(Math.round(v));
    if (opts.useThreshold) v = v >= thr ? 255 : 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}
