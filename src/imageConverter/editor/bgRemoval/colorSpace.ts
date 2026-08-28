/**
 * Pure color math — no DOM. Converts 0-255 sRGB to OKLab, a perceptually uniform
 * color space (Björn Ottosson, https://bottosson.github.io/posts/oklab/), so equal
 * steps in color distance correspond to roughly equal steps in how different two
 * colors actually LOOK. Plain RGB Euclidean distance doesn't have that property —
 * it's why the flood-fill tolerance used to feel abrupt/uneven across an image.
 */

export interface OklabColor {
  L: number;
  a: number;
  b: number;
}

function srgbToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToOklab(r: number, g: number, b: number): OklabColor {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabDistance(c1: OklabColor, c2: OklabColor): number {
  const dl = c1.L - c2.L;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/** Empirical anchor for mapping a 0-100 tolerance to an OKLab distance threshold —
 * grayscale black-vs-white distance in OKLab is ~1.0 (see colorSpace.test.ts), a
 * reasonable "maximally different" reference point for everyday photo content. */
export const MAX_OKLAB_DISTANCE = 1.0;
