import type { SpacerNode } from "../types";

// Bare `<tr><td>` (no wrapping `<table>`, no `&nbsp;`) — 2026-08-19, user-confirmed correction
// against real reference markup, which also carries `class="spacer-hide"` (an existing master-
// shell utility class that hides the row entirely on mobile, per FIGMA_TEMPLATE_IMPORT_PLAN.md's
// review of html-example.html) and repeats `height` as both the HTML attribute and a CSS
// declaration alongside `line-height`. Now self-wrapping like every other leaf type (see
// SELF_WRAPPING_TYPES in renderNode.ts) — the previous nested-`<table>` version was actually
// double-wrapped when placed as a column child, since the parent already wraps bare fragments in
// their own `<tr><td>`.
export function renderSpacer(node: SpacerNode, extraBottomGapPx = 0): string {
  const gapStyle = extraBottomGapPx ? ` padding-bottom: ${extraBottomGapPx}px;` : "";
  return `<tr><td class="spacer-hide" height="${node.heightPx}" style="margin: 0; padding: 0; height: ${node.heightPx}px; line-height: ${node.heightPx}px; font-size: 0;${gapStyle}"></td></tr>`;
}
