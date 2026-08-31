/**
 * Pure crop-rect math — no DOM, unit-testable. Coordinates are normalized (0–1)
 * so the same rect works for the on-screen preview and the full-res source image.
 */

import { CropRect } from "../types";

export type CropHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Below this, corner handles overlap and the rect becomes unusable to keep resizing. */
export const MIN_CROP_SIZE = 0.05;

export function defaultCropRect(): CropRect {
  return { x: 0, y: 0, width: 1, height: 1 };
}

/** Clamps width/height into [MIN_CROP_SIZE, 1], then clamps x/y so the rect stays
 * fully inside the [0,1] unit square. */
export function clampRect(rect: CropRect): CropRect {
  const width = Math.min(Math.max(rect.width, MIN_CROP_SIZE), 1);
  const height = Math.min(Math.max(rect.height, MIN_CROP_SIZE), 1);
  const x = Math.min(Math.max(rect.x, 0), 1 - width);
  const y = Math.min(Math.max(rect.y, 0), 1 - height);
  return { x, y, width, height };
}

/** Moves the whole rect by a normalized delta, clamped to stay in bounds. */
export function moveRect(rect: CropRect, dx: number, dy: number): CropRect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy });
}

/** Resizes `rect` by dragging one of the 8 handles by a normalized (dx, dy),
 * where (dx, dy) is the cumulative delta from the drag's starting point. */
export function resizeRectByHandle(rect: CropRect, handle: CropHandle, dx: number, dy: number): CropRect {
  let { x, y, width, height } = rect;

  if (handle.includes("e")) width += dx;
  if (handle.includes("w")) {
    width -= dx;
    x += dx;
  }
  if (handle.includes("s")) height += dy;
  if (handle.includes("n")) {
    height -= dy;
    y += dy;
  }

  return clampRect({ x, y, width, height });
}

/** Converts a normalized rect to integer pixel coordinates against a given image size. */
export function rectToPixels(rect: CropRect, imageWidth: number, imageHeight: number) {
  return {
    x: Math.round(rect.x * imageWidth),
    y: Math.round(rect.y * imageHeight),
    width: Math.round(rect.width * imageWidth),
    height: Math.round(rect.height * imageHeight),
  };
}

/** True when the rect covers effectively the whole image — used to skip a pointless crop. */
export function isFullRect(rect: CropRect): boolean {
  const EPSILON = 0.001;
  return rect.x <= EPSILON && rect.y <= EPSILON && rect.width >= 1 - EPSILON && rect.height >= 1 - EPSILON;
}
