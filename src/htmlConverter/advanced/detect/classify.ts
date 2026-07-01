// Phase 3: dispatch StructuralNode[] → ComponentNode[].

import type { StructuralNode, TableNode, ComponentNode, Run } from "../ir/types";
import { classifyTable } from "./tableBlock";
import { classifyFlow } from "./flowBlock";
import { tokens as defaultTokens } from "../config/tokens";
import type { Tokens } from "../config/tokens";

function pushMerged(result: ComponentNode[], comp: ComponentNode): void {
  const last = result[result.length - 1];

  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      last.props["size"] === comp.props["size"] &&
      last.props["align"] === comp.props["align"]) {
    const lastLines = last.props["lines"] as Run[][];
    const newLines = comp.props["lines"] as Run[][];
    if (newLines.length > 0) {
      const breakIdx = lastLines.length;
      // Track paragraph boundary so renderLines can use <br><br> here
      if (!last.props["paraBreaks"]) last.props["paraBreaks"] = new Set<number>();
      const breaks = last.props["paraBreaks"] as Set<number>;
      breaks.add(breakIdx);
      // Carry over any paraBreaks from comp (offset by breakIdx)
      const compBreaks = comp.props["paraBreaks"] as Set<number> | undefined;
      if (compBreaks) for (const idx of compBreaks) breaks.add(idx + breakIdx);
      lastLines.push(...newLines);
    }
    return;
  }

  if (comp.kind === "recordRow" && last?.kind === "recordRow") {
    type Row = { cells: unknown[] };
    const lastRows = last.props["rows"] as Row[];
    const newRows = comp.props["rows"] as Row[];
    if (lastRows[0]?.cells?.length === newRows[0]?.cells?.length) {
      (lastRows as unknown[]).push(...newRows);
      return;
    }
  }

  result.push(comp);
}

export function classify(nodes: StructuralNode[], tok: Tokens = defaultTokens): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (const node of nodes) {
    if (node.type === "table") {
      const component = classifyTable(node as TableNode, tok);
      if (component) {
        pushMerged(result, component);
      } else {
        for (const row of (node as TableNode).rows) {
          for (const cell of row.cells) {
            for (const comp of classify(cell.children, tok)) {
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
