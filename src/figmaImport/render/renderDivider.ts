import type { DividerNode } from "../types";

// Whole snippet lifted from the user's own filled-in "divider-plain" block in
// figma-to-html/content-blocks-template.html — the outer gutter <tr><td> from that example
// is NOT reproduced here, same reasoning as renderButton.ts (parent frame's own job).
export function renderDivider(node: DividerNode): string {
  const thickness = node.thicknessPx ?? 1;
  return (
    `<table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width: 100%; max-width: 100%; padding: 0; margin: 0;">` +
    `<tr><td height="1" style="padding-top: 1px; height: 1px; border-bottom: ${thickness}px solid ${node.color};"></td></tr>` +
    `</table>`
  );
}
