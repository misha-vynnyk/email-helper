// Phase 4: classify <p>/<h*> StructuralNodes into paragraph ComponentNodes.

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import type { ComponentNode, Run,StructuralNode } from "../ir/types";

export function classifyFlow(nodes: StructuralNode[], tok: Tokens = defaultTokens): ComponentNode[] {
  const result: ComponentNode[] = [];
  for (const node of nodes) {
    if (node.type !== "p") continue;
    const { lines, align, size, headingLevel } = node;
    if (!lines.some(l => l.length > 0)) continue;

    // h5 → button component (matches simple converter "Кнопка" marker)
    if (headingLevel === 5) {
      const allRuns: Run[] = lines.flat();
      result.push({ kind: "buttonBand", props: { runs: allRuns, bg: tok.color.button, href: tok.color.placeholderHref } });
      continue;
    }

    // h4 → indented quote paragraph (matches simple converter "Відступ" marker)
    if (headingLevel === 4) {
      result.push({ kind: "paragraph", props: { lines, align, size, variant: "quote" } });
      continue;
    }

    result.push({ kind: "paragraph", props: { lines, align, size } });
  }
  return result;
}
