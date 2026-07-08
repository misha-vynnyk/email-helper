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
      // Three signals mean "no gap before me" — none of them depend on what character (if
      // any) the paragraph happens to start with, so this works for plain text too:
      //  - centered: GDocs' banner/eyebrow convention (a centered headline + subline)
      //  - listItem: structurally certain — set by fromDom.ts only inside a real <ul>/<ol>
      //  - marginTopPt dropping below the chain's own opening margin: GDocs expresses "no
      //    gap before me" as a *reduction* in "space before paragraph" relative to a normal
      //    paragraph's spacing, not as an absolute value — plenty of real documents use
      //    margin-top:0 on EVERY ordinary paragraph (a CSS-reset default, not an authorial
      //    "pack tight" signal), so 0 alone isn't safe to treat as tight. `last.props
      //    .marginTopPt` never gets overwritten by earlier merges, so it always still holds
      //    the value the current chain opened with — the baseline a later drop is judged against.
      // Anything else is genuine prose (common in short-paragraph marketing copy) and keeps
      // the <br><br> blank-line separation.
      const lastMarginPt = last.props["marginTopPt"] as number | undefined;
      const compMarginPt = comp.props["marginTopPt"] as number | undefined;
      const isTight = alignOf(comp) === "center" ||
        comp.props["listItem"] === true ||
        (compMarginPt !== undefined && lastMarginPt !== undefined && compMarginPt < lastMarginPt);
      if (!isTight) {
        // Track paragraph boundary so renderLines can use <br><br> here
        if (!last.props["paraBreaks"]) last.props["paraBreaks"] = new Set<number>();
        const breaks = last.props["paraBreaks"] as Set<number>;
        breaks.add(breakIdx);
        // Carry over any paraBreaks from comp (offset by breakIdx)
        const compBreaks = comp.props["paraBreaks"] as Set<number> | undefined;
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
