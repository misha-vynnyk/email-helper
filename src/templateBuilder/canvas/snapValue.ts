export interface SnapResult {
  value: number;
  snapped: boolean;
}

/**
 * Pure "snap to nearest notable value" helper for the padding-edge/gap/corner-radius/column-width
 * drag handles (canva-plan-v2.md Stage 3). Deliberately separate from `resizeMath.ts`'s clamp
 * functions rather than folded into them: each consumer clamps first (`paddingAfterEdgeDrag` etc.,
 * unchanged), then calls this on the clamped result — so a snap can never push a value outside its
 * own valid range, and `resizeMath.ts`'s existing signatures/tests don't need to change to support
 * a feature they're conceptually unrelated to.
 */
export function snapToNearest(value: number, candidates: number[], thresholdPx = 4): SnapResult {
  if (candidates.length === 0) return { value, snapped: false };
  const nearest = candidates.reduce((best, c) => (Math.abs(c - value) < Math.abs(best - value) ? c : best), candidates[0]);
  return Math.abs(nearest - value) <= thresholdPx ? { value: nearest, snapped: true } : { value, snapped: false };
}

/**
 * Shared className for the live px-value badge shown while dragging a snap-aware handle
 * (padding-edge/corner-radius in `CanvasWysiwygShell.tsx`, gap in `SpacingOverlay.tsx`) — emerald
 * when the value is currently snapped to a candidate, the same color the handle itself already
 * turns, so the badge reinforces the same signal instead of staying neutral while only the thin
 * handle strip changes color.
 */
export function snapBadgeClassName(snapped: boolean): string {
  const base = "absolute whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm border";
  return snapped ? `${base} border-emerald-400 bg-emerald-400/15 text-emerald-500` : `${base} border-border bg-card text-foreground`;
}
