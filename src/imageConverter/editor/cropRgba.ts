/**
 * Pure buffer crop — no DOM, unit-testable. Kept separate from `cropMath.ts`
 * (rect math only, no buffers) but follows the same "pure" convention.
 */

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Crops a flat RGBA buffer (row-major, 4 bytes/pixel) by a pixel rect. */
export function cropRgba(src: Uint8ClampedArray, srcWidth: number, srcHeight: number, px: PixelRect): Uint8ClampedArray {
  const x = Math.max(0, Math.min(px.x, srcWidth));
  const y = Math.max(0, Math.min(px.y, srcHeight));
  const width = Math.max(0, Math.min(px.width, srcWidth - x));
  const height = Math.max(0, Math.min(px.height, srcHeight - y));

  const out = new Uint8ClampedArray(width * height * 4);
  const srcStride = srcWidth * 4;
  const outStride = width * 4;

  for (let row = 0; row < height; row++) {
    const srcOffset = (y + row) * srcStride + x * 4;
    const outOffset = row * outStride;
    out.set(src.subarray(srcOffset, srcOffset + outStride), outOffset);
  }

  return out;
}
