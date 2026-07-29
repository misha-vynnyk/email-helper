import type { DividerLogoNode } from "../types";
import { escapeAttr } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

// Whole snippet lifted from the user's own filled-in "divider-logo" block in
// figma-to-html/content-blocks-template.html — the outer gutter <tr><td> from that example
// is NOT reproduced here, same reasoning as renderButton.ts/renderDivider.ts.
function lineCell(node: DividerLogoNode): string {
  const thickness = node.lineThicknessPx ?? 1;
  return (
    `<td width="45%" valign="middle" style="margin: 0; padding: 0; width: 45%;">` +
    `<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width: 100%;">` +
    `<tr><td height="1" style="margin: 0; height: 1px; padding-top: 1px; border-bottom: ${thickness}px solid ${node.lineColor};"></td></tr>` +
    `</table></td>`
  );
}

export function renderDividerLogo(node: DividerLogoNode): string {
  const icon =
    `<img alt="${escapeAttr(node.iconAltDescription)}" width="${node.iconWidthPx}" src="${PLACEHOLDER_IMAGE_SRC}"` +
    ` style="border: 0; margin: 0; padding: 0; width: ${node.iconWidthPx}px; max-width: ${node.iconWidthPx}px; height: auto; display: block; object-fit: contain; object-position: center; font-size: 0;" />`;

  return (
    `<table border="0" cellpadding="0" cellspacing="0" width="${node.widthPx}" role="presentation" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%; max-width: ${node.widthPx}px;">` +
    `<tr>` +
    lineCell(node) +
    `<td align="center" valign="middle" style="margin: 0; padding-right: ${node.iconGapPx}px; padding-left: ${node.iconGapPx}px;">${icon}</td>` +
    lineCell(node) +
    `</tr></table>`
  );
}
