// Phase 3: classify <table> StructuralNodes into ComponentNodes.
// Precedence (1×1): buttonBand → alertBand → calloutLeft → unwrap (transparent)
// Multi-cell:       statsGrid (1 row, N≥2) → recordRow (M rows, N≥2)

import type { TableNode, CellNode, ComponentNode, Paragraph, Run } from "../ir/types";
import { isDarkBg } from "../ir/color";
import { tokens as defaultTokens } from "../config/tokens";
import type { Tokens } from "../config/tokens";

// ── Cell content helpers ──────────────────────────────────────────────────────

function flattenRuns(cell: CellNode): Run[] {
  return cell.children
    .filter((n): n is Paragraph => n.type === "p")
    .flatMap(p => p.lines.flat());
}

function findHref(cell: CellNode): string | null {
  for (const child of cell.children) {
    if (child.type !== "p") continue;
    for (const line of child.lines) {
      for (const run of line) {
        if (run.href) return run.href;
      }
    }
  }
  return null;
}

function cellToChild(cell: CellNode): ComponentNode {
  const lines = cell.children
    .filter((n): n is Paragraph => n.type === "p")
    .map(p => p.lines)
    .flat();
  return {
    kind: "paragraph",
    props: { lines, align: cell.align ?? "center", size: "small" as const },
  };
}

// ── Single-cell classification ────────────────────────────────────────────────

function classifySingleCell(cell: CellNode, tok: Tokens): ComponentNode | null {
  const bg = cell.bg;

  // No color or white → transparent, let classify.ts unwrap
  if (!bg || bg === "#ffffff") return null;

  if (isDarkBg(bg)) {
    const href = findHref(cell);
    if (href) {
      return { kind: "buttonBand", props: { runs: flattenRuns(cell), href, bg } };
    }
    return { kind: "alertBand", props: { runs: flattenRuns(cell), bg } };
  }

  // Light accent bg → callout with left border
  return {
    kind: "calloutLeft",
    props: { runs: flattenRuns(cell), bg, accentColor: tok.color.button },
  };
}

// ── Multi-row helper ──────────────────────────────────────────────────────────

function rowCells(cells: CellNode[]) {
  return cells.map(c => ({
    runs: flattenRuns(c),
    align: c.align ?? "left",
    bg: c.bg,
  }));
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function classifyTable(node: TableNode, tok: Tokens = defaultTokens): ComponentNode | null {
  const { rows } = node;
  if (!rows.length) return null;

  const ncols = Math.max(...rows.map(r =>
    r.cells.reduce((s, c) => s + (c.colspan ?? 1), 0)
  ));

  // Single-row, single-cell (check physical cell count, not colspan-expanded ncols)
  if (rows.length === 1 && rows[0].cells.length === 1) {
    return classifySingleCell(rows[0].cells[0], tok);
  }

  // Single-row, multi-cell → statsGrid
  if (rows.length === 1 && ncols >= 2) {
    return {
      kind: "statsGrid",
      props: { n: rows[0].cells.length },
      children: rows[0].cells.map(cellToChild),
    };
  }

  // Multi-row, multi-col → recordRow
  if (ncols >= 2) {
    return {
      kind: "recordRow",
      props: {
        rows: rows.map(r => ({
          bg: r.cells.every(c => c.bg === r.cells[0].bg) ? r.cells[0].bg : undefined,
          cells: rowCells(r.cells),
        })),
      },
    };
  }

  // Multi-row, single-col → treat each row independently
  // Return null so classify.ts iterates rows and re-classifies each cell
  return null;
}
