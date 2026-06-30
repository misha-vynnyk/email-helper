// Phase 4: classify <p>/<h*> StructuralNodes into paragraph ComponentNodes.

import type { StructuralNode, ComponentNode } from "../ir/types";

export function classifyFlow(nodes: StructuralNode[]): ComponentNode[] {
  const result: ComponentNode[] = [];
  for (const node of nodes) {
    if (node.type !== "p") continue;
    const { lines, align, size } = node;
    if (!lines.some(l => l.length > 0)) continue;
    result.push({ kind: "paragraph", props: { lines, align, size } });
  }
  return result;
}
