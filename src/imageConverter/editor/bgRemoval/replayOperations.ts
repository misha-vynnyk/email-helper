/**
 * Pure orchestration — no DOM. Replays a committed operation log (picks + manual
 * brush strokes, in commit order) into a single mask.
 *
 * Order matters: a stroke overrides whatever a pick decided at that pixel, and a
 * later pick can re-remove a pixel an earlier "restore" stroke brought back. That's
 * why operations are replayed one at a time against a running mask, not batched by
 * type (union-all-picks-then-paint-all-strokes would silently undo a restore that
 * chronologically came before a later pick).
 */

import { BackgroundOperation } from "../../types";
import { computeInstantAlphaMaskFromOklab, OklabBuffers } from "./instantAlpha";
import { paintStroke, unionMasks } from "./maskOps";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * @param oklab Precomputed via precomputeOklab(rgba, width*height) — callers with
 *   multiple picks in their operations log should precompute this ONCE and pass it
 *   in, rather than each pick recomputing OKLab from scratch.
 */
export function computeMaskFromOperations(oklab: OklabBuffers, width: number, height: number, operations: BackgroundOperation[]): Uint8ClampedArray {
  let mask: Uint8ClampedArray = new Uint8ClampedArray(width * height).fill(255);

  for (const op of operations) {
    if (op.type === "pick") {
      const seedX = clamp(Math.round(op.seed.x * width), 0, width - 1);
      const seedY = clamp(Math.round(op.seed.y * height), 0, height - 1);
      const pickMask = computeInstantAlphaMaskFromOklab(oklab, width, height, seedX, seedY, op.tolerance);
      mask = unionMasks([mask, pickMask]);
    } else {
      mask = paintStroke(mask, width, height, op);
    }
  }

  return mask;
}
