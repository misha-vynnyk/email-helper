import { mergeTokens,tokens } from "../config/tokens";
import { classifyTable } from "../detect/tableBlock";
import type { CellNode, Paragraph,TableNode } from "../ir/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

// The container kinds (calloutBox/statsGrid) carry `children`; ComponentNode is a
// discriminated union so a bare `.children` read doesn't narrow. These loose
// accessors let assertions reach known props/children by string key without casts
// at each call site — the surrounding `expect(result?.kind)` already fixes the kind.
type LooseNode = { props: Record<string, unknown>; children?: LooseNode[] };
const childrenOf = (n: unknown): LooseNode[] => (n as LooseNode)?.children ?? [];

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

  // Fix #1: h5-marked cell with a border but no bg must not become a bg-less buttonBand
  // (buttonBand with bg===undefined crashes render's isDarkBg(undefined) downstream).
  // Fix #3: dark bg + explicit border → still buttonBand/alertBand, border carried in props
  it("dark bg with border and href → buttonBand carries the border in props", () => {
    const cell = makeCell({
      bg: "#000000",
      border: { top: { color: "#ffffff" } },
      children: [makePara("Click me", "https://example.com")],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
    expect((result?.props as Record<string, unknown>)["border"]).toEqual({ top: { color: "#ffffff" } });
  });

  it("dark bg with border and no href → alertBand carries the border in props", () => {
    const cell = makeCell({ bg: "#000000", border: { top: { color: "#ffffff" } } });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("alertBand");
    expect((result?.props as Record<string, unknown>)["border"]).toEqual({ top: { color: "#ffffff" } });
  });

  it("h5 marker + border but no bg is NOT classified as buttonBand", () => {
    const cell = makeCell({
      border: { top: { color: "#000000" } },
      children: [{ type: "p", size: "small", headingLevel: 5, lines: [[makeRun("Button")]] }],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("buttonBand");
  });

  it("h5 marker + bg still classifies as buttonBand (no regression)", () => {
    const cell = makeCell({
      bg: "#123456",
      children: [{ type: "p", size: "small", headingLevel: 5, lines: [[makeRun("Button")]] }],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
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

// Regression: a multi-line dark box (banner headline + a "fake link" line styled
// blue/underlined with no real <a> + a footer line) must stay alertBand — findHref
// used to match the fake-link line anywhere in the cell and swallow the WHOLE box
// (unrelated header/footer text included) into one giant buttonBand <a> wrapper.
describe("classifyTable — dark cell, single-line vs multi-line (buttonBand narrowing)", () => {
  function fakeLinkPara(text: string): Paragraph {
    // GDocs "styled to look like a link" run: blue + underline, but no real <a href>.
    // fromDom.ts's isLinkColor heuristic is what attaches the placeholder href — here we
    // model its output directly (a run with href already set) since classifyTable operates
    // on the IR, not raw DOM.
    return { type: "p", size: "body", lines: [[{ text, href: "urlhere" }]] };
  }

  it("3 paragraphs, only the middle one link-styled → alertBand, not buttonBand", () => {
    const cell = makeCell({
      bg: "#0f766e",
      children: [
        makePara("$0.79/SHARE · REG A+ · NO ACCREDITATION REQUIRED"),
        fakeLinkPara("Lock In Your $0.79 Allocation →"),
        makePara("Up to 20% bonus shares · 9,500+ investors already in"),
      ],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("alertBand");
  });

  it("alertBand preserves all 3 lines with paragraph breaks (not flattened into one line)", () => {
    const cell = makeCell({
      bg: "#0f766e",
      children: [
        makePara("Headline"),
        fakeLinkPara("Lock In →"),
        makePara("Footer"),
      ],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    const props = result?.props as Record<string, unknown>;
    const lines = props["lines"] as unknown[];
    expect(lines).toHaveLength(3);
    expect((props["paraBreaks"] as Set<number>).has(1)).toBe(true);
    expect((props["paraBreaks"] as Set<number>).has(2)).toBe(true);
  });

  it("the fake-link run's href survives inside alertBand's lines (still renders as a link)", () => {
    const cell = makeCell({
      bg: "#0f766e",
      children: [makePara("Headline"), fakeLinkPara("Lock In →")],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    const lines = (result?.props as Record<string, unknown>)["lines"] as Array<Array<{ href?: string }>>;
    expect(lines[1][0].href).toBe("urlhere");
  });

  it("a single paragraph split into 2 lines via internal <br> is still 'multi-line' → alertBand", () => {
    const cell = makeCell({
      bg: "#0f766e",
      children: [{
        type: "p", size: "body",
        lines: [[{ text: "Headline" }], [{ text: "Lock In →", href: "urlhere" }]],
      }],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("alertBand");
  });

  it("a single-paragraph, single-line fake link cell is still promoted to buttonBand (no regression)", () => {
    const cell = makeCell({ bg: "#0f766e", children: [fakeLinkPara("Lock In →")] });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
    expect((result?.props as Record<string, unknown>)["href"]).toBe("urlhere");
  });

  it("single paragraph + real href → still buttonBand (existing CTA case unaffected)", () => {
    const cell = makeCell({ bg: "#000000", children: [makePara("Click me", "https://example.com")] });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
  });
});

// Fix #6: near-white/near-root-bg border colors are GDocs gridline leftovers, not intent
describe("classifyTable — meaningless (near-white) border", () => {
  it("unwraps a 1×1 cell whose border is near-white and has no bg", () => {
    const table = makeTable([[makeCell({ border: { top: { color: "#fafafa" } } })]]);
    expect(classifyTable(table)).toBeNull();
  });

  it("keeps a near-white border on a dark bg (deliberate accent, not a gridline leftover)", () => {
    const cell = makeCell({
      bg: "#000000",
      border: { top: { color: "#ffffff" } },
      children: [makePara("Click me", "https://example.com")],
    });
    const table = makeTable([[cell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("buttonBand");
    expect((result?.props as Record<string, unknown>)["border"]).toEqual({ top: { color: "#ffffff" } });
  });

  it("still classifies calloutBox for a visibly distinct border color", () => {
    const table = makeTable([[makeCell({
      border: { top: { color: "#c2410c" }, right: { color: "#c2410c" },
                bottom: { color: "#c2410c" }, left: { color: "#c2410c" } },
    })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("calloutBox");
  });
});

// Fix #9: without classifyChildren, calloutBox's fallback child must match cellToChild
describe("classifyTable — calloutBox fallback child (no classifyChildren)", () => {
  it("fallback child uses align='center' and carries bg, same as cellToChild", () => {
    const cell = makeCell({
      bg: "#fff7ed",
      border: { top: { color: "#c2410c" }, right: { color: "#c2410c" },
                bottom: { color: "#c2410c" }, left: { color: "#c2410c" } },
    });
    const table = makeTable([[cell]]);
    // classifyTable called with no 4th arg → classifySingleCell has no classifyChildren
    const result = classifyTable(table);
    expect(result?.kind).toBe("calloutBox");
    const child = childrenOf(result)[0];
    expect(child?.props["align"]).toBe("center");
    expect(child?.props["bg"]).toBe("#fff7ed");
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
    expect(childrenOf(result)).toHaveLength(3);
  });

  it("statsGrid children carry each cell's bg (e.g. a highlighted stat tile)", () => {
    const table = makeTable([[
      makeCell({ bg: "#f1ede6" }),
      makeCell({ bg: "#0a2463" }),
    ]]);
    const result = classifyTable(table);
    expect(childrenOf(result)[0].props["bg"]).toBe("#f1ede6");
    expect(childrenOf(result)[1].props["bg"]).toBe("#0a2463");
  });

  it("statsGrid child has no bg prop when the cell is transparent", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    const result = classifyTable(table);
    expect(childrenOf(result)[0].props["bg"]).toBeUndefined();
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

  // Fix #5: per-cell border colors must survive classification, not collapse to one shared color
  it("statsGrid children each carry their own borderColor", () => {
    const table = makeTable([[
      makeCell({ border: { top: { color: "#ff0000" } } }),
      makeCell({ border: { top: { color: "#0000ff" } } }),
    ]]);
    const result = classifyTable(table);
    expect(childrenOf(result)[0].props["borderColor"]).toBe("#ff0000");
    expect(childrenOf(result)[1].props["borderColor"]).toBe("#0000ff");
  });

  it("recordRow cells each carry their own borderColor", () => {
    const redCell = makeCell({ border: { top: { color: "#ff0000" } } });
    const blueCell = makeCell({ border: { top: { color: "#0000ff" } } });
    const table = makeTable([[redCell, makeCell()], [blueCell, makeCell()]]);
    const result = classifyTable(table);
    const rows = (result?.props as Record<string, unknown>)["rows"] as Array<{ cells: Array<Record<string, unknown>> }>;
    expect(rows[0].cells[0]["borderColor"]).toBe("#ff0000");
    expect(rows[1].cells[0]["borderColor"]).toBe("#0000ff");
  });

  // Bug fix: a cell with a label <p> + sublabel <p> (e.g. "THE SOFTWARE" / "Immersed App")
  // must keep both lines — flattening to a single Run[] silently glued them together with
  // no separator at all.
  it("recordRow cell with two paragraphs keeps both as separate lines", () => {
    const labelCell = makeCell({ children: [makePara("THE SOFTWARE"), makePara("Immersed App")] });
    const table = makeTable([[labelCell, makeCell()], [makeCell(), makeCell()]]);
    const result = classifyTable(table);
    const rows = (result?.props as Record<string, unknown>)["rows"] as Array<{ cells: Array<Record<string, unknown>> }>;
    const lines = rows[0].cells[0]["lines"] as unknown[][];
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual([{ text: "THE SOFTWARE" }]);
    expect(lines[1]).toEqual([{ text: "Immersed App" }]);
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

// ── splitRow (letterhead/byline: plain left cell + right-aligned right cell) ──

describe("classifyTable — splitRow", () => {
  function makeAlignedCell(text: string, align?: "left" | "center" | "right"): CellNode {
    return {
      type: "cell",
      children: [{ type: "p", size: "body", align, lines: [[makeRun(text)]] }],
    };
  }

  it("2 plain cells, second right-aligned via its paragraph → splitRow", () => {
    const table = makeTable([[makeAlignedCell("immersed"), makeAlignedCell("MEDIA & INVESTOR RELATIONS", "right")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("splitRow");
    expect((result?.props as Record<string, unknown>)["left"]).toEqual([{ text: "immersed" }]);
    expect((result?.props as Record<string, unknown>)["right"]).toEqual([{ text: "MEDIA & INVESTOR RELATIONS" }]);
  });

  it("2 plain cells, neither right-aligned → statsGrid, not splitRow", () => {
    const table = makeTable([[makeAlignedCell("a"), makeAlignedCell("b")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
  });

  it("both cells right-aligned → statsGrid, not splitRow (no plain left column)", () => {
    const table = makeTable([[makeAlignedCell("a", "right"), makeAlignedCell("b", "right")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
  });

  it("right cell has a bg → not splitRow (colored cell keeps its own classification)", () => {
    const cell = makeCell({ bg: "#f5f5f5" });
    const table = makeTable([[makeAlignedCell("a"), { ...cell, align: "right" }]]);
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("splitRow");
  });

  it("right cell has a meaningful border → not splitRow", () => {
    const rightCell: CellNode = {
      ...makeAlignedCell("b", "right"),
      border: { top: { color: "#c2410c" } },
    };
    const table = makeTable([[makeAlignedCell("a"), rightCell]]);
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("splitRow");
  });

  it("near-white bg on both cells is still transparent enough → splitRow", () => {
    const table = makeTable([[
      { ...makeAlignedCell("a"), bg: "#fefefe" },
      { ...makeAlignedCell("b", "right"), bg: "#fefefe" },
    ]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("splitRow");
  });

  it("cell.align (attribute) right-aligns just as reliably as the paragraph's align", () => {
    const table = makeTable([[
      makeAlignedCell("a"),
      { type: "cell", align: "right", children: [makePara("b")] },
    ]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("splitRow");
  });

  it("reversed alignment (left cell right-aligned, right cell plain) → statsGrid, not splitRow", () => {
    const table = makeTable([[makeAlignedCell("a", "right"), makeAlignedCell("b")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
  });

  it("center-aligned left cell still counts as 'not right' → splitRow", () => {
    const table = makeTable([[makeAlignedCell("a", "center"), makeAlignedCell("b", "right")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("splitRow");
  });

  it("3 cells, last right-aligned → statsGrid, not splitRow (splitRow is exactly 2 columns)", () => {
    const table = makeTable([[makeAlignedCell("a"), makeAlignedCell("b"), makeAlignedCell("c", "right")]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
    expect((result?.props as Record<string, unknown>)["n"]).toBe(3);
  });

  it("one cell empty → falls through to the single-meaningful-cell path, not splitRow", () => {
    const table = makeTable([[makeAlignedCell(""), makeAlignedCell("b", "right")]]);
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("splitRow");
  });

  it("multiple rows with a right-aligned 2nd column → recordRow, not splitRow (splitRow is single-row only)", () => {
    const table = makeTable([
      [makeAlignedCell("a"), makeAlignedCell("b", "right")],
      [makeAlignedCell("c"), makeAlignedCell("d", "right")],
    ]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("recordRow");
  });

  it("preserves href/bold/color runs on both sides", () => {
    const leftCell: CellNode = {
      type: "cell",
      children: [{ type: "p", size: "body", lines: [[{ text: "Name", bold: true }]] }],
    };
    const rightCell: CellNode = {
      type: "cell",
      children: [{
        type: "p", size: "body", align: "right",
        lines: [[{ text: "Role", color: "#6b7280", href: "https://example.com" }]],
      }],
    };
    const table = makeTable([[leftCell, rightCell]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("splitRow");
    const props = result?.props as Record<string, unknown>;
    expect(props["left"]).toEqual([{ text: "Name", bold: true }]);
    expect(props["right"]).toEqual([{ text: "Role", color: "#6b7280", href: "https://example.com" }]);
  });
});

// ── Empty table ───────────────────────────────────────────────────────────────

describe("classifyTable — edge cases", () => {
  it("returns null for empty table", () => {
    const table: TableNode = { type: "table", rows: [] };
    expect(classifyTable(table)).toBeNull();
  });
});
