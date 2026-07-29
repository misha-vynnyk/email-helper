import type { ImageNode } from "../types";
import { escapeAttr } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

export function renderImage(node: ImageNode): string {
  const img = `<img src="${PLACEHOLDER_IMAGE_SRC}" alt="${escapeAttr(node.altDescription)}" width="100%" style="display: block; width: 100%; max-width: 100%; height: auto; border: none;" />`;

  if (!node.href) return img;
  return `<a href="${escapeAttr(node.href)}">${img}</a>`;
}
