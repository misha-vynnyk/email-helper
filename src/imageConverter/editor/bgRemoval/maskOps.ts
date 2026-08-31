/**
 * Pure mask math — no DOM, unit-testable. Combines multiple Instant-Alpha picks
 * and bakes manual eraser/restore brush strokes on top, in commit order.
 */

import { BrushStroke } from "../../types";

/** Pointwise minimum across masks — 0 (removed) wins, so a pixel removed by ANY
 * pick stays removed in the union. */
export function unionMasks(masks: Uint8ClampedArray[]): Uint8ClampedArray {
  if (masks.length === 0) return new Uint8ClampedArray(0);
  const out = new Uint8ClampedArray(masks[0]);
  for (let i = 1; i < masks.length; i++) {
    const other = masks[i];
    for (let p = 0; p < out.length; p++) {
      if (other[p] < out[p]) out[p] = other[p];
    }
  }
  return out;
}

/**
 * Stamps filled circles (radius in `stroke.radius`, normalized to image width)
 * along `stroke.points`, hard-setting each covered pixel to 0 (erase) or 255
 * (restore). Callers are expected to sample points densely enough during a drag
 * (e.g. every pointermove) that consecutive stamps overlap — no line interpolation
 * between points in this v1.
 */
export function paintStroke(mask: Uint8ClampedArray, width: number, height: number, stroke: BrushStroke): Uint8ClampedArray {
  const out = new Uint8ClampedArray(mask);
  const value = stroke.mode === "erase" ? 0 : 255;
  const radiusPx = Math.max(1, stroke.radius * width);
  const radiusSq = radiusPx * radiusPx;

  for (const point of stroke.points) {
    const cx = point.x * width;
    const cy = point.y * height;
    const minX = Math.max(0, Math.floor(cx - radiusPx));
    const maxX = Math.min(width - 1, Math.ceil(cx + radiusPx));
    const minY = Math.max(0, Math.floor(cy - radiusPx));
    const maxY = Math.min(height - 1, Math.ceil(cy + radiusPx));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= radiusSq) {
          out[y * width + x] = value;
        }
      }
    }
  }

  return out;
}
