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
