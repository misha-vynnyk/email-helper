/**
 * Sharpening filters for OCR preprocessing
 */

import { clampByte } from "./grayscale";

/**
 * Apply 3x3 sharpening kernel to grayscale image
 * Kernel:
 *  0 -1  0
 * -1  5 -1
 *  0 -1  0
 */
export function applySharpen(gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(gray.length);
  const idx = (x: number, y: number) => y * width + x;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = gray[idx(x, y)];
      const l = x > 0 ? gray[idx(x - 1, y)] : c;
      const r = x + 1 < width ? gray[idx(x + 1, y)] : c;
      const u = y > 0 ? gray[idx(x, y - 1)] : c;
      const d = y + 1 < height ? gray[idx(x, y + 1)] : c;
      const v = clampByte(Math.round(5 * c - l - r - u - d));
      out[idx(x, y)] = v;
    }
  }

  return out;
}
