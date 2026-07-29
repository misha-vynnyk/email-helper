import type { HeaderImageNode } from "../types";
import { escapeAttr } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

// Whole snippet lifted from the user's own filled-in "header-single-image" block in
// figma-to-html/content-blocks-template.html. Covers the desktop/mobile-swap variant too —
// swap is two HeaderImageNode instances sharing an id, one per file via `visibility`, each
// rendered identically by this same function (see "Button/Divider/Header — цілі сніпети" in
// FIGMA_TEMPLATE_IMPORT_PLAN.md). The outer gutter <tr><td> from the example is NOT
// reproduced here — that's the parent frame's own job, same as every other node type.
export function renderHeaderImage(node: HeaderImageNode): string {
  const img =
    `<img width="${node.widthPx}" src="${PLACEHOLDER_IMAGE_SRC}" alt="${escapeAttr(node.altDescription)}"` +
    ` style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: ${node.widthPx}px; height: auto; object-position: center; object-fit: contain;" />`;

  if (!node.href) return img;
  return (
    `<a href="${escapeAttr(node.href)}" target="_blank" style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">` +
    img +
    `</a>`
  );
}
