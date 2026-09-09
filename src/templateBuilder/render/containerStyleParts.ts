import { formatLinearGradientCss, type ComputedBoxStyle } from "../styling/boxStyle";
import type { ContainerFill } from "../types";
import { escapeHtml } from "./escape";

/**
 * Builds the fill/border/cornerRadius/shadow/border-collapse CSS declarations shared by Section
 * and Row's outer `<table>` — extracted out of `renderSection.ts` once `renderRow.ts` became a
 * second real consumer needing the identical logic (canva-plan-v2.md Stage 2). Same order in both
 * (fill, border, cornerRadius, shadow, border-collapse) — byte-parity with `renderSection.test.ts`
 * depends on this order never changing.
 *
 * `border-collapse: separate; border-spacing: 0;` overrides the shell's global
 * `table { border-collapse: collapse; }` (renderShell.ts) whenever a border or corner radius is
 * actually in play — border-radius doesn't render on a collapsed table regardless of border-width.
 */
export function buildContainerExtraStyleParts(computed: ComputedBoxStyle): string[] {
  const parts: string[] = [];
  if (typeof computed.fill === "string") parts.push(`background-color: ${escapeHtml(computed.fill)}`);
  else if (computed.fill) parts.push(`background: ${escapeHtml(formatLinearGradientCss(computed.fill))}`);
  if (computed.border) parts.push(`border: ${computed.border.widthPx}px solid ${escapeHtml(computed.border.color)}`);
  // Locked/uniform mode: same single-value output as before per-corner support existed. Unlocked
  // mode: CSS 4-value shorthand, top-left top-right bottom-right bottom-left — same corner order
  // styling/boxStyle.ts's toReactStyle uses for canvas, so the two renderers can never disagree on
  // which number goes where.
  if (typeof computed.cornerRadius === "number") parts.push(`border-radius: ${computed.cornerRadius}px`);
  else if (computed.cornerRadius)
    parts.push(`border-radius: ${computed.cornerRadius.topLeft}px ${computed.cornerRadius.topRight}px ${computed.cornerRadius.bottomRight}px ${computed.cornerRadius.bottomLeft}px`);
  if (computed.shadow) parts.push(`box-shadow: ${computed.shadow.xPx}px ${computed.shadow.yPx}px ${computed.shadow.blurPx}px ${escapeHtml(computed.shadow.color)}`);
  if (computed.border || computed.cornerRadius) parts.push("border-collapse: separate", "border-spacing: 0");
  return parts;
}

/** The `bgcolor="..."` HTML attribute (not CSS) — a fallback for email clients that don't apply
 * `background-color`/`background` from a style attribute. Shared by Section and Row for the same
 * reason as `buildContainerExtraStyleParts`. A gradient has no valid HTML `bgcolor` value, so it
 * falls back to the stop closest to `position: 0` (the gradient's visual start) — matching the
 * real template's own convention of pairing a plain `bgcolor` fallback with a CSS gradient for
 * capable clients. `stops` isn't guaranteed to be sorted by `position`, so this can't just take
 * `stops[0]`. */
export function buildBgcolorAttr(fill: ContainerFill | undefined): string {
  const color =
    typeof fill === "string"
      ? fill
      : fill?.stops.reduce((earliest, stop) => (stop.position < earliest.position ? stop : earliest), fill.stops[0])?.color;
  return color ? ` bgcolor="${escapeHtml(color)}"` : "";
}
