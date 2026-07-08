// Phase 3: dispatch StructuralNode[] → ComponentNode[].

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import type { ComponentNode, Run,StructuralNode, TableNode, WarnFn } from "../ir/types";
import { classifyFlow } from "./flowBlock";
import { classifyTable } from "./tableBlock";

function pushMerged(result: ComponentNode[], comp: ComponentNode, warn?: WarnFn): void {
  const last = result[result.length - 1];

  // align defaults to "left" at render time — treat undefined and "left" as equal here
  const alignOf = (c: ComponentNode) => (c.props["align"] as string | undefined) ?? "left";

  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      last.props["size"] === comp.props["size"] &&
      last.props["variant"] === comp.props["variant"] &&
      alignOf(last) === alignOf(comp)) {
    const lastLines = last.props["lines"] as Run[][];
    const newLines = comp.props["lines"] as Run[][];
    if (newLines.length > 0) {
      const breakIdx = lastLines.length;
      // Two signals mean "no gap before me" — neither depends on what character (if any)
      // the paragraph starts with:
      //  - centered: GDocs' banner/eyebrow convention (a centered headline + subline)
      //  - listItem: structurally certain — set by fromDom.ts only inside a real <ul>/<ol>
      // A margin-top-based signal ("author explicitly zeroed the space before this
      // paragraph") was tried and reverted: comparing against the merge chain's *opening*
      // margin means one early paragraph with a larger-than-usual margin-top (common right
      // after a heading/image) makes every ordinary paragraph after it look like a
      // "reduction" forever, collapsing an entire section's <br><br>s to <br>. There's no
      // reliable per-pair signal that survives both a real GDocs export and a manually-typed
      // checklist, so manually-typed lists (no real <ul>, e.g. "✓ Partners: ...") are left
      // as ordinary prose — a known, accepted gap rather than a heuristic that regresses
      // everything else.
      // Anything else is genuine prose (common in short-paragraph marketing copy) and keeps
      // the <br><br> blank-line separation.
      const isTight = alignOf(comp) === "center" || comp.props["listItem"] === true;
      const compBreaks = comp.props["paraBreaks"] as Set<number> | undefined;
      if (!isTight || compBreaks?.size) {
        if (!last.props["paraBreaks"]) last.props["paraBreaks"] = new Set<number>();
        const breaks = last.props["paraBreaks"] as Set<number>;
        // Track paragraph boundary so renderLines can use <br><br> here
        if (!isTight) breaks.add(breakIdx);
        // comp's own internal blank lines (author-typed <br><br> inside one <p>) survive
        // the merge regardless of tightness — carry them over, offset by breakIdx
        if (compBreaks) for (const idx of compBreaks) breaks.add(idx + breakIdx);
      }
      lastLines.push(...newLines);
    }
    return;
  }

  if (comp.kind === "recordRow" && last?.kind === "recordRow") {
    type Row = { cells: unknown[] };
    const lastRows = last.props["rows"] as Row[];
    const newRows = comp.props["rows"] as Row[];
    if (lastRows[0]?.cells?.length === newRows[0]?.cells?.length) {
      // Merge keeps the first table's borderColor/widths — warn if the second table
      // actually disagrees, so a silently-repainted table doesn't go unnoticed.
      if (comp.props["borderColor"] !== last.props["borderColor"] ||
          JSON.stringify(comp.props["widths"]) !== JSON.stringify(last.props["widths"])) {
        warn?.("Сусідні таблиці об'єднано в одну, але кольір рамки або ширини колонок другої таблиці відрізняються — застосовано значення першої");
      }
      (lastRows as unknown[]).push(...newRows);
      return;
    }
  }

  result.push(comp);
}

export function classify(nodes: StructuralNode[], tok: Tokens = defaultTokens, warn?: WarnFn): ComponentNode[] {
  const result: ComponentNode[] = [];
  const classifyChildren = (n: StructuralNode[]) => classify(n, tok, warn);

  for (const node of nodes) {
    if (node.type === "table") {
      const component = classifyTable(node as TableNode, tok, warn, classifyChildren);
      if (component) {
        pushMerged(result, component, warn);
      } else {
        for (const row of (node as TableNode).rows) {
          for (const cell of row.cells) {
            for (const comp of classify(cell.children, tok, warn)) {
              pushMerged(result, comp, warn);
            }
          }
        }
      }
    } else if (node.type === "p") {
      for (const comp of classifyFlow([node], tok)) {
        pushMerged(result, comp, warn);
      }
    } else if (node.type === "img") {
      result.push({ kind: "image", props: { src: node.src, alt: node.alt } });
    }
  }

  return result;
}
