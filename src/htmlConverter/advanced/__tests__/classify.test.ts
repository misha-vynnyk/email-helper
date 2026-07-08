import { tokens } from "../config/tokens";
import { classify } from "../detect/classify";
import type { CellNode,Paragraph, StructuralNode, TableNode } from "../ir/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePara(text: string, size: Paragraph["size"] = "body", align: Paragraph["align"] = "left"): Paragraph {
  return { type: "p", size, align, lines: [[{ text }]] };
}

// A leading bullet/checkmark run followed by the item's own text, matching how a manually-
// typed list ("✓ Partners: ...") or a real <li> (fromDom's "• " prefix) is represented.
function makeListPara(marker: string, text: string): Paragraph {
  return { type: "p", size: "body", align: "left", lines: [[{ text: marker }, { text }]] };
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

  // Bug fix: GDocs encodes a centered banner/eyebrow group (headline + subline) as two
  // separate centered <p>s — these should merge with a single <br>, not a paragraph gap.
  it("merges centered adjacent paragraphs with NO paraBreak (single <br>)", () => {
    const nodes: StructuralNode[] = [
      makePara("REG A+ · CLOSING SOON", "body", "center"),
      makePara("Entry price: $0.79/share", "body", "center"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].props["paraBreaks"]).toBeUndefined();
  });

  // Left/right-aligned adjacent paragraphs are genuine prose (short-paragraph marketing
  // copy) and keep the <br><br> blank-line separation between them.
  it("merges left-aligned adjacent paragraphs WITH a paraBreak (double <br>)", () => {
    const nodes: StructuralNode[] = [
      makePara("Everyone is talking about SpaceX.", "body", "left"),
      makePara("I get it. It's a great story.", "body", "left"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    const breaks = result[0].props["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  // Bug fix: manually-typed checklists ("✓ Partners: ...") and real <ul>/<li> lists (which
  // fromDom.ts renders as plain left-aligned paragraphs prefixed with "• ") both encode each
  // item as its own <p> with a leading marker run — these must merge with single <br>s.
  it("merges adjacent paragraphs that both start with a bullet/checkmark marker — no paraBreak", () => {
    const nodes: StructuralNode[] = [
      makeListPara("✓  ", "Partners: Google, Meta"),
      makeListPara("✓  ", "Backed by: Pat Gelsinger"),
      makeListPara("✓  ", "4,000% valuation growth"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].props["paraBreaks"]).toBeUndefined();
    const lines = result[0].props["lines"] as unknown[][];
    expect(lines).toHaveLength(3);
  });

  it("does NOT treat a single dash/asterisk mid-sentence as a list marker", () => {
    // The marker check only fires on an ISOLATED leading run — a run beginning with "-"
    // but continuing into prose text must not be mistaken for a bullet.
    const nodes: StructuralNode[] = [
      { type: "p", size: "body", align: "left", lines: [[{ text: "- not a bullet, just a dash-led sentence." }]] },
      { type: "p", size: "body", align: "left", lines: [[{ text: "Second sentence continues normally." }]] },
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    const breaks = result[0].props["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
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

  // Fix #4: merge still keeps the first table's borderColor, but warns when they differ
  it("keeps the first table's borderColor when merging, and warns on mismatch", () => {
    const redCell: CellNode = { ...makeCell(), border: { top: { color: "#ff0000" } } };
    const blueCell: CellNode = { ...makeCell(), border: { top: { color: "#0000ff" } } };
    const t1 = makeTable([[redCell, makeCell()], [makeCell(), makeCell()]]);
    const t2 = makeTable([[blueCell, makeCell()], [makeCell(), makeCell()]]);
    const warn = jest.fn();
    const result = classify([t1, t2], tokens, warn);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("recordRow");
    expect((result[0].props as Record<string, unknown>)["borderColor"]).toBe("#ff0000");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("рамки"));
  });

  it("does not warn when merged tables share the same borderColor", () => {
    const redCellA: CellNode = { ...makeCell(), border: { top: { color: "#ff0000" } } };
    const redCellB: CellNode = { ...makeCell(), border: { top: { color: "#ff0000" } } };
    const t1 = makeTable([[redCellA, makeCell()], [makeCell(), makeCell()]]);
    const t2 = makeTable([[redCellB, makeCell()], [makeCell(), makeCell()]]);
    const warn = jest.fn();
    classify([t1, t2], tokens, warn);
    expect(warn).not.toHaveBeenCalled();
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

// ── Heading markers (h1/h4/h5/h6) ────────────────────────────────────────────

describe("classify — heading markers", () => {
  function makeHeading(level: number, text: string): Paragraph {
    const size = (level === 1 || level === 2) ? "headline" : (level === 5 || level === 6) ? "small" : "body";
    return { type: "p", size, headingLevel: level, lines: [[{ text }]] };
  }

  it("h5 → buttonBand component", () => {
    const result = classify([makeHeading(5, "Click me")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("buttonBand");
    expect(result[0].props["bg"]).toBe(tokens.color.button);
  });

  it("h5 button runs contain the text", () => {
    const result = classify([makeHeading(5, "Buy now")]);
    const runs = result[0].props["runs"] as Array<{ text: string }>;
    expect(runs.map(r => r.text).join("")).toContain("Buy now");
  });

  it("h5 button uses placeholder href when no href in runs", () => {
    const result = classify([makeHeading(5, "Click")]);
    expect(result[0].props["href"]).toBe(tokens.placeholderHref);
  });

  it("h5 button always uses placeholder href regardless of run href", () => {
    const para: Paragraph = {
      type: "p", size: "small", headingLevel: 5,
      lines: [[{ text: "Go", href: "https://example.com" }]],
    };
    const result = classify([para]);
    expect(result[0].props["href"]).toBe(tokens.placeholderHref);
  });

  it("h4 → paragraph with variant=quote", () => {
    const result = classify([makeHeading(4, "Quote text")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect(result[0].props["variant"]).toBe("quote");
  });

  it("h1 → paragraph with size=headline (no buttonBand)", () => {
    const result = classify([makeHeading(1, "Headline")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect(result[0].props["size"]).toBe("headline");
  });

  it("h6 → paragraph with size=small", () => {
    const result = classify([makeHeading(6, "Footer text")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect(result[0].props["size"]).toBe("small");
  });

  it("h4 paragraphs are NOT merged with adjacent body paragraphs", () => {
    const nodes: StructuralNode[] = [
      makePara("before"),
      makeHeading(4, "quote"),
      makePara("after"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(3);
    expect(result[1].props["variant"]).toBe("quote");
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
