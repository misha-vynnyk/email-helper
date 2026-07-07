import { mergeTokens,tokens } from "../config/tokens";
import { classifyTable } from "../detect/tableBlock";
import type { CellNode, Paragraph,TableNode } from "../ir/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRun(text: string, href?: string) {
  return href ? { text, href } : { text };
}

function makePara(text: string, href?: string): Paragraph {
  return { type: "p", size: "body", lines: [[makeRun(text, href)]] };
}

function makeCell(overrides: Partial<CellNode> = {}): CellNode {
  return {
    type: "cell",
    children: [makePara("text")],
    ...overrides,
  };
}

function makeTable(cells: CellNode[][]): TableNode {
  return {
    type: "table",
    rows: cells.map(rowCells => ({ type: "row", cells: rowCells })),
  };
}

// ── Single-cell classification ────────────────────────────────────────────────

describe("classifyTable — single-cell", () => {
  it("returns null for a white-background cell (transparent/unwrap)", () => {
    const table = makeTable([[makeCell({ bg: "#ffffff" })]]);
    expect(classifyTable(table)).toBeNull();
  });

  it("returns null when cell has no background", () => {
    const table = makeTable([[makeCell()]]);
    expect(classifyTable(table)).toBeNull();
  });

  it("classifies dark cell without href as alertBand", () => {
    const table = makeTable([[makeCell({ bg: "#000000" })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("alertBand");
    expect((result?.props as Record<string, unknown>)["bg"]).toBe("#000000");
  });

  it("classifies dark cell with href as buttonBand", () => {
    const cell = makeCell({
      bg: "#000000",
      children: [makePara("Click me", "https://example.com")],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
    expect((result?.props as Record<string, unknown>)["href"]).toBe("https://example.com");
  });

  it("classifies light accent cell as calloutLeft", () => {
    const table = makeTable([[makeCell({ bg: "#f5f5f5" })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("calloutLeft");
  });

  it("calloutLeft accentColor comes from tok.color.button, not module singleton", () => {
    const customTok = mergeTokens(tokens, { color: { button: "#ff0000" } });
    const table = makeTable([[makeCell({ bg: "#f5f5f5" })]]);
    const result = classifyTable(table, customTok);
    expect((result?.props as Record<string, unknown>)["accentColor"]).toBe("#ff0000");
  });

  // Fix #1: colspan=2 on a single physical cell → still single-cell, NOT statsGrid
  it("single physical cell with colspan=2 is NOT classified as statsGrid", () => {
    const cell = makeCell({ bg: "#f5f5f5", colspan: 2 });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    // Single physical cell → calloutLeft or alertBand or null, never statsGrid
    expect(result?.kind).not.toBe("statsGrid");
    expect(result?.kind).toBe("calloutLeft");
  });
});

// ── Multi-cell classification ─────────────────────────────────────────────────

describe("classifyTable — multi-cell", () => {
  it("single row with 2 cells → statsGrid", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
  });

  it("single row with 3 cells → statsGrid with correct n", () => {
    const table = makeTable([[makeCell(), makeCell(), makeCell()]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
    expect((result?.props as Record<string, unknown>)["n"]).toBe(3);
    expect(result?.children).toHaveLength(3);
  });

  it("statsGrid children carry each cell's bg (e.g. a highlighted stat tile)", () => {
    const table = makeTable([[
      makeCell({ bg: "#f1ede6" }),
      makeCell({ bg: "#0a2463" }),
    ]]);
    const result = classifyTable(table);
    expect(result?.children?.[0].props["bg"]).toBe("#f1ede6");
    expect(result?.children?.[1].props["bg"]).toBe("#0a2463");
  });

  it("statsGrid child has no bg prop when the cell is transparent", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    const result = classifyTable(table);
    expect(result?.children?.[0].props["bg"]).toBeUndefined();
  });

  it("multiple rows with 2 columns → recordRow", () => {
    const table = makeTable([
      [makeCell(), makeCell()],
      [makeCell(), makeCell()],
    ]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("recordRow");
    const rows = (result?.props as Record<string, unknown>)["rows"] as unknown[];
    expect(rows).toHaveLength(2);
  });

  it("multiple rows with single column → null (each row processed independently)", () => {
    const table = makeTable([
      [makeCell()],
      [makeCell()],
    ]);
    // ncols=1 but multiple rows → null, classify.ts handles each row separately
    const result = classifyTable(table);
    expect(result).toBeNull();
  });
});

// ── Empty table ───────────────────────────────────────────────────────────────

describe("classifyTable — edge cases", () => {
  it("returns null for empty table", () => {
    const table: TableNode = { type: "table", rows: [] };
    expect(classifyTable(table)).toBeNull();
  });
});
