// Phase 3: classify <table> StructuralNodes into ComponentNodes.
// Precedence (1×1): buttonBand → alertBand → calloutLeft → calloutBox → unwrap (transparent)
// Multi-cell:       statsGrid (1 row, N≥2) → recordRow (M rows, N≥2)

import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { isDarkBg } from "../ir/color";
import type { BorderSpec, CellNode, ComponentNode, Paragraph, Run,StructuralNode, TableNode, WarnFn } from "../ir/types";

/** Recurses back into classify.ts — threaded in to avoid a circular import. */
export type ClassifyChildrenFn = (nodes: StructuralNode[]) => ComponentNode[];

function firstBorderColor(border: BorderSpec | undefined): string | undefined {
  return border?.top?.color ?? border?.right?.color ?? border?.bottom?.color ?? border?.left?.color;
}

// ── Cell content helpers ──────────────────────────────────────────────────────

/**
 * Collect runs from a cell, descending into nested tables (their cells'
 * paragraphs are flattened in document order). Nested-table flattening is
 * reported via `warn` — the layout is lost, only the text survives.
 */
function flattenRuns(cell: CellNode, warn?: WarnFn): Run[] {
  const runs: Run[] = [];
  for (const child of cell.children) {
    if (child.type === "p") {
      runs.push(...child.lines.flat());
    } else if (child.type === "table") {
      warn?.("Вкладену таблицю сплющено до тексту (розмітка внутрішньої таблиці втрачена)");
      for (const row of child.rows) {
        for (const nested of row.cells) {
          runs.push(...flattenRuns(nested, undefined /* warn once per table */));
        }
      }
    }
  }
  return runs;
}

/** Paragraph lines of a cell, including lines from nested tables (flattened). */
function flattenLines(cell: CellNode, warn?: WarnFn): Run[][] {
  const lines: Run[][] = [];
  for (const child of cell.children) {
    if (child.type === "p") {
      lines.push(...child.lines);
    } else if (child.type === "table") {
      warn?.("Вкладену таблицю сплющено до тексту (розмітка внутрішньої таблиці втрачена)");
      for (const row of child.rows) {
        for (const nested of row.cells) {
          lines.push(...flattenLines(nested, undefined));
        }
      }
    }
  }
  return lines;
}

function findHref(cell: CellNode): string | null {
  for (const line of flattenLines(cell)) {
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
function hasMeaningfulContent(cell: CellNode): boolean {
  return flattenRuns(cell).some(r => r.text.trim() !== "");
}

function cellToChild(cell: CellNode, warn?: WarnFn): ComponentNode {
  return {
    kind: "paragraph",
    props: { lines: flattenLines(cell, warn), align: cell.align ?? "center", size: "small" as const, bg: cell.bg },
  };
}

// ── Column widths ─────────────────────────────────────────────────────────────

/**
 * Convert raw <colgroup> widths to integer percentages summing to 100.
 * Returns undefined when widths are missing/mismatched (e.g. colspan rows or
 * cols without a width attribute) — callers fall back to the equal split.
 */
function toWidthPercents(colWidths: number[] | undefined, ncells: number): number[] | undefined {
  if (!colWidths || colWidths.length !== ncells || ncells < 2) return undefined;
  const total = colWidths.reduce((s, w) => s + w, 0);
  if (total <= 0) return undefined;
  const pcts = colWidths.map(w => Math.floor((w / total) * 100));
  pcts[pcts.length - 1] = 100 - pcts.slice(0, -1).reduce((s, p) => s + p, 0);
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
  const border = cell.border;

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
      props: { runs: flattenRuns(cell, warn), href: tok.placeholderHref, bg, radius: 0 },
    };
  }

  if (bg && isDarkBg(bg, tok)) {
    const href = findHref(cell);
    if (href) {
      return { kind: "buttonBand", props: { runs: flattenRuns(cell, warn), href, bg, border } };
    }
    return { kind: "alertBand", props: { runs: flattenRuns(cell, warn), bg, border } };
  }

  // Pure border-left accent (+ optional light bg) → calloutLeft, using the
  // document's own border color instead of the house default.
  const isLeftAccentOnly = Boolean(border?.left) && !border?.top && !border?.right && !border?.bottom;
  if (isLeftAccentOnly) {
    return {
      kind: "calloutLeft",
      props: { runs: flattenRuns(cell, warn), bg, accentColor: border!.left!.color },
    };
  }

  // Any other border shape (full frame, partial multi-side, or a lone rule line) →
  // calloutBox. Recurse into children (via classify.ts) so nested content — e.g. a
  // button table inside a bordered CTA box — survives instead of being flattened to text.
  if (border) {
    const children = classifyChildren?.(cell.children) ?? [{
      kind: "paragraph" as const,
      props: { lines: flattenLines(cell, warn), align: cell.align ?? "left", size: "small" as const },
    }];
    return { kind: "calloutBox", props: { border, bg }, children };
  }

  // Light bg with no border info in the document → generic accent callout (house default color)
  return {
    kind: "calloutLeft",
    props: { runs: flattenRuns(cell, warn), bg, accentColor: tok.color.button },
  };
}

// ── Multi-row helper ──────────────────────────────────────────────────────────

function rowCells(cells: CellNode[], warn?: WarnFn) {
  return cells.map(c => ({
    runs: flattenRuns(c, warn),
    align: c.align ?? "left",
    bg: c.bg,
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

    // GDocs button pattern: [empty-spacer] [colored-cell-with-h5] [empty-spacer]
    // When only 1 cell has meaningful content, classify that cell directly instead of
    // treating the whole row as a stats grid.
    const meaningfulCells = cells.filter(hasMeaningfulContent);
    if (meaningfulCells.length === 1) {
      const comp = classifySingleCell(meaningfulCells[0], tok, warn, classifyChildren);
      if (comp) return comp;
      // null → transparent cell, fall through to statsGrid
    }

    const borderColor = firstBorderColor(cells.find(c => c.border)?.border);
    return {
      kind: "statsGrid",
      props: { n: cells.length, widths: toWidthPercents(node.colWidths, cells.length), borderColor },
      children: cells.map(c => cellToChild(c, warn)),
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
          cells: rowCells(r.cells, warn),
        })),
      },
    };
  }

  // Multi-row, single-col → treat each row independently
  // Return null so classify.ts iterates rows and re-classifies each cell
  return null;
}
