// Auto-derives the Google Fonts <link>/[style*=] list from whatever fontFamily/fontWeight values
// actually appear in the tree — so a pasted/uploaded tree doesn't need a separate "which fonts"
// field the author could forget to keep in sync when they add or change a text style.
import type { DocumentFont } from "./render/masterShell";
import type { ButtonNode, CardListNode, DesignNode, TextNode } from "./types";

function addWeight(weights: Map<string, Set<number>>, family: string | undefined, weight: number | undefined) {
  if (!family) return;
  if (!weights.has(family)) weights.set(family, new Set());
  weights.get(family)!.add(weight ?? 400);
}

function collectFromTextNode(node: TextNode, weights: Map<string, Set<number>>) {
  addWeight(weights, node.defaultStyle.fontFamily, node.defaultStyle.fontWeight);
  node.runs.forEach((run) =>
    addWeight(weights, run.fontFamily ?? node.defaultStyle.fontFamily, run.fontWeight ?? node.defaultStyle.fontWeight),
  );
}

function collectFromButtonNode(node: ButtonNode, weights: Map<string, Set<number>>) {
  addWeight(weights, node.fontFamily, node.fontWeight);
}

function collectFromCardListNode(node: CardListNode, weights: Map<string, Set<number>>) {
  node.cards.forEach((card) => {
    collectFromTextNode(card.title, weights);
    collectFromTextNode(card.secondary, weights);
  });
}

// `row`/`cardList`/`buttonRow` nest further DesignNode/TextNode/ButtonNode content the same way
// `frame.children` does — missing them here meant a font used only inside one of these three
// (e.g. a mobile-only RowNode, see figma-to-html/CLAUDE.md's "same id, different structure per
// file" allowance) silently got no Google Fonts `<link>`/`[style*=]` rule, the same class of bug
// fixed in `validate.ts`'s `collectIds()` earlier.
function walk(node: DesignNode, weights: Map<string, Set<number>>) {
  switch (node.type) {
    case "frame":
      node.children.forEach((child) => walk(child, weights));
      break;
    case "text":
      collectFromTextNode(node, weights);
      break;
    case "button":
      collectFromButtonNode(node, weights);
      break;
    case "buttonRow":
      node.buttons.forEach((button) => collectFromButtonNode(button, weights));
      break;
    case "row":
      node.columns.forEach((column) => column.children.forEach((child) => walk(child, weights)));
      break;
    case "cardList":
      collectFromCardListNode(node, weights);
      break;
    default:
      break;
  }
}

export function collectFonts(nodes: DesignNode[]): DocumentFont[] {
  const weights = new Map<string, Set<number>>();
  nodes.forEach((node) => walk(node, weights));

  return Array.from(weights.entries()).map(([family, weightSet]) => ({
    family,
    googleQuery: `${family}:wght@${Array.from(weightSet)
      .sort((a, b) => a - b)
      .join(";")}`,
  }));
}
