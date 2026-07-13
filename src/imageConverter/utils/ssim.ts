/**
 * Structural Similarity (SSIM) between two equal-sized ImageData buffers.
 * Used to check whether a re-encoded candidate is perceptually indistinguishable
 * from the original, so an "optimal quality" search can pick the smallest file
 * that still looks the same rather than an arbitrary size/format heuristic.
 */

const C1 = (0.01 * 255) ** 2;
const C2 = (0.03 * 255) ** 2;
const WINDOW_SIZE = 8;
const STRIDE = 4;

function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float64Array {
  const gray = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

/** Returns a value in [~0, 1] — 1 means pixel-identical, real-world "no visible difference" is usually >= 0.97-0.99. */
export function computeSSIM(a: ImageData, b: ImageData): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error("computeSSIM: inputs must have equal dimensions");
  }
  const { width, height } = a;
  if (width < WINDOW_SIZE || height < WINDOW_SIZE) return 1;

  const grayA = toGrayscale(a.data, width, height);
  const grayB = toGrayscale(b.data, width, height);

  let total = 0;
  let windows = 0;
  const n = WINDOW_SIZE * WINDOW_SIZE;

  for (let y = 0; y + WINDOW_SIZE <= height; y += STRIDE) {
    for (let x = 0; x + WINDOW_SIZE <= width; x += STRIDE) {
      let sumA = 0;
      let sumB = 0;

      for (let wy = 0; wy < WINDOW_SIZE; wy++) {
        const rowOffset = (y + wy) * width + x;
        for (let wx = 0; wx < WINDOW_SIZE; wx++) {
          sumA += grayA[rowOffset + wx];
          sumB += grayB[rowOffset + wx];
        }
      }
      const meanA = sumA / n;
      const meanB = sumB / n;

      let varA = 0;
      let varB = 0;
      let covAB = 0;

      for (let wy = 0; wy < WINDOW_SIZE; wy++) {
        const rowOffset = (y + wy) * width + x;
        for (let wx = 0; wx < WINDOW_SIZE; wx++) {
          const da = grayA[rowOffset + wx] - meanA;
          const db = grayB[rowOffset + wx] - meanB;
          varA += da * da;
          varB += db * db;
          covAB += da * db;
        }
      }
      varA /= n - 1;
      varB /= n - 1;
      covAB /= n - 1;

      const numerator = (2 * meanA * meanB + C1) * (2 * covAB + C2);
      const denominator = (meanA * meanA + meanB * meanB + C1) * (varA + varB + C2);
      total += numerator / denominator;
      windows++;
    }
  }

  return windows > 0 ? total / windows : 1;
}
