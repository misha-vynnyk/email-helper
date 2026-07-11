// Phase 3: classify <table> StructuralNodes into ComponentNodes.
// Precedence (1×1): buttonBand → alertBand → calloutLeft → calloutBox → unwrap (transparent)
// Multi-cell:       statsGrid (1 row, N≥2) → recordRow (M rows, N≥2)

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { isBgRedundant, isDarkBg } from "../ir/color";
import { joinLinesWithSpace } from "../ir/runs";
import { isGapBoundary } from "../ir/spacing";
import type { AlertBandProps, BorderSide, BorderSpec, ButtonBandProps,CellNode, ComponentNode, Paragraph, Run,StructuralNode, TableNode, WarnFn } from "../ir/types";
import { WARN } from "../warnings";

/** Recurses back into classify.ts — threaded in to avoid a circular import. */
export type ClassifyChildrenFn = (nodes: StructuralNode[]) => ComponentNode[];

function firstBorderColor(border: BorderSpec | undefined): string | undefined {
  return border?.top?.color ?? border?.right?.color ?? border?.bottom?.color ?? border?.left?.color;
}

// A GDocs 1×1 layout table often keeps a faint default gridline even when the author
// never intended a visible border — only treat `border` as meaningful when at least
// one side's color is visibly distinct from white/the document background.
function isNearWhiteOrRoot(color: string, tok: Tokens): boolean {
  return isBgRedundant(color, "#ffffff", tok) || isBgRedundant(color, tok.color.rootBackground, tok);
}

function hasMeaningfulBorder(border: BorderSpec | undefined, tok: Tokens): boolean {
  if (!border) return false;
  const sides = [border.top, border.right, border.bottom, border.left].filter(
    (s): s is BorderSide => Boolean(s)
  );
  return sides.length > 0 && sides.some(s => !isNearWhiteOrRoot(s.color, tok));
}

// ── Cell content helpers ──────────────────────────────────────────────────────

/**
 * Core cell flattener: paragraph lines of a cell in document order, descending
 * into nested tables (whose layout is lost — only the text survives, reported
 * via `warn`). Also tracks which line indices start a new source paragraph so
 * callers can render the boundary — a <br><br> gap or a single-<br> line break,
 * decided by the same isGapBoundary rule pushMerged uses (§ wins, blank line
 * forces the gap, small margin sums mean adjacent lines).
 *
 * flattenLines / flattenRuns are thin projections of this — one recursion, one
 * nested-table warning, three shapes.
 */
function flattenLinesWithBreaks(cell: CellNode, tok: Tokens, warn?: WarnFn): { lines: Run[][]; paraBreaks: Set<number> } {
  const lines: Run[][] = [];
  const paraBreaks = new Set<number>();
  let prevP: Paragraph | null = null;
  const appendBlock = (blockLines: Run[][], blockBreaks: Set<number> | undefined, gap: boolean) => {
    if (blockLines.length === 0) return;
    if (lines.length > 0 && gap) paraBreaks.add(lines.length);
    if (blockBreaks) for (const idx of blockBreaks) paraBreaks.add(idx + lines.length);
    lines.push(...blockLines);
  };
  for (const child of cell.children) {
    if (child.type === "p") {
      appendBlock(child.lines, child.paraBreaks, isGapBoundary(prevP ?? {}, child, tok));
      prevP = child;
    } else if (child.type === "table") {
      warn?.(WARN.nestedTableFlattened);
      for (const row of child.rows) {
        for (const nested of row.cells) {
          const nestedResult = flattenLinesWithBreaks(nested, tok, undefined /* warn once per table */);
          appendBlock(nestedResult.lines, nestedResult.paraBreaks, isGapBoundary(prevP ?? {}, {}, tok));
          prevP = null;
        }
      }
    }
  }
  return { lines, paraBreaks };
}

/** Paragraph lines of a cell, including lines from nested tables (flattened). */
function flattenLines(cell: CellNode, tok: Tokens, warn?: WarnFn): Run[][] {
  return flattenLinesWithBreaks(cell, tok, warn).lines;
}

/** All runs of a cell, flattened across lines and nested tables — with a space
 *  between lines so multi-line content doesn't glue words together. */
function flattenRuns(cell: CellNode, tok: Tokens, warn?: WarnFn): Run[] {
  return joinLinesWithSpace(flattenLines(cell, tok, warn));
}

/**
 * Like flattenLinesWithBreaks, but with two more things pushMerged (classify.ts)
 * already does for the general flow-paragraph path, ported here so the same
 * signals work inside a flattened alertBand cell:
 *   - boundary rule via isGapBoundary (§ / blank line / margin sum), same as
 *     flattenLinesWithBreaks;
 *   - align: the first paragraph's alignment (GDocs CTA boxes are consistently
 *     aligned throughout, so "first wins" is a fine approximation).
 * A nested table that itself resolves to a real button (GDocs' h5-in-colored-cell
 * pattern, e.g. a CTA nested inside a bigger alertBand box) keeps its identity as
 * a button instead of being flattened to plain text; one that resolves to its own
 * colored band (a dark pseudo-button cell inside a dark bordered box) keeps its
 * identity as a nested band row — only nested tables that resolve to NEITHER still
 * flatten, same as before (with the same warning).
 */
function flattenCellForAlertBand(
  cell: CellNode,
  tok: Tokens,
  warn: WarnFn | undefined,
  classifyChildren: ClassifyChildrenFn | undefined,
): {
  lines: Run[][];
  paraBreaks: Set<number>;
  buttons: { atLine: number; props: ButtonBandProps }[];
  bands: { atLine: number; props: AlertBandProps }[];
  align?: "left" | "center" | "right";
} {
  const lines: Run[][] = [];
  const paraBreaks = new Set<number>();
  const buttons: { atLine: number; props: ButtonBandProps }[] = [];
  const bands: { atLine: number; props: AlertBandProps }[] = [];
  let align: "left" | "center" | "right" | undefined;
  let prevP: Paragraph | null = null;
  const appendBlock = (blockLines: Run[][], blockBreaks: Set<number> | undefined, gap: boolean) => {
    if (blockLines.length === 0) return;
    if (lines.length > 0 && gap) paraBreaks.add(lines.length);
    if (blockBreaks) for (const idx of blockBreaks) paraBreaks.add(idx + lines.length);
    lines.push(...blockLines);
  };
  for (const child of cell.children) {
    if (child.type === "p") {
      if (align === undefined && child.align) align = child.align;
      appendBlock(child.lines, child.paraBreaks, isGapBoundary(prevP ?? {}, child, tok));
      prevP = child;
    } else if (child.type === "table") {
      const nestedComponent = classifyTable(child, tok, warn, classifyChildren);
      if (nestedComponent?.kind === "buttonBand") {
        buttons.push({ atLine: lines.length, props: nestedComponent.props });
        prevP = null;
        continue;
      }
      if (nestedComponent?.kind === "alertBand") {
        bands.push({ atLine: lines.length, props: nestedComponent.props });
        prevP = null;
        continue;
      }
      warn?.(WARN.nestedTableFlattened);
      for (const row of child.rows) {
        for (const nested of row.cells) {
          const nestedResult = flattenLinesWithBreaks(nested, tok, undefined /* warn once per table */);
          appendBlock(nestedResult.lines, nestedResult.paraBreaks, isGapBoundary(prevP ?? {}, {}, tok));
          prevP = null;
        }
      }
    }
  }
  return { lines, paraBreaks, buttons, bands, align };
}

function findHref(cell: CellNode, tok: Tokens): string | null {
  for (const line of flattenLines(cell, tok)) {
    for (const run of line) {
      if (run.href) return run.href;
    }
  }
  return null;
}

/** True if the cell contains an h5 paragraph (the "Кнопка" marker). */
function hasButtonMarker(cell: CellNode): boolean {
  return cell.children.some(
    n => n.type === "p" && (n as Paragraph).headingLevel === 5
  );
}

/** True if the cell has at least one non-empty run (ignores <br>-only cells). */
function hasMeaningfulContent(cell: CellNode, tok: Tokens): boolean {
  return flattenRuns(cell, tok).some(r => r.text.trim() !== "");
}

/**
 * Effective text alignment of a cell. GDocs puts `text-align` on the inner <p>,
 * not the <td> — cell.align only covers an explicit `align`/`text-align` on the
 * cell itself, so fall back to the first paragraph child's align.
 */
function cellAlign(cell: CellNode, fallback: "left" | "center" | "right" = "left"): "left" | "center" | "right" {
  if (cell.align) return cell.align;
  const firstPara = cell.children.find((c): c is Paragraph => c.type === "p");
  return firstPara?.align ?? fallback;
}

function cellToChild(cell: CellNode, tok: Tokens, warn?: WarnFn): ComponentNode {
  return {
    kind: "paragraph",
    props: {
      lines: flattenLines(cell, tok, warn),
      // "center" fallback: stats cards read best centered when the author left the
      // cell unaligned — but an explicit alignment on the cell OR its first <p> wins.
      align: cellAlign(cell, "center"),
      size: "small" as const,
      bg: cell.bg,
      borderColor: firstBorderColor(cell.border),
    },
  };
}

// ── Column widths ─────────────────────────────────────────────────────────────

/**
 * Convert raw <colgroup> widths to integer percentages summing to 100, using
 * the largest-remainder method: floor each share, then hand out the leftover
 * points to the columns with the biggest fractional part. Dumping the whole
 * remainder into the last column (as a plain floor would) skews near-equal
 * GDocs pixel widths — e.g. 156/155/155/156 (a rounding artifact of GDocs'
 * pt→px export, not an intentional layout) previously became 25/24/24/27
 * instead of the intended 25/25/25/25.
 * Returns undefined when widths are missing/mismatched (e.g. colspan rows or
 * cols without a width attribute) — callers fall back to the equal split.
 */
function toWidthPercents(colWidths: number[] | undefined, ncells: number): number[] | undefined {
  if (!colWidths || colWidths.length !== ncells || ncells < 2) return undefined;
  const total = colWidths.reduce((s, w) => s + w, 0);
  if (total <= 0) return undefined;
  const shares = colWidths.map(w => (w / total) * 100);
  const pcts = shares.map(s => Math.floor(s));
  let remainder = 100 - pcts.reduce((s, p) => s + p, 0);
  const order = shares
    .map((s, i) => ({ i, frac: s - Math.floor(s) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) pcts[order[k % order.length].i] += 1;
  return pcts;
}

// ── Single-cell classification ────────────────────────────────────────────────

function classifySingleCell(
  cell: CellNode,
  tok: Tokens,
  warn?: WarnFn,
  classifyChildren?: ClassifyChildrenFn,
): ComponentNode | null {
  const bg = cell.bg;
  // A GDocs 1×1 layout table often keeps a faint default gridline with no intent behind
  // it — near-white/near-root-bg colors don't count as a border for unwrap/callout
  // purposes. A dark bg with an explicit (e.g. white) outline is a different, deliberate
  // case (see below) and keeps the raw border regardless of color.
  const border = hasMeaningfulBorder(cell.border, tok) ? cell.border : undefined;

  // No color and no border, or bg matches root background with no border → transparent, let classify.ts unwrap
  if (!border && (!bg || bg === tok.color.rootBackground)) return null;

  // h5 marker inside a colored cell → button using cell's bg color and no border-radius
  // (GDocs uses a colored td around an h5 to mark a button; radius comes from the cell,
  //  which never has border-radius in GDocs → use 0 to match the source document)
  // Requires an actual bg — a bordered-but-transparent h5 cell falls through to the
  // border-handling branches below instead of reaching render with bg === undefined.
  if (hasButtonMarker(cell) && bg && bg !== tok.color.rootBackground) {
    return {
      kind: "buttonBand",
      props: { runs: flattenRuns(cell, tok, warn), href: tok.placeholderHref, bg, radius: 0 },
    };
  }

  if (bg && isDarkBg(bg, tok)) {
    // A white/light outline against a dark bg is a deliberate accent regardless of how
    // close its color is to white — use the raw border here, not the near-white-filtered one.
    // Nested tables that resolve to a real button (a CTA nested inside the banner) survive
    // as actual buttons — see flattenCellForAlertBand — everything else still flattens.
    const { lines, paraBreaks, buttons, bands, align } = flattenCellForAlertBand(cell, tok, warn, classifyChildren);
    // Only promote to buttonBand (wraps the ENTIRE cell in one <a>) when the cell is a
    // single logical line with no nested button/band of its own — a real one-line CTA.
    // A multi-line dark box (e.g. a banner headline + a "fake link" line styled
    // blue/underlined with no real <a> + a footer line) must stay an alertBand: findHref
    // would happily match the fake-link line and swallow the whole box — including
    // unrelated text — into one giant link.
    const href = lines.length <= 1 && buttons.length === 0 && bands.length === 0 ? findHref(cell, tok) : null;
    if (href) {
      return { kind: "buttonBand", props: { runs: joinLinesWithSpace(lines), href, bg, border: cell.border } };
    }
    return {
      kind: "alertBand",
      props: {
        lines, paraBreaks, bg, border: cell.border,
        buttons: buttons.length ? buttons : undefined,
        bands: bands.length ? bands : undefined,
        align,
      },
    };
  }

  // Pure border-bottom, no fill → GDocs' idiom for a horizontal rule under a text
  // block (a 1×1 layout table with only border-bottom set), not a boxed callout.
  // Render as plain flowing text with a real <hr> beneath it instead of calloutBox's
  // padded box — a bg here means the author meant an actual colored panel, not a rule,
  // so that case still falls through to the generic border handling below.
  const isBottomRuleOnly = Boolean(border?.bottom) && !border?.top && !border?.right && !border?.left;
  if (isBottomRuleOnly && !bg) {
    const { lines, paraBreaks } = flattenLinesWithBreaks(cell, tok, warn);
    return {
      kind: "textDivider",
      props: { lines, paraBreaks, align: cellAlign(cell), ruleColor: border!.bottom!.color },
    };
  }

  // Pure border-left accent (+ optional light bg) → calloutLeft, using the
  // document's own border color instead of the house default.
  const isLeftAccentOnly = Boolean(border?.left) && !border?.top && !border?.right && !border?.bottom;
  if (isLeftAccentOnly) {
    const { lines, paraBreaks } = flattenLinesWithBreaks(cell, tok, warn);
    return {
      kind: "calloutLeft",
      props: { lines, paraBreaks, bg, accentColor: border!.left!.color, accentWidthPx: border!.left!.widthPx },
    };
  }

  // Any other border shape (full frame, partial multi-side, or a lone rule line) →
  // calloutBox. Recurse into children (via classify.ts) so nested content — e.g. a
  // button table inside a bordered CTA box — survives instead of being flattened to text.
  if (border) {
    const children = classifyChildren?.(cell.children) ?? [cellToChild(cell, tok, warn)];
    return { kind: "calloutBox", props: { border, bg }, children };
  }

  // Light bg with no border declared in the source → keep the bg as a plain colored box.
  // Never synthesize an accent border the document never had.
  {
    const { lines, paraBreaks } = flattenLinesWithBreaks(cell, tok, warn);
    return { kind: "alertBand", props: { lines, paraBreaks, bg: bg! } };
  }
}

// ── Multi-row helper ──────────────────────────────────────────────────────────

function rowCells(cells: CellNode[], tok: Tokens, warn?: WarnFn) {
  // Same convention as cellToChild/statsGrid: adjacent <p>s inside a record cell are a
  // label/sublabel or headline/body pair, not distinct paragraphs — join with a single
  // <br>, not the double break flattenLinesWithBreaks uses for alertBand/calloutLeft.
  return cells.map(c => ({
    lines: flattenLines(c, tok, warn),
    // GDocs puts text-align on the inner <p>, not the <td> — cellAlign covers both.
    align: cellAlign(c),
    bg: c.bg,
    // Full per-side spec (drives a box border when the source doc declared one) plus the
    // single-color fallback used for the plain bottom-rule case.
    border: c.border,
    borderColor: firstBorderColor(c.border),
  }));
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function classifyTable(
  node: TableNode,
  tok: Tokens = defaultTokens,
  warn?: WarnFn,
  classifyChildren?: ClassifyChildrenFn,
): ComponentNode | null {
  const { rows } = node;
  if (!rows.length) return null;

  const ncols = Math.max(...rows.map(r =>
    r.cells.reduce((s, c) => s + (c.colspan ?? 1), 0)
  ));

  // Single-row, single-cell (check physical cell count, not colspan-expanded ncols)
  if (rows.length === 1 && rows[0].cells.length === 1) {
    return classifySingleCell(rows[0].cells[0], tok, warn, classifyChildren);
  }

  // Single-row, multi-cell
  if (rows.length === 1 && ncols >= 2) {
    const cells = rows[0].cells;

    // GDocs letterhead/byline pattern: exactly 2 plain cells (no bg, no border), both with
    // content, the second right-aligned (e.g. "immersed" | "MEDIA & INVESTOR RELATIONS")
    // → splitRow, rendered with independently-aligned columns instead of an equal-width grid.
    if (
      cells.length === 2 &&
      cells.every(c => !hasMeaningfulBorder(c.border, tok) && (!c.bg || isNearWhiteOrRoot(c.bg, tok))) &&
      cells.every(c => hasMeaningfulContent(c, tok)) &&
      cellAlign(cells[0]) !== "right" &&
      cellAlign(cells[1]) === "right"
    ) {
      return {
        kind: "splitRow",
        props: { left: flattenRuns(cells[0], tok, warn), right: flattenRuns(cells[1], tok, warn) },
      };
    }

    // GDocs button pattern: [empty-spacer] [colored-cell-with-h5] [empty-spacer]
    // When only 1 cell has meaningful content, classify that cell directly instead of
    // treating the whole row as a stats grid.
    const meaningfulCells = cells.filter(c => hasMeaningfulContent(c, tok));
    if (meaningfulCells.length === 1) {
      const comp = classifySingleCell(meaningfulCells[0], tok, warn, classifyChildren);
      if (comp) return comp;
      // null → transparent cell, fall through to statsGrid
    }

    const borderColor = firstBorderColor(cells.find(c => c.border)?.border);
    return {
      kind: "statsGrid",
      props: { n: cells.length, widths: toWidthPercents(node.colWidths, cells.length), borderColor },
      children: cells.map(c => cellToChild(c, tok, warn)),
    };
  }

  // Multi-row, multi-col → recordRow
  if (ncols >= 2) {
    const cellCounts = new Set(rows.map(r => r.cells.length));
    const uniformCells = cellCounts.size === 1 ? rows[0].cells.length : 0;
    const borderColor = firstBorderColor(
      rows.flatMap(r => r.cells).find(c => c.border)?.border,
    );
    return {
      kind: "recordRow",
      props: {
        widths: toWidthPercents(node.colWidths, uniformCells),
        borderColor,
        rows: rows.map(r => ({
          bg: r.cells.every(c => c.bg === r.cells[0].bg) ? r.cells[0].bg : undefined,
          cells: rowCells(r.cells, tok, warn),
        })),
      },
    };
  }

  // Multi-row, single-col → treat each row independently
  // Return null so classify.ts iterates rows and re-classifies each cell
  return null;
}
