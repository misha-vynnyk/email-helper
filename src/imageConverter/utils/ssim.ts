/**
 * Structural Similarity (SSIM) between two equal-sized ImageData buffers.
 * Used to check whether a re-encoded candidate is perceptually indistinguishable
 * from the original, so an "optimal quality" search can pick the smallest file
 * that still looks the same rather than an arbitrary size/format heuristic.
 *
 * Computed per-channel in YCbCr and combined with luma-weighted averaging (not
 * grayscale-only) — a luma-only SSIM is blind to the chroma-subsampling banding
 * that AVIF/WebP specifically introduce, which let the search pick quality
 * levels with visible color artifacts as long as edges/luma stayed sharp.
 */

const C1 = (0.01 * 255) ** 2;
const C2 = (0.03 * 255) ** 2;
const WINDOW_SIZE = 8;
const STRIDE = 4;
/** Standard video-QA weighting: human perception is far more sensitive to luma than chroma. */
const LUMA_WEIGHT = 0.8;
const CHROMA_WEIGHT = 0.1;

interface YCbCrPlanes {
  y: Float64Array;
  cb: Float64Array;
  cr: Float64Array;
}

function toYCbCr(data: Uint8ClampedArray, width: number, height: number): YCbCrPlanes {
  const n = width * height;
  const y = new Float64Array(n);
  const cb = new Float64Array(n);
  const cr = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    cb[i] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    cr[i] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  return { y, cb, cr };
}

/** Windowed SSIM over a single already-extracted plane (luma or chroma). */
function ssimPlane(planeA: Float64Array, planeB: Float64Array, width: number, height: number): number {
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
          sumA += planeA[rowOffset + wx];
          sumB += planeB[rowOffset + wx];
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
          const da = planeA[rowOffset + wx] - meanA;
          const db = planeB[rowOffset + wx] - meanB;
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

/** Returns a value in [~0, 1] — 1 means pixel-identical, real-world "no visible difference" is usually >= 0.97-0.99. */
export function computeSSIM(a: ImageData, b: ImageData): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error("computeSSIM: inputs must have equal dimensions");
  }
  const { width, height } = a;
  if (width < WINDOW_SIZE || height < WINDOW_SIZE) return 1;

  const planesA = toYCbCr(a.data, width, height);
  const planesB = toYCbCr(b.data, width, height);

  const ssimY = ssimPlane(planesA.y, planesB.y, width, height);
  const ssimCb = ssimPlane(planesA.cb, planesB.cb, width, height);
  const ssimCr = ssimPlane(planesA.cr, planesB.cr, width, height);

  return LUMA_WEIGHT * ssimY + CHROMA_WEIGHT * ssimCb + CHROMA_WEIGHT * ssimCr;
}
