/**
 * Pure buffer math — no DOM, unit-testable. macOS-Instant-Alpha-style background
 * removal: flood-fills outward from a single clicked pixel, including every
 * connected pixel whose color is within `tolerancePercent` of the seed color.
 * Deliberately NOT ML segmentation — the app's images are mostly flat/gradient
 * marketing backgrounds, where a color-similarity flood fill is both more
 * predictable and more controllable (the user drives the threshold directly)
 * than a portrait-matting model guessing at "foreground".
 *
 * Color distance is computed in OKLab, not raw RGB — RGB Euclidean distance isn't
 * perceptually uniform, which is what made the tolerance feel "abrupt": equal
 * distance steps didn't correspond to equal-looking color steps. OKLab does.
 */

import { MAX_OKLAB_DISTANCE, rgbToOklab } from "./colorSpace";

/** Extra tolerance (in the same 0-100 units) blended over, right past the hard
 * threshold, so the cutout edge isn't pixel-hard-jagged. */
const SOFT_BAND_PERCENT = 6;

/** Starting tolerance for a fresh click before any drag — small enough to only
 * catch near-exact color matches (absorbs a little JPEG noise on an otherwise-flat
 * background), growing as the user drags outward. */
export const DEFAULT_TOLERANCE = 2;

export interface OklabBuffers {
  L: Float32Array;
  a: Float32Array;
  b: Float32Array;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Converts every pixel to OKLab once, up front. Exposed separately (not just
 * inlined into computeInstantAlphaMask) so an interactive caller that recomputes
 * the mask on every drag frame — see InstantAlphaCanvas.tsx — can precompute this
 * ONE time per loaded image instead of once per frame, which is what makes native-
 * resolution live preview fast enough to stay interactive. */
export function precomputeOklab(rgba: Uint8ClampedArray, pixelCount: number): OklabBuffers {
  const L = new Float32Array(pixelCount);
  const a = new Float32Array(pixelCount);
  const b = new Float32Array(pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    const c = rgbToOklab(rgba[i], rgba[i + 1], rgba[i + 2]);
    L[p] = c.L;
    a[p] = c.a;
    b[p] = c.b;
  }
  return { L, a, b };
}

/**
 * @param oklab Precomputed via precomputeOklab(rgba, width*height).
 * @param seedX, seedY Pixel coordinates (not normalized) of the clicked point.
 * @param tolerancePercent 0-100 color-similarity threshold.
 * @returns Single-channel mask, length = width*height. 255 = kept (foreground),
 *   0 = removed (background), values in between along the feathered edge.
 */
export function computeInstantAlphaMaskFromOklab(
  oklab: OklabBuffers,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  tolerancePercent: number
): Uint8ClampedArray<ArrayBuffer> {
  const { L, a, b } = oklab;
  const threshold = (clamp(tolerancePercent, 0, 100) / 100) * MAX_OKLAB_DISTANCE;
  const softBand = (SOFT_BAND_PERCENT / 100) * MAX_OKLAB_DISTANCE;
  const pixelCount = width * height;

  const seedIndex = seedY * width + seedX;
  const sl = L[seedIndex];
  const sa = a[seedIndex];
  const sb = b[seedIndex];

  const distanceTo = (p: number): number => {
    const dl = L[p] - sl;
    const da = a[p] - sa;
    const db = b[p] - sb;
    return Math.sqrt(dl * dl + da * da + db * db);
  };

  const removed = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const stack: number[] = [seedIndex];
  visited[seedIndex] = 1;

  while (stack.length > 0) {
    const p = stack.pop()!;
    if (distanceTo(p) > threshold) continue;

    removed[p] = 1;
    const x = p % width;
    const y = (p - x) / width;

    if (x > 0 && !visited[p - 1]) {
      visited[p - 1] = 1;
      stack.push(p - 1);
    }
    if (x < width - 1 && !visited[p + 1]) {
      visited[p + 1] = 1;
      stack.push(p + 1);
    }
    if (y > 0 && !visited[p - width]) {
      visited[p - width] = 1;
      stack.push(p - width);
    }
    if (y < height - 1 && !visited[p + width]) {
      visited[p + width] = 1;
      stack.push(p + width);
    }
  }

  const mask = new Uint8ClampedArray(pixelCount).fill(255);

  for (let p = 0; p < pixelCount; p++) {
    if (removed[p]) {
      mask[p] = 0;
      continue;
    }

    // Feather only pixels bordering the removed region — any non-removed pixel
    // NOT adjacent to it is either far in color or unreachable, and stays opaque.
    const x = p % width;
    const y = (p - x) / width;
    const adjacentToRemoved =
      (x > 0 && removed[p - 1]) || (x < width - 1 && removed[p + 1]) || (y > 0 && removed[p - width]) || (y < height - 1 && removed[p + width]);
    if (!adjacentToRemoved) continue;

    const distance = distanceTo(p);
    if (distance <= threshold + softBand) {
      const t = clamp((distance - threshold) / softBand, 0, 1);
      mask[p] = Math.round(t * 255);
    }
  }

  return mask;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 >= edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Photoshop/Photopea "Color Range" style selection — every pixel is scored by its
 * own color distance to the seed, with NO connectivity requirement (unlike
 * computeInstantAlphaMaskFromOklab's flood fill). That's what lets it remove one
 * color out of a gradient with a smooth transition: a gradient's per-pixel distance
 * to the sampled color already varies continuously across the image, so the mask
 * inherits that same smooth spatial gradient instead of a flood-filled blob's hard
 * edge. Also selects every matching pixel in the image, connected or not.
 *
 * @param oklab Precomputed via precomputeOklab(rgba, width*height).
 * @param seedX, seedY Pixel coordinates (not normalized) of the clicked point.
 * @param fuzzinessPercent 0-100 — same slider/units as computeInstantAlphaMaskFromOklab's
 *   tolerance, reinterpreted as the width of the smooth falloff instead of a hard cutoff.
 * @returns Single-channel mask, length = width*height. 0 = removed (matches the seed
 *   color), 255 = kept, with a continuous ramp in between — never a hard boundary.
 */
export function computeColorRangeMaskFromOklab(
  oklab: OklabBuffers,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  fuzzinessPercent: number
): Uint8ClampedArray<ArrayBuffer> {
  const { L, a, b } = oklab;
  const fuzzinessDistance = (clamp(fuzzinessPercent, 0, 100) / 100) * MAX_OKLAB_DISTANCE;
  const pixelCount = width * height;

  const seedIndex = seedY * width + seedX;
  const sl = L[seedIndex];
  const sa = a[seedIndex];
  const sb = b[seedIndex];

  const mask = new Uint8ClampedArray(pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    const dl = L[p] - sl;
    const da = a[p] - sa;
    const db = b[p] - sb;
    const distance = Math.sqrt(dl * dl + da * da + db * db);
    mask[p] = Math.round(255 * smoothstep(0, fuzzinessDistance, distance));
  }

  return mask;
}

/** Convenience wrapper for one-off callers (tests, the final full-res bake in
 * applyBackgroundRemoval.ts via replayOperations.ts) that don't already have a
 * precomputed OklabBuffers to reuse. */
export function computeInstantAlphaMask(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  tolerancePercent: number
): Uint8ClampedArray<ArrayBuffer> {
  const oklab = precomputeOklab(rgba, width * height);
  return computeInstantAlphaMaskFromOklab(oklab, width, height, seedX, seedY, tolerancePercent);
}
