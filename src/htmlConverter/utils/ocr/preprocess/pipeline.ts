/**
 * OCR preprocessing pipeline orchestration
 */

import type { GrayscaleMode } from "./grayscale";
import { toGrayscale } from "./grayscale";
import { applySharpen } from "./sharpen";
import { boxBlur3x3, applyContrastAndThreshold, computeOtsuThreshold } from "./threshold";

/**
 * Preprocess a canvas for OCR with various enhancement options
 */
export function preprocessForOcrV2(
  src: HTMLCanvasElement,
  opts: {
    grayscaleMode: GrayscaleMode;
    contrast: number;
    brightness: number;
    useThreshold: boolean;
    threshold: number;
    sharpen?: boolean;
    blur?: boolean;
    blurRadius?: number;
  }
): HTMLCanvasElement {
  const { canvas: grayCanvas, gray } = toGrayscale(src, opts.grayscaleMode);
  const blurred =
    opts.blur && opts.useThreshold
      ? (() => {
          const r = Math.max(1, Math.min(3, Math.round(opts.blurRadius ?? 1)));
          let g = gray;
          for (let i = 0; i < r; i++) g = boxBlur3x3(g, grayCanvas.width, grayCanvas.height);
          return g;
        })()
      : gray;

  const sharpened =
    opts.sharpen && grayCanvas.width * grayCanvas.height <= 2_000_000
      ? applySharpen(blurred, grayCanvas.width, grayCanvas.height)
      : blurred;
  return applyContrastAndThreshold(sharpened, grayCanvas.width, grayCanvas.height, {
    contrast: opts.contrast,
    brightness: opts.brightness,
    useThreshold: opts.useThreshold,
    threshold: opts.threshold,
  });
}

/**
 * Build multiple preprocessing passes for OCR with different modes
 */
export function buildPasses(
  canvas: HTMLCanvasElement,
  opts: {
    usePreprocess: boolean;
    contrast: number;
    brightness: number;
    useThreshold: boolean;
    fixedThr: number;
    sharpen: boolean;
    blur: boolean;
    blurRadius: number;
  }
): Array<{ id: string; canvas: HTMLCanvasElement }> {
  const { usePreprocess, contrast, brightness, useThreshold, fixedThr, sharpen, blur, blurRadius } = opts;
  const passes: Array<{ id: string; canvas: HTMLCanvasElement }> = [];

  // Always include raw as a baseline: sometimes any preprocessing hurts.
  passes.push({ id: "raw", canvas });
  if (!usePreprocess) return passes;

  passes.push({
    id: "soft-max",
    canvas: preprocessForOcrV2(canvas, {
      grayscaleMode: "max",
      contrast,
      brightness,
      useThreshold: false,
      threshold: fixedThr,
      sharpen: false,
      blur: false,
    }),
  });
  passes.push({
    id: "soft-yellow",
    canvas: preprocessForOcrV2(canvas, {
      grayscaleMode: "yellow",
      contrast,
      brightness,
      useThreshold: false,
      threshold: fixedThr,
      sharpen: false,
      blur: false,
    }),
  });
  passes.push({
    id: "soft-blue",
    canvas: preprocessForOcrV2(canvas, {
      grayscaleMode: "blue",
      contrast,
      brightness,
      useThreshold: false,
      threshold: fixedThr,
      sharpen: false,
      blur: false,
    }),
  });
  passes.push({
    id: "soft-red",
    canvas: preprocessForOcrV2(canvas, {
      grayscaleMode: "red",
      contrast,
      brightness,
      useThreshold: false,
      threshold: fixedThr,
      sharpen: false,
      blur: false,
    }),
  });

  if (useThreshold) {
    const { gray: gMax } = toGrayscale(canvas, "max");
    const { gray: gRed } = toGrayscale(canvas, "red");
    const { gray: gBlue } = toGrayscale(canvas, "blue");
    const { gray: gGreen } = toGrayscale(canvas, "green");
    const { gray: gYellow } = toGrayscale(canvas, "yellow");
    const otsuMax = computeOtsuThreshold(gMax);
    const otsuRed = computeOtsuThreshold(gRed);
    const otsuBlue = computeOtsuThreshold(gBlue);
    const otsuGreen = computeOtsuThreshold(gGreen);
    const otsuYellow = computeOtsuThreshold(gYellow);

    passes.push({
      id: "hard-otsu-max",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "max",
        contrast,
        brightness,
        useThreshold: true,
        threshold: otsuMax,
        sharpen,
        blur,
        blurRadius,
      }),
    });
    passes.push({
      id: "hard-otsu-red",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "red",
        contrast,
        brightness,
        useThreshold: true,
        threshold: otsuRed,
        sharpen,
        blur,
        blurRadius,
      }),
    });
    passes.push({
      id: "hard-otsu-blue",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "blue",
        contrast,
        brightness,
        useThreshold: true,
        threshold: otsuBlue,
        sharpen,
        blur,
        blurRadius,
      }),
    });
    passes.push({
      id: "hard-otsu-green",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "green",
        contrast,
        brightness,
        useThreshold: true,
        threshold: otsuGreen,
        sharpen,
        blur,
        blurRadius,
      }),
    });
    passes.push({
      id: "hard-otsu-yellow",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "yellow",
        contrast,
        brightness,
        useThreshold: true,
        threshold: otsuYellow,
        sharpen,
        blur,
        blurRadius,
      }),
    });
    passes.push({
      id: "hard-otsu-max-low",
      canvas: preprocessForOcrV2(canvas, {
        grayscaleMode: "max",
        contrast,
        brightness,
        useThreshold: true,
        threshold: Math.max(0, otsuMax - 25),
        sharpen,
        blur,
        blurRadius,
      }),
    });
  }

  return passes;
}

/**
 * Pick best preprocessing attempts based on ROI characteristics
 */
export function pickAttempts(
  passes: Array<{ id: string; canvas: HTMLCanvasElement }>,
  args: { isLine: boolean; aggressive: boolean }
): Array<{ id: string; canvas: HTMLCanvasElement }> {
  const preferLine = [
    // CTA/title band: blue tends to be best for white-on-orange buttons.
    "raw",
    "soft-blue",
    "soft-max",
    ...(args.aggressive ? (["hard-otsu-blue"] as const) : ([] as const)),
    "soft-yellow",
  ];
  const preferBlock = [
    // Text blocks: max/yellow are usually best; keep one hard fallback.
    "raw",
    "soft-max",
    "soft-yellow",
    "soft-blue",
    ...(args.aggressive ? (["hard-otsu-yellow"] as const) : (["soft-red"] as const)),
  ];

  const prefer = args.isLine ? preferLine : preferBlock;

  const map = new Map(passes.map((p) => [p.id, p] as const));
  const out: Array<{ id: string; canvas: HTMLCanvasElement }> = [];
  for (const id of prefer) {
    const p = map.get(id);
    if (p) out.push(p);
    if (out.length >= 5) break; // cap attempts per ROI
  }
  return out.length > 0 ? out : passes.slice(0, 5);
}
