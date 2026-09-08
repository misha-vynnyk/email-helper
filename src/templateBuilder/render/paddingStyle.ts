import type { ContainerPadding } from "../types";

/**
 * Builds the CSS text for a Section/Row's outer padding — a zero-valued side is dropped entirely
 * (an unset `padding-right` already renders as if it were 0, so writing `padding-right: 0px;` adds
 * nothing but clutter to the exported HTML) UNLESS every side is 0 at once. That all-zero case is
 * a deliberate reset — e.g. a nested Section/Row's default padding (createDefaultSectionBlock/
 * createDefaultRowBlock: a nested instance's ancestor already constrains layout, so it explicitly
 * zeroes its own padding rather than leaving it unset) — and stays visible as a single `padding:
 * 0;` rather than silently disappearing, so the markup still documents "no padding, on purpose"
 * instead of relying on default browser/client behavior.
 */
export function buildPaddingStyle(padding: ContainerPadding): string {
  const { top, right, bottom, left } = padding;
  if (top === 0 && right === 0 && bottom === 0 && left === 0) return "padding: 0;";
  const parts: string[] = [];
  if (right !== 0) parts.push(`padding-right: ${right}px`);
  if (left !== 0) parts.push(`padding-left: ${left}px`);
  if (top !== 0) parts.push(`padding-top: ${top}px`);
  if (bottom !== 0) parts.push(`padding-bottom: ${bottom}px`);
  return `${parts.join("; ")};`;
}
