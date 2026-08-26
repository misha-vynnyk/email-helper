import type { BuilderNode, ShellConfig } from "../types";
import { renderNodeList } from "./renderNode";
import { renderShell } from "./renderShell";

export function buildDocumentHtml(shell: ShellConfig, nodes: Record<string, BuilderNode>, rootIds: string[]): string {
  const contentHtml = renderNodeList(nodes, rootIds, shell, shell.contentWidthPx, 0);
  return renderShell(shell, contentHtml);
}
