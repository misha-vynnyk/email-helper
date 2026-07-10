// Phase 3: dispatch StructuralNode[] → ComponentNode[].

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
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

function pushMerged(result: ComponentNode[], comp: ComponentNode, warn?: WarnFn): void {
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
    // Six signals mean "no gap before me":
    //  - centered: GDocs' banner/eyebrow convention (a centered headline + subline)
    //  - listItem: structurally certain — set by fromDom.ts only inside a real <ul>/<ol>
    //  - marker pair: BOTH the previous line and this paragraph start with a
    //    bullet/checkmark glyph — a manually-typed checklist (no real <ul>, e.g.
    //    "✓ Partners: ..."). The pair requirement keeps a lone dash-led sentence prose.
    //  - tightNext: the PREVIOUS paragraph ended with a user-typed § marker — an
    //    explicit "no gap after me" signal, independent of alignment/structure.
    //  - tightBefore: THIS paragraph's raw HTML instead STARTED with §  — same intent,
    //    placed at the other end of the boundary (author habit varies).
    //  - zero-margin pair: the source doc explicitly declared margin-bottom:0 on the
    //    previous paragraph AND margin-top:0 on this one — the author configured the
    //    doc so Enter produces no visible gap, i.e. Enter IS their line break. Both
    //    sides must be explicit zeros; this pairwise absolute rule replaces the
    //    reverted chain-relative margin comparison (comparing against the merge
    //    chain's *opening* margin meant one early paragraph with a larger-than-usual
    //    margin-top made every paragraph after it look like a "reduction" forever,
    //    collapsing an entire section's <br><br>s to <br> — pairwise zeros have no
    //    chain memory, so they can't cascade).
    // gapBefore (an author-typed blank line — top-level <br> — right before this
    // paragraph) vetoes the convention-based signals: the author explicitly asked for
    // a gap there. Only § (tightNext/tightBefore) outranks it, being the explicit
    // tight marker. Anything else is genuine prose (common in short-paragraph
    // marketing copy) and keeps the <br><br> blank-line separation.
    const isMarkerPair = startsWithListMarker(newLines[0]) &&
      startsWithListMarker(lastLines[breakIdx - 1]);
    const isZeroMarginPair = last.props.zeroBottomMargin === true &&
      comp.props.zeroTopMargin === true;
    const isTight = last.props.tightNext === true || comp.props.tightBefore === true ||
      (comp.props.gapBefore !== true &&
        (alignOf(comp.props) === "center" || comp.props.listItem === true ||
          isMarkerPair || isZeroMarginPair));
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
        // zeroBottomMargin (not last's, which were already consumed above) govern
        // the NEXT merge.
        tightNext: comp.props.tightNext,
        zeroBottomMargin: comp.props.zeroBottomMargin,
      },
    };
    return;
  }

  // The full merge above requires matching size/variant/align — a § between a headline
  // and body text (or center- and left-aligned paragraphs) can't share one <span>'s
  // formatting, so it falls through here instead. The two blocks stay separate, but the
  // author's "no gap" intent (either end of the boundary — see isTight above) still
  // collapses the padding between them to roughly a single-<br> gap instead of the
  // default double block padding. Same signals as the full merge: § (either end) wins
  // outright; the zero-margin pair applies unless an author-typed blank line
  // (gapBefore) sits on the boundary.
  if (comp.kind === "paragraph" && last?.kind === "paragraph" &&
      (last.props.tightNext === true || comp.props.tightBefore === true ||
        (comp.props.gapBefore !== true &&
          last.props.zeroBottomMargin === true && comp.props.zeroTopMargin === true))) {
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
