/** Transfers `deltaPercent` between adjacent columns `dividerIndex` and `dividerIndex + 1`; every
 * other column is left untouched. Clamps BOTH sides of the pair to `minPercent` — since the two
 * changed values are derived to always sum to their pre-drag pair sum, `newRight` lands in
 * `[minPercent, pairSum - minPercent]` automatically whenever `newLeft` does, so dragging a
 * divider to either extreme still leaves both of its neighbors at their own floor, never below
 * it, and never touches a column outside the pair. */
export function columnWidthsAfterDividerDrag(widths: number[], dividerIndex: number, deltaPercent: number, minPercent = 8): number[] {
  const pairSum = widths[dividerIndex] + widths[dividerIndex + 1];
  const rawLeft = widths[dividerIndex] + deltaPercent;
  const newLeft = Math.max(minPercent, Math.min(pairSum - minPercent, rawLeft));
  const newRight = pairSum - newLeft;
  const next = [...widths];
  next[dividerIndex] = newLeft;
  next[dividerIndex + 1] = newRight;
  return next;
}
