import type { CanvasBlock, ShellConfig } from "../types";
import { renderLeafList } from "./renderLeafList";
import { renderRow } from "./renderRow";
import { renderSection } from "./renderSection";
import { renderShell } from "./renderShell";

function renderCanvasBlock(block: CanvasBlock, shell: ShellConfig): string {
  if (block.type === "section") return renderSection(block, renderLeafList(block.children, shell.fontFamily, block.gapPx));
  return renderRow(block, shell.fontFamily, shell.contentWidthPx);
}

export function buildDocumentHtml(shell: ShellConfig, canvas: CanvasBlock[]): string {
  const contentHtml = canvas.map((block) => renderCanvasBlock(block, shell)).join("\n");
  return renderShell(shell, contentHtml);
}
