/**
 * Grayscale conversion utilities for OCR preprocessing
 */

export type GrayscaleMode = "luma" | "max" | "red" | "green" | "blue" | "yellow";

/**
 * Clamp a number to valid byte range [0, 255]
 */
export function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n));
}

/**
 * Convert a canvas to grayscale using the specified mode
 * @returns Object containing the grayscale canvas and raw grayscale values
 */
export function toGrayscale(
  src: HTMLCanvasElement,
  mode: GrayscaleMode
): { canvas: HTMLCanvasElement; gray: Uint8ClampedArray } {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return { canvas: src, gray: new Uint8ClampedArray(0) };

  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  const gray = new Uint8ClampedArray(out.width * out.height);

  for (let p = 0, i = 0; i < d.length; i += 4, p++) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    let v = 0;
    if (mode === "max") v = Math.max(r, g, b);
    else if (mode === "red") v = r;
    else if (mode === "green") v = g;
    else if (mode === "blue") v = b;
    else if (mode === "yellow") v = clampByte(Math.round(((r + g) / 2) * 1.4 - b * 0.2));
    else v = Math.round((r * 3 + g * 6 + b) / 10);
    gray[p] = v;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }

  ctx.putImageData(img, 0, 0);
  return { canvas: out, gray };
}
