/**
 * Regex-based scanner for greeting phrases ("Dear Reader,", "Hi Bob,", ...). Purely
 * advisory — paired with useGreetingHighlighter, which highlights matches but never
 * edits the underlying text. Unlike markerScanner's literal-token matching, greetings
 * need pattern matching anchored at the START of a block, so this walks block-level
 * containers and checks each one's first meaningful text run, rather than scanning
 * every text node independently.
 */

import type { MarkerTokenMatch } from "./markerScanner";

const BLOCK_TAGS = new Set(["P", "DIV", "LI", "TD", "TH", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6"]);

// A small, named, easily-extendable list of common opener patterns — intentionally a
// best-effort heuristic, not an exhaustive grammar. Each is anchored to the start of
// the text (after optional leading whitespace).
export const GREETING_PATTERNS: RegExp[] = [/^\s*(dear|hi|hello|hey|greetings)\b[^.!?\n]{0,60}?,/i];

// Nearest block-level ancestor of a text node — used as the dedup key so a block that
// nests another block (e.g. a wrapping <div> around a <p>) doesn't get checked twice
// for the same leading text.
function nearestBlockAncestor(node: Node): Element | null {
  let el = node.parentElement;
  while (el) {
    if (BLOCK_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return null;
}

interface TextNodeSpan {
  node: Text;
  start: number;
  end: number;
}

// A greeting opener can be split across inline formatting tags (e.g. "Dear
// <b>Reader</b>,") into several text nodes — collect the block's FULL concatenated
// text (with each node's [start,end) offset into it) so the pattern can match across
// those boundaries instead of only ever seeing one fragment at a time. Nested block-tag
// descendants (e.g. a stray <p> sitting inside the <div> whose only OTHER content is
// inline, as in `<div><p>...</p><span>text</span></div>`) are excluded entirely — that
// nested block is its own separate unit, walked (and dedup-tracked) on its own turn by
// the outer loop below, so pulling its text in here would double-match it.
function collectBlockText(block: Node): { text: string; spans: TextNodeSpan[] } {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(n) {
      if (n.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_ACCEPT;
      return n !== block && BLOCK_TAGS.has((n as Element).tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
    },
  });
  let text = "";
  const spans: TextNodeSpan[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const node = current as Text;
    const value = node.nodeValue ?? "";
    spans.push({ node, start: text.length, end: text.length + value.length });
    text += value;
  }
  return { text, spans };
}

export function scanGreetingPhrases(root: Node): MarkerTokenMatch[] {
  const matches: MarkerTokenMatch[] = [];
  const seenBlocks = new Set<Node>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.nodeValue ?? "";
    if (!text.trim()) continue;

    const block = nearestBlockAncestor(node) ?? node.parentNode ?? root;
    if (seenBlocks.has(block)) continue;
    seenBlocks.add(block);

    const { text: blockText, spans } = collectBlockText(block);

    for (const pattern of GREETING_PATTERNS) {
      const match = pattern.exec(blockText);
      if (!match) continue;
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      // The match may span multiple text nodes — emit one highlight span per node
      // fragment it overlaps; the highlighter draws them all as one combined Highlight.
      for (const span of spans) {
        const overlapStart = Math.max(matchStart, span.start);
        const overlapEnd = Math.min(matchEnd, span.end);
        if (overlapStart >= overlapEnd) continue;
        matches.push({
          node: span.node,
          startOffset: overlapStart - span.start,
          endOffset: overlapEnd - span.start,
          token: blockText.slice(overlapStart, overlapEnd),
        });
      }
      break;
    }
  }

  return matches;
}
