/**
 * Pure buffer compositing — no DOM, unit-testable. Blends a source RGBA image with
 * a single-channel foreground mask (0 = background, 255 = foreground) against one
 * of three backgrounds: transparency, a solid color, or another RGBA image.
 */

import { BackgroundEditState } from "../../types";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  const int = parseInt(value, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/**
 * @param src RGBA source image, length = width*height*4.
 * @param mask Single-channel foreground alpha, length = width*height (0-255).
 * @param background Only "color" and "image" modes need `backgroundRgba`/`replaceColor`;
 *   "transparent" ignores both.
 * @param backgroundRgba RGBA buffer already resized to width*height, required for `replaceMode: "image"`.
 */
export function compositeBackground(
  src: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  background: BackgroundEditState,
  backgroundRgba: Uint8ClampedArray | null
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(src.length);
  const solidColor = background.replaceMode === "color" ? hexToRgb(background.replaceColor ?? "#ffffff") : null;

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const foregroundAlpha = mask[p];

    if (background.replaceMode === "transparent") {
      out[i] = src[i];
      out[i + 1] = src[i + 1];
      out[i + 2] = src[i + 2];
      out[i + 3] = Math.round((src[i + 3] * foregroundAlpha) / 255);
      continue;
    }

    const bgR = background.replaceMode === "color" ? solidColor!.r : backgroundRgba![i];
    const bgG = background.replaceMode === "color" ? solidColor!.g : backgroundRgba![i + 1];
    const bgB = background.replaceMode === "color" ? solidColor!.b : backgroundRgba![i + 2];
    const a = foregroundAlpha / 255;

    out[i] = Math.round(src[i] * a + bgR * (1 - a));
    out[i + 1] = Math.round(src[i + 1] * a + bgG * (1 - a));
    out[i + 2] = Math.round(src[i + 2] * a + bgB * (1 - a));
    out[i + 3] = 255;
  }

  return out;
}
