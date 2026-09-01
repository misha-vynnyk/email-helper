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

/** Clamps `startGapPx + deltaPx` to `[min, max]` — unlike column widths, a Section's `gapPx` is an
 * absolute CSS pixel value, not a percentage of some container width, so the drag delta (already
 * in CSS px from `usePointerDrag`) applies directly with no container-size conversion. */
export function gapAfterDrag(startGapPx: number, deltaPx: number, min = 0, max = 200): number {
  return clamp(startGapPx + deltaPx, min, max);
}
