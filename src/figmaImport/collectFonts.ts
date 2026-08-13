// Auto-derives the Google Fonts <link>/[style*=] list from whatever fontFamily/fontWeight values
// actually appear in the tree — so a pasted/uploaded tree doesn't need a separate "which fonts"
// field the author could forget to keep in sync when they add or change a text style.
import type { DocumentFont } from "./render/masterShell";
import type { ButtonNode, DesignNode, TextNode } from "./types";

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
