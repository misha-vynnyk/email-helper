import { classify } from "../detect/classify";
import type { StructuralNode, Paragraph, TableNode, CellNode } from "../ir/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePara(text: string, size: Paragraph["size"] = "body", align: Paragraph["align"] = "left"): Paragraph {
  return { type: "p", size, align, lines: [[{ text }]] };
}

function makeCell(children: StructuralNode[] = [], bg?: string): CellNode {
  return { type: "cell", children: children.length ? children : [makePara("cell")], bg };
}

function makeTable(rows: CellNode[][]): TableNode {
  return {
    type: "table",
    rows: rows.map(cells => ({ type: "row", cells })),
  };
}

// ── Paragraph merging ─────────────────────────────────────────────────────────

describe("classify — paragraph merging", () => {
  it("merges consecutive same-size same-align paragraphs", () => {
    const nodes: StructuralNode[] = [makePara("line 1"), makePara("line 2")];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    const lines = result[0].props["lines"] as unknown[][];
    expect(lines).toHaveLength(2);
  });

  it("does NOT merge paragraphs with different sizes", () => {
    const nodes: StructuralNode[] = [makePara("big", "headline"), makePara("small", "body")];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
  });

  it("does NOT merge paragraphs with different alignments", () => {
    const nodes: StructuralNode[] = [makePara("left", "body", "left"), makePara("center", "body", "center")];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
  });

  it("merges only adjacent paragraphs — gap breaks the chain", () => {
    const darkTable = makeTable([[makeCell([makePara("alert")], "#000000")]]);
    const nodes: StructuralNode[] = [
      makePara("before"),
      darkTable,
      makePara("after"),
    ];
    const result = classify(nodes);
    // before | alertBand | after — 3 components, paragraphs not merged across the band
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("paragraph");
    expect(result[1].kind).toBe("alertBand");
    expect(result[2].kind).toBe("paragraph");
  });
});

// ── recordRow merging ─────────────────────────────────────────────────────────

describe("classify — recordRow merging", () => {
  it("merges consecutive recordRows with the same column count", () => {
    const row2col = makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]);
    const result = classify([row2col]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("recordRow");
  });

  it("merges recordRows from two separate tables when same ncols", () => {
    const t1 = makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]);
    const t2 = makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]);
    const result = classify([t1, t2]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("recordRow");
    const rows = result[0].props["rows"] as unknown[];
    expect(rows).toHaveLength(4);
  });

  // Fix #4: different ncols must NOT merge
  it("does NOT merge recordRows with different column counts", () => {
    const t2col = makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]);
    const t3col = makeTable([[makeCell(), makeCell(), makeCell()], [makeCell(), makeCell(), makeCell()]]);
    const result = classify([t2col, t3col]);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("recordRow");
    expect(result[1].kind).toBe("recordRow");
  });
});

// ── Table unwrapping ──────────────────────────────────────────────────────────

describe("classify — table unwrapping", () => {
  it("unwraps a transparent 1-cell table and classifies its content", () => {
    // classifyTable returns null → classify recurses into cells
    const inner = makePara("inside a transparent cell");
    const table = makeTable([[makeCell([inner])]]);
    const result = classify([table]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
  });

  it("keeps statsGrid from a 1-row multi-cell table", () => {
    const table = makeTable([[makeCell(), makeCell(), makeCell()]]);
    const result = classify([table]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("statsGrid");
  });
});

// ── Empty input ───────────────────────────────────────────────────────────────

describe("classify — empty input", () => {
  it("returns empty array for empty input", () => {
    expect(classify([])).toEqual([]);
  });

  it("skips table nodes with empty rows", () => {
    const emptyTable: TableNode = { type: "table", rows: [] };
    const result = classify([emptyTable]);
    expect(result).toHaveLength(0);
  });
});
