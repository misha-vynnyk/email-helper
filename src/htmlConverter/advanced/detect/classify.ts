// Phase 3: dispatch StructuralNode[] → ComponentNode[].

import type { StructuralNode, TableNode, ComponentNode, Run } from "../ir/types";
import { classifyTable } from "./tableBlock";
import { classifyFlow } from "./flowBlock";

function pushMerged(result: ComponentNode[], comp: ComponentNode): void {
  const last = result[result.length - 1];

  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      last.props["size"] === comp.props["size"] &&
      last.props["align"] === comp.props["align"]) {
    (last.props["lines"] as Run[][]).push(...(comp.props["lines"] as Run[][]));
    return;
  }

  if (comp.kind === "recordRow" && last?.kind === "recordRow") {
    type RowArr = unknown[];
    (last.props["rows"] as RowArr).push(...(comp.props["rows"] as RowArr));
    return;
  }

  result.push(comp);
}

export function classify(nodes: StructuralNode[]): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (const node of nodes) {
    if (node.type === "table") {
      const component = classifyTable(node as TableNode);
      if (component) {
        pushMerged(result, component);
      } else {
        for (const row of (node as TableNode).rows) {
          for (const cell of row.cells) {
            for (const comp of classify(cell.children)) {
              pushMerged(result, comp);
            }
          }
        }
      }
    } else if (node.type === "p") {
      for (const comp of classifyFlow([node])) {
        pushMerged(result, comp);
      }
    }
  }

  return result;
}
