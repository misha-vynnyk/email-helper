import type { RowColumn, RowNode } from "../types";
import { renderChildRows, type Viewport } from "./renderNode";

// Matches masterShell.ts's own 600px "Inner" content table — the assumed available width a
// RowNode's columns are laid out against when computing each column's min-width below.
const MASTER_CONTENT_WIDTH_PX = 600;

// Side-by-side percentage columns that gracefully STACK below ~600px — the classic email
// font-size:0/display:inline-block/min-width technique (2026-08-13, see
// FIGMA_TEMPLATE_IMPORT_PLAN.md). `minWidthPx` is not authored on RowColumn — per the user's
// explicit "рендерер обчислює сам", it's derived here from the column's own `widthPercent`
// against MASTER_CONTENT_WIDTH_PX, so e.g. two 50% columns get minWidthPx=300 and naturally
// wrap to stacked once the available width drops below ~600px.
function renderColumn(column: RowColumn, viewport: Viewport): string {
  const minWidthPx = Math.round((MASTER_CONTENT_WIDTH_PX * column.widthPercent) / 100);
  const content = renderChildRows(column.children, viewport);
  return (
    `<td valign="top" align="center" class="inline-block-element" width="${column.widthPercent}%"` +
    ` style="display: inline-block; width: ${column.widthPercent}%; max-width: 100%; min-width: ${minWidthPx}px; font-size: 0; line-height: 0; mso-line-height-rule: exactly;">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">${content}</table>` +
    `</td>`
  );
}

// Self-wrapping (see SELF_WRAPPING_TYPES in renderNode.ts): the outer `<tr><td>` here carries
// no padding of its own beyond `extraBottomGapPx` (a parent frame's `gap` folded in directly,
// see the CORRECTION comment in renderNode.ts, instead of an extra wrapper `<table>`) — real
// interior spacing around a RowNode still comes from nesting it inside a Container (FrameNode),
// not from RowNode itself.
export function renderRow(node: RowNode, viewport: Viewport, extraBottomGapPx = 0): string {
  const cells = node.columns.map((column) => renderColumn(column, viewport)).join("");
  const gapDeclaration = extraBottomGapPx ? ` padding-bottom: ${extraBottomGapPx}px;` : "";
  return (
    `<tr><td style="margin: 0; padding: 0;${gapDeclaration}">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"` +
    ` style="width: 100%; min-width: 100%; font-size: 0; line-height: 0; mso-line-height-rule: exactly; text-align: center;">` +
    `<tr>${cells}</tr>` +
    `</table>` +
    `</td></tr>`
  );
}
