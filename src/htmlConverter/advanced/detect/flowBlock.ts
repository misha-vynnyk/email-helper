// Phase 4: classify <p>/<h*> StructuralNodes into paragraph ComponentNodes.

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { joinLinesWithSpace } from "../ir/runs";
import type { ComponentNode, Run,StructuralNode } from "../ir/types";

export function classifyFlow(nodes: StructuralNode[], tok: Tokens = defaultTokens): ComponentNode[] {
  const result: ComponentNode[] = [];
  for (const node of nodes) {
    if (node.type !== "p") continue;
    const { lines, align, size, headingLevel, paraBreaks, listItem, tightNext, tightBefore,
      marginTopPt, marginBottomPt, gapBefore } = node;
    if (!lines.some(l => l.length > 0)) continue;

    // Heading levels are markers matching the simple converter's conventions:
    // H1/H2 → headline size (set in fromDom), H4 → quote, H5 → button,
    // H6 → small size (fromDom). H3 has no special role — renders as body text.

    // h5 → button component (matches simple converter "Кнопка" marker)
    if (headingLevel === 5) {
      const allRuns: Run[] = joinLinesWithSpace(lines);
      result.push({ kind: "buttonBand", props: { runs: allRuns, bg: tok.color.button, href: tok.placeholderHref } });
      continue;
    }

    // h4 → indented quote paragraph (matches simple converter "Відступ" marker)
    if (headingLevel === 4) {
      result.push({ kind: "paragraph", props: { lines, align, size, variant: "quote", paraBreaks, tightNext, tightBefore, marginTopPt, marginBottomPt, gapBefore } });
      continue;
    }

    result.push({ kind: "paragraph", props: { lines, align, size, paraBreaks, listItem, tightNext, tightBefore, marginTopPt, marginBottomPt, gapBefore } });
  }
  return result;
}
