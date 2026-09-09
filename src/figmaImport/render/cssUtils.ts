/**
 * Literal, pixel-perfect style translation helpers for the DesignNode renderer.
 * Everything here is a 1:1 mapping from schema fields to inline CSS — no VML/MSO
 * fallback branching (see "Архітектура" in FIGMA_TEMPLATE_IMPORT_PLAN.md).
 */

import type { BorderSide, CornerRadius, Fill, FrameBorder, FrameShadow } from "../types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export function fillToCss(fill: Fill): string {
  switch (fill.kind) {
    case "solid":
      return `background-color: ${fill.color};`;
    case "linearGradient": {
      const stops = fill.stops.map((stop) => `${stop.color} ${stop.position * 100}%`).join(", ");
      return `background: linear-gradient(${fill.angleDeg}deg, ${stops});`;
    }
    case "radialGradient": {
      const stops = fill.stops.map((stop) => `${stop.color} ${stop.position * 100}%`).join(", ");
      return `background: radial-gradient(${stops});`;
    }
  }
}

export function cornerRadiusToCss(radius: CornerRadius): string {
  if (typeof radius === "number") {
    return `border-radius: ${radius}px;`;
  }
  const topLeft = radius.topLeft ?? 0;
  const topRight = radius.topRight ?? 0;
  const bottomRight = radius.bottomRight ?? 0;
  const bottomLeft = radius.bottomLeft ?? 0;
  return `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`;
}

function borderSideToCss(side: BorderSide): string {
  return `${side.widthPx}px ${side.style ?? "solid"} ${side.color}`;
}

export function borderToCss(border: FrameBorder): string {
  const declarations: string[] = [];
  if (border.top) declarations.push(`border-top: ${borderSideToCss(border.top)};`);
  if (border.right) declarations.push(`border-right: ${borderSideToCss(border.right)};`);
  if (border.bottom) declarations.push(`border-bottom: ${borderSideToCss(border.bottom)};`);
  if (border.left) declarations.push(`border-left: ${borderSideToCss(border.left)};`);
  return declarations.join(" ");
}

export function shadowToCss(shadow: FrameShadow): string {
  return `box-shadow: ${shadow.xPx}px ${shadow.yPx}px ${shadow.blurPx}px ${shadow.color};`;
}

// HTML `bgcolor=` attribute alongside the CSS `background-color` from fillToCss, for legacy
// email-client redundancy (2026-08-13 rewrite). A gradient has no `bgcolor=` equivalent, so
// this returns "" for anything other than a solid fill — callers should only add the attribute
// when this returns a non-empty string.
export function bgcolorAttr(fill: Fill | undefined): string {
  if (!fill || fill.kind !== "solid") return "";
  return ` bgcolor="${fill.color}"`;
}

// `\n<!-- Name -->\n{html}\n<!-- Name end -->\n` (2026-08-14, leading/trailing `\n` added
// 2026-08-17) — the convention `templateManager.extractBlocks()` already parses. Shared here
// (not left inline in renderNode.ts) so renderCardList.ts can apply the same per-card comment
// without either duplicating the string template or creating a circular import between the two
// render modules.
//
// Leading AND trailing `\n` (2026-08-17, user feedback on a real generated file): without them,
// a nested named node's comment glues onto whatever markup immediately precedes/follows it in
// the parent's own template string — e.g. `...width: 100%;"><!-- section -->` on one line, since
// plain string concatenation has no other source of whitespace between a parent's own markup and
// an inserted child's html. Callers that need an exact-adjacency assertion (e.g. "comment sits
// directly inside this specific <td>") now assert across the newline instead of glued substrings.
export function wrapNameComment(name: string | undefined, html: string): string {
  if (!name || html === "") return html;
  return `\n<!-- ${name} -->\n${html}\n<!-- ${name} end -->\n`;
}
