// Phase 3: dispatch StructuralNode[] → ComponentNode[].

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { isGapBoundary } from "../ir/spacing";
import type { ComponentNode, ParagraphProps, Run,StructuralNode, TableNode, WarnFn } from "../ir/types";
import { WARN } from "../warnings";
import { classifyFlow } from "./flowBlock";
import { classifyTable } from "./tableBlock";

// Manually-typed list/checklist markers — GDocs paragraphs that fake a list with a leading
// glyph instead of real <ul>/<li> markup. Only used as a PAIR signal (both adjacent
// paragraphs must start with a marker), so a lone dash-led sentence never triggers it.
const LIST_MARKER_CHARS = new Set([
  "•", "◦", "▪", "▸", "►", "➤", "‣", "·", "●", "○", "✓", "✔", "✗", "✕", "✅", "❌", "☐", "☑", "-", "*", "→",
]);

function startsWithListMarker(line: Run[] | undefined): boolean {
  const text = line?.[0]?.text;
  if (!text) return false;
  const trimmed = text.trim();
  // Isolated marker run ("✓ " styled separately from the text after it — GDocs splits
  // differently-formatted spans into separate runs)
  if (LIST_MARKER_CHARS.has(trimmed) || /^\d{1,2}[.)]$/.test(trimmed)) return true;
  // Marker typed inline in the same run — must be followed by whitespace
  const first = trimmed[0];
  if (LIST_MARKER_CHARS.has(first) && /^\S\s/.test(trimmed)) return true;
  return /^\d{1,2}[.)]\s/.test(trimmed);
}

function pushMerged(result: ComponentNode[], comp: ComponentNode, tok: Tokens, warn?: WarnFn): void {
  const last = result[result.length - 1];

  // align defaults to "left" at render time — treat undefined and "left" as equal here
  const alignOf = (p: ParagraphProps) => p.align ?? "left";

  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      last.props.size === comp.props.size &&
      last.props.variant === comp.props.variant &&
      alignOf(last.props) === alignOf(comp.props)) {
    const lastLines = last.props.lines;
    const newLines = comp.props.lines;
    if (newLines.length === 0) return;  // empty comp contributes nothing — drop it
    const breakIdx = lastLines.length;
    // Boundary decision, in priority order:
    //  1. § on either end (tightNext on the previous paragraph / tightBefore on this
    //     one) → line break; the explicit marker always wins.
    //  2. Structural/convention signals (unless an author-typed blank line — gapBefore —
    //     sits on the boundary): centered (GDocs banner/eyebrow convention), listItem
    //     (structurally certain, real <ul>/<ol>), marker pair (BOTH lines start with a
    //     bullet/checkmark glyph — a hand-typed checklist; the pair requirement keeps a
    //     lone dash-led sentence prose) → line break.
    //  3. isGapBoundary (ir/spacing.ts): blank line → gap; margin sum below the
    //     threshold token → line break; margins undeclared → gap. This pairwise rule
    //     replaced both the reverted chain-relative margin heuristic (one large-margin
    //     opener collapsed a whole section — pairwise sums have no chain memory) and
    //     the interim zero-margin-pair rule (0+0 is just a sum below the threshold).
    const isMarkerPair = startsWithListMarker(newLines[0]) &&
      startsWithListMarker(lastLines[breakIdx - 1]);
    const isTight = last.props.tightNext === true || comp.props.tightBefore === true ||
      (comp.props.gapBefore !== true &&
        (alignOf(comp.props) === "center" || comp.props.listItem === true || isMarkerPair)) ||
      !isGapBoundary(last.props, comp.props, tok);
    const compBreaks = comp.props.paraBreaks;

    // Build the merged paragraph without mutating the node already in `result`.
    const breaks = new Set<number>(last.props.paraBreaks);
    // Track paragraph boundary so renderLines can use <br><br> here.
    if (!isTight) breaks.add(breakIdx);
    // comp's own internal blank lines (author-typed <br><br> inside one <p>) survive
    // the merge regardless of tightness — carry them over, offset by breakIdx.
    if (compBreaks) for (const idx of compBreaks) breaks.add(idx + breakIdx);

    result[result.length - 1] = {
      kind: "paragraph",
      props: {
        ...last.props,
        lines: [...lastLines, ...newLines],
        paraBreaks: breaks.size ? breaks : undefined,
        // comp is now the tail of the merged paragraph — its own tightNext /
        // marginBottomPt (not last's, which were already consumed above) govern
        // the NEXT merge.
        tightNext: comp.props.tightNext,
        marginBottomPt: comp.props.marginBottomPt,
      },
    };
    return;
  }

  // The full merge above requires matching size/variant/align — a § between a headline
  // and body text (or center- and left-aligned paragraphs) can't share one <span>'s
  // formatting, so it falls through here instead. The two blocks stay separate, but the
  // author's "no gap" intent still collapses the padding between them to roughly a
  // single-<br> gap instead of the default double block padding. Same boundary rule as
  // the full merge (isGapBoundary): § wins outright, blank line forces the gap, small
  // margin sums mean the author saw these as adjacent lines.
  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      !isGapBoundary(last.props, comp.props, tok)) {
    result[result.length - 1] = { ...last, props: { ...last.props, tightAfter: true } };
    comp = { ...comp, props: { ...comp.props, tightBefore: true } };
  }

  // § at the start of a paragraph that follows an image ("[image] §text") — the image
  // can't merge with text, but the "no gap" intent still applies: zero the image's
  // bottom padding; the paragraph's own tightBefore already zeroes its top padding.
  if (comp.kind === "paragraph" && last?.kind === "image" && comp.props.tightBefore === true) {
    result[result.length - 1] = { ...last, props: { ...last.props, tightAfter: true } };
  }

  if (comp.kind === "recordRow" && last?.kind === "recordRow") {
    const lastRows = last.props.rows;
    const newRows = comp.props.rows;
    if (lastRows[0]?.cells?.length === newRows[0]?.cells?.length) {
      // Merge keeps the first table's borderColor/widths — warn if the second table
      // actually disagrees, so a silently-repainted table doesn't go unnoticed.
      if (comp.props.borderColor !== last.props.borderColor ||
          JSON.stringify(comp.props.widths) !== JSON.stringify(last.props.widths)) {
        warn?.(WARN.tablesMergedMismatch);
      }
      result[result.length - 1] = {
        kind: "recordRow",
        props: { ...last.props, rows: [...lastRows, ...newRows] },
      };
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
        pushMerged(result, component, tok, warn);
      } else {
        for (const row of (node as TableNode).rows) {
          for (const cell of row.cells) {
            for (const comp of classify(cell.children, tok, warn)) {
              pushMerged(result, comp, tok, warn);
            }
          }
        }
      }
    } else if (node.type === "p") {
      for (const comp of classifyFlow([node], tok)) {
        pushMerged(result, comp, tok, warn);
      }
    } else if (node.type === "img") {
      const comp: ComponentNode = { kind: "image", props: { src: node.src, alt: node.alt } };
      // § at the end of the paragraph right before this image ("text§ [image]") —
      // mirror of the image-then-paragraph case in pushMerged: zero the paragraph's
      // bottom padding and the image's top padding.
      const last = result[result.length - 1];
      if (last?.kind === "paragraph" && last.props.tightNext === true) {
        result[result.length - 1] = { ...last, props: { ...last.props, tightAfter: true } };
        comp.props.tightBefore = true;
      }
      result.push(comp);
    }
  }

  return result;
}
