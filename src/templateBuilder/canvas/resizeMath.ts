import type { ContainerPadding } from "../types";
import { evenWidthPercents } from "../types";
import { snapToNearest } from "./snapValue";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Transfers `deltaPercent` between adjacent columns `dividerIndex` and `dividerIndex + 1`; every
 * other column is left untouched. Clamps BOTH sides of the pair to `minPercent` — since the two
 * changed values are derived to always sum to their pre-drag pair sum, `newRight` lands in
 * `[minPercent, pairSum - minPercent]` automatically whenever `newLeft` does, so dragging a
 * divider to either extreme still leaves both of its neighbors at their own floor, never below
 * it, and never touches a column outside the pair. */
export function columnWidthsAfterDividerDrag(widths: number[], dividerIndex: number, deltaPercent: number, minPercent = 8): number[] {
  const pairSum = widths[dividerIndex] + widths[dividerIndex + 1];
  const newLeft = clamp(widths[dividerIndex] + deltaPercent, minPercent, pairSum - minPercent);
  const newRight = pairSum - newLeft;
  const next = [...widths];
  next[dividerIndex] = newLeft;
  next[dividerIndex + 1] = newRight;
  return next;
}

const ROUND_PERCENT_SNAP_STEPS = [25, 33, 50, 66, 75];

/** Snap-to-value pass for a column-divider drag (canva-plan-v2.md Stage 3) — applied to
 * `columnWidthsAfterDividerDrag`'s already-clamped result, not folded into it, so a snap can
 * never push a width outside its clamped range. Snaps only the divider's LEFT column
 * (`dividerIndex`) to a notable percent — round fractions (25/33/50/66/75) plus the value that
 * column would have under a perfectly even split of the row's CURRENT column count
 * (`evenWidthPercents`, already used by add/removeColumn) — then re-derives the right column as
 * `pairSum - snappedLeft` so the pair still sums to its own pre-drag total, the same invariant
 * `columnWidthsAfterDividerDrag` itself guarantees. */
export function snapColumnWidths(widths: number[], dividerIndex: number): number[] {
  const pairSum = widths[dividerIndex] + widths[dividerIndex + 1];
  const evenSplit = evenWidthPercents(widths.length)[dividerIndex];
  const snappedLeft = snapToNearest(widths[dividerIndex], [...ROUND_PERCENT_SNAP_STEPS, evenSplit]).value;
  const next = [...widths];
  next[dividerIndex] = snappedLeft;
  next[dividerIndex + 1] = pairSum - snappedLeft;
  return next;
}

/** Clamps `startGapPx + deltaPx` to `[min, max]` — unlike column widths, a Section's `gapPx` is an
 * absolute CSS pixel value, not a percentage of some container width, so the drag delta (already
 * in CSS px from `usePointerDrag`) applies directly with no container-size conversion. */
export function gapAfterDrag(startGapPx: number, deltaPx: number, min = 0, max = 200): number {
  return clamp(startGapPx + deltaPx, min, max);
}

/** Dragging a padding-edge handle OUTWARD (away from the box's center) increases that edge's
 * padding, dragging it INWARD decreases it. "Outward" is a different pointer-delta sign per edge
 * (down for bottom, up for top, right for right, left for left) — this is the one place that
 * mapping lives, so the caller (CanvasWysiwygShell) just passes the raw `deltaPx` for whichever
 * axis that edge's handle drags along (`dy` for top/bottom, `dx` for left/right), not a
 * pre-negated value. Only the dragged edge changes — the other three are untouched, unlike
 * `columnWidthsAfterDividerDrag`, which necessarily redistributes between a pair. */
export function paddingAfterEdgeDrag(padding: ContainerPadding, edge: keyof ContainerPadding, deltaPx: number, min = 0, max = 200): ContainerPadding {
  const sign = edge === "right" || edge === "bottom" ? 1 : -1;
  // Rounded to a whole pixel — `deltaPx` comes from `PointerEvent.clientX/Y`, which browsers can
  // report at sub-pixel precision (fractional device-pixel-ratio scaling, high-precision trackpad
  // input), so an unrounded value would drift the stored padding to things like `31.6px` even
  // though every other way of setting padding (the Inspector's number input, a fresh block's
  // default) only ever produces integers.
  return { ...padding, [edge]: Math.round(clamp(padding[edge] + sign * deltaPx, min, max)) };
}

/** A single corner-radius handle sits at one corner of the box; dragging it TOWARD the box's
 * center increases the radius, dragging it outward/past the corner decreases it (floored at 0,
 * never negative). `dxFromCorner`/`dyFromCorner` are the pointer's cumulative movement along each
 * axis, already re-signed by the caller so that "positive" means "toward the center" for
 * whichever corner that handle sits at (e.g. a top-left handle passes `{dx, dy}` straight through,
 * a top-right handle passes `{-dx, dy}`) — this function itself has no notion of which corner it
 * is. The radius can't be read from either axis alone (a diagonal drag that's mostly horizontal
 * shouldn't produce a huge radius just because the vertical component is small), so it takes
 * whichever axis has moved LESS toward the center — matching Figma's corner-radius handle feel,
 * where the drag is capped by the nearer edge. */
export function cornerRadiusFromPointerOffset(dxFromCorner: number, dyFromCorner: number, maxRadius = 200): number {
  // Rounded for the same reason as `paddingAfterEdgeDrag` above — pointer coordinates can be
  // sub-pixel, and every other way of setting a corner radius (Inspector input, default value)
  // only ever produces whole pixels.
  return Math.round(clamp(Math.min(dxFromCorner, dyFromCorner), 0, maxRadius));
}
