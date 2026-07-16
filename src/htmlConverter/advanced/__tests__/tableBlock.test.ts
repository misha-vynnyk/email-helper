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

  // No border declared in the source → don't invent one; a light-bg cell with no
  // border info renders as a plain colored box (alertBand), not a bordered callout.
  it("classifies light bg cell with no border as alertBand, no accent color needed", () => {
    const table = makeTable([[makeCell({ bg: "#f5f5f5" })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("alertBand");
    expect((result?.props as Record<string, unknown>)["border"]).toBeUndefined();
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
    expect(result?.kind).toBe("alertBand");
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

// GDocs represents a divider under a text block as a 1×1 table with only
// border-bottom set — that's a rule, not a boxed callout.
describe("classifyTable — bottom-only border (GDocs divider idiom)", () => {
  it("classifies a border-bottom-only, no-bg cell as textDivider", () => {
    const table = makeTable([[makeCell({
      border: { bottom: { color: "#111111" } },
      children: [makePara("Some plain text")],
    })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("textDivider");
    expect((result?.props as Record<string, unknown>)["ruleColor"]).toBe("#111111");
  });

  it("still classifies calloutBox when a bottom-only border cell also has a bg", () => {
    const table = makeTable([[makeCell({
      bg: "#fff7ed",
      border: { bottom: { color: "#111111" } },
    })]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("calloutBox");
  });
});

// Fix #9: without classifyChildren, calloutBox's fallback child must match cellToChild
describe("classifyTable — calloutBox fallback child (no classifyChildren)", () => {
  it("fallback child uses tok.statsGridDefaultAlign and carries bg, same as cellToChild", () => {
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
    expect(child?.props["align"]).toBe(tokens.statsGridDefaultAlign);
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

  // GDocs column-resize widths are rarely pixel-perfect even when the author intended equal
  // columns — a real repro: a 2-up stat-card row (two side-by-side metric tiles) exported as
  // 292/328 (620 total), each only ~5.8% off the 310 average. Treated as an intentional equal
  // grid and split 50/50, not the noisy 47/53 the raw ratio would give.
  it("near-equal 2-col widths (292/328) split exactly 50/50, not the raw 47/53 ratio", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    table.colWidths = [292, 328];
    const result = classifyTable(table);
    expect((result?.props as Record<string, unknown>)["widths"]).toEqual([50, 50]);
  });

  it("near-equal 4-col widths (156/155/155/156) split exactly 25/25/25/25", () => {
    const table = makeTable([[makeCell(), makeCell(), makeCell(), makeCell()]]);
    table.colWidths = [156, 155, 155, 156];
    const result = classifyTable(table);
    expect((result?.props as Record<string, unknown>)["widths"]).toEqual([25, 25, 25, 25]);
  });

  // A genuinely asymmetric layout (e.g. a 1/3-2/3 sidebar+content row) must keep its real
  // ratio — each column is ~33% off the 300 average, well past the equal-width tolerance.
  it("clearly different column widths (200/400) keep their real proportional ratio", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    table.colWidths = [200, 400];
    const result = classifyTable(table);
    expect((result?.props as Record<string, unknown>)["widths"]).toEqual([33, 67]);
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

// ── Accent bar expressed as a narrow empty column (GDocs alternative to border-left) ──

describe("classifyTable — accent bar via empty colored column", () => {
  function makeEmptyCell(bg: string): CellNode {
    return { type: "cell", bg, children: [{ type: "p", size: "body", lines: [] }] };
  }

  it("narrow colored empty cell + content cell → calloutLeft using the empty cell's bg as accent", () => {
    const table = makeTable([[makeEmptyCell("#047857"), makeCell({ bg: "#f4f1e8" })]]);
    table.colWidths = [16, 608];
    const result = classifyTable(table);
    expect(result?.kind).toBe("calloutLeft");
    expect((result?.props as Record<string, unknown>)["accentColor"]).toBe("#047857");
    expect((result?.props as Record<string, unknown>)["bg"]).toBe("#f4f1e8");
  });

  it("accent bar on the right (narrow cell last) → border-right, not calloutLeft", () => {
    const table = makeTable([[makeCell({ bg: "#f4f1e8" }), makeEmptyCell("#047857")]]);
    table.colWidths = [608, 16];
    const result = classifyTable(table);
    // No dedicated "right accent" kind — falls to the generic bordered-box route, which
    // still keeps the color/side instead of losing it.
    expect(result?.kind).toBe("calloutBox");
    const border = (result?.props as Record<string, unknown>)["border"] as Record<string, unknown>;
    expect((border["right"] as Record<string, unknown>)["color"]).toBe("#047857");
    expect(border["left"]).toBeUndefined();
  });

  it("does NOT fire when the narrow cell's bg is near-white (real gridline leftover, not an accent)", () => {
    const table = makeTable([[makeEmptyCell("#ffffff"), makeCell({ bg: "#f4f1e8" })]]);
    table.colWidths = [16, 608];
    const result = classifyTable(table);
    // Falls through to the existing "1 meaningful cell" shortcut instead.
    expect(result?.kind).not.toBe("calloutLeft");
  });

  it("does NOT fire when the two columns are comparably wide (not a narrow bar)", () => {
    const table = makeTable([[makeEmptyCell("#047857"), makeCell({ bg: "#f4f1e8" })]]);
    table.colWidths = [300, 320];
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("calloutLeft");
  });

  it("does NOT fire when the content cell already has its own border (ambiguous — leave as-is)", () => {
    const contentCell = makeCell({ bg: "#f4f1e8", border: { bottom: { color: "#c00000" } } });
    const table = makeTable([[makeEmptyCell("#047857"), contentCell]]);
    table.colWidths = [16, 608];
    const result = classifyTable(table);
    expect(result?.kind).not.toBe("calloutLeft");
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

// ── § inside nested blocks (calloutLeft) ────────────────────────────────────────
// flattenLinesWithBreaks used to ignore tightNext/tightBefore entirely — every
// paragraph-to-paragraph transition inside a bordered/accented cell always got a
// <br><br>, with no way to signal a single-<br> gap via §.

function makeParaTight(text: string, extra: Partial<Pick<Paragraph, "tightNext" | "tightBefore">>): Paragraph {
  return { type: "p", size: "body", lines: [[makeRun(text)]], ...extra };
}

describe("classifyTable — calloutLeft honors § (tightNext/tightBefore)", () => {
  it("without §, two paragraphs in a calloutLeft cell get a paraBreak (<br><br>)", () => {
    const cell = makeCell({
      border: { left: { color: "#c2410c" } },
      children: [makePara("First"), makePara("Second")],
    });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("calloutLeft");
    const paraBreaks = (result?.props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(paraBreaks.has(1)).toBe(true);
  });

  it("trailing § (tightNext) on the first paragraph suppresses the paraBreak", () => {
    const cell = makeCell({
      border: { left: { color: "#c2410c" } },
      children: [makeParaTight("First", { tightNext: true }), makePara("Second")],
    });
    const result = classifyTable(makeTable([[cell]]));
    const paraBreaks = (result?.props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(paraBreaks.has(1)).toBe(false);
  });

  it("leading § (tightBefore) on the second paragraph suppresses the paraBreak", () => {
    const cell = makeCell({
      border: { left: { color: "#c2410c" } },
      children: [makePara("First"), makeParaTight("Second", { tightBefore: true })],
    });
    const result = classifyTable(makeTable([[cell]]));
    const paraBreaks = (result?.props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(paraBreaks.has(1)).toBe(false);
  });

  // Regression: a real CTA (h5-in-colored-cell nested table) inside a left-accent quote
  // box used to be silently flattened to plain text by flattenLinesWithBreaks (the
  // nestedTableFlattened path) — the same fidelity bug alertBand already avoided via
  // flattenCellForAlertBand. calloutLeft now uses the same flattener.
  it("preserves a nested h5-button table as a real button instead of flattening it to text", () => {
    const buttonCell = makeCell({
      bg: "#38a169",
      children: [{ type: "p", size: "small", headingLevel: 5, lines: [[makeRun("Watch the video")]] }],
    });
    const buttonTable: TableNode = makeTable([[buttonCell]]);
    const cell = makeCell({
      border: { left: { color: "#38a169" } },
      children: [makePara("Intro text"), buttonTable],
    });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("calloutLeft");
    const props = result?.props as Record<string, unknown>;
    const buttons = props["buttons"] as { atLine: number; props: Record<string, unknown> }[];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props["bg"]).toBe("#38a169");
  });
});

// ── Cell alignment from the inner <p> (F3/F9 — GDocs puts text-align on the paragraph) ─

describe("classifyTable — cell alignment read from the inner paragraph", () => {
  function alignedPara(text: string, align: "left" | "center" | "right"): Paragraph {
    return { type: "p", size: "body", align, lines: [[makeRun(text)]] };
  }

  it("statsGrid cell uses the first paragraph's align instead of always falling back", () => {
    // 3 cells so the two-cell splitRow (letterhead) pattern can't match
    const table = makeTable([[
      makeCell({ children: [alignedPara("Revenue", "left")] }),
      makeCell({ children: [alignedPara("42", "right")] }),
      makeCell(),
    ]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
    expect(childrenOf(result)[0].props["align"]).toBe("left");
    expect(childrenOf(result)[1].props["align"]).toBe("right");
    expect(childrenOf(result)[2].props["align"]).toBe(tokens.statsGridDefaultAlign);
  });

  it("statsGrid cell falls back to tok.statsGridDefaultAlign when neither the cell nor its paragraph declares align", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("statsGrid");
    expect(childrenOf(result)[0].props["align"]).toBe(tokens.statsGridDefaultAlign);
  });

  // The center fallback is a converter-side guess (GDocs omitting text-align actually means
  // "left", the CSS default — see config/tokens.ts's statsGridDefaultAlign doc comment), not
  // a fact read from the document — config-tunable per profile without touching this logic.
  it("statsGrid's no-align fallback follows tok.statsGridDefaultAlign, not a hardcoded value", () => {
    const table = makeTable([[makeCell(), makeCell()]]);
    const tok = mergeTokens(tokens, { statsGridDefaultAlign: "left" });
    const result = classifyTable(table, tok);
    expect(result?.kind).toBe("statsGrid");
    expect(childrenOf(result)[0].props["align"]).toBe("left");
  });

  it("recordRow cell uses the paragraph's align (mixed text-left / numbers-center survives)", () => {
    const table = makeTable([
      [makeCell(), makeCell({ children: [alignedPara("Users", "center")] })],
      [makeCell(), makeCell({ children: [alignedPara("490M", "center")] })],
    ]);
    const result = classifyTable(table);
    expect(result?.kind).toBe("recordRow");
    const rows = (result?.props as Record<string, unknown>)["rows"] as Array<{ cells: Array<{ align?: string }> }>;
    expect(rows[0].cells[0].align).toBe("left");
    expect(rows[0].cells[1].align).toBe("center");
    expect(rows[1].cells[1].align).toBe("center");
  });
});

// ── Nested colored band inside a dark box survives (F10) ─────────────────────

describe("classifyTable — dark bordered box keeps a nested colored band", () => {
  const fullBorder = {
    top: { color: "#000000" }, right: { color: "#000000" },
    bottom: { color: "#000000" }, left: { color: "#000000" },
  };

  it("keeps the nested band's bg as a bands segment instead of flattening it to text", () => {
    const nestedCta = makeTable([[makeCell({ bg: "#0a2463", children: [makePara("INVEST AT $0.50 →")] })]]);
    const outer = makeCell({
      bg: "#000000",
      border: fullBorder,
      children: [makePara("SERIES A · REG A+"), nestedCta],
    });
    const warn = jest.fn();
    const result = classifyTable(makeTable([[outer]]), undefined, warn);
    expect(result?.kind).toBe("alertBand");
    const bands = (result?.props as Record<string, unknown>)["bands"] as Array<{ atLine: number; props: { bg: string } }>;
    expect(bands).toHaveLength(1);
    expect(bands[0].props.bg).toBe("#0a2463");
    expect(bands[0].atLine).toBe(1);
    // The band survived — no "nested table flattened" warning for it
    expect(warn).not.toHaveBeenCalled();
  });

  it("a nested band alone does not promote the outer cell to one giant buttonBand", () => {
    const nestedCta = makeTable([[makeCell({ bg: "#0a2463", children: [makePara("CTA", "https://example.com")] })]]);
    const outer = makeCell({ bg: "#000000", border: fullBorder, children: [nestedCta] });
    const result = classifyTable(makeTable([[outer]]));
    expect(result?.kind).toBe("alertBand");
  });
});

// ── Multi-line content joined with spaces when forced onto one line (F2) ─────

describe("classifyTable — multi-line labels don't glue words together", () => {
  it("h5 button label lines are space-separated", () => {
    const h5: Paragraph = {
      type: "p", size: "small", headingLevel: 5,
      lines: [[makeRun("Click")], [makeRun("Here")]],
    };
    const result = classifyTable(makeTable([[makeCell({ bg: "#28b628", children: [h5] })]]));
    expect(result?.kind).toBe("buttonBand");
    const runs = (result?.props as Record<string, unknown>)["runs"] as Array<{ text: string }>;
    expect(runs.map(r => r.text).join("")).toBe("Click Here");
  });

  it("splitRow columns join their lines with a space", () => {
    const twoLines: Paragraph = { type: "p", size: "body", lines: [[makeRun("MEDIA &")], [makeRun("INVESTOR RELATIONS")]] };
    const right: CellNode = makeCell({ align: "right", children: [twoLines] });
    const result = classifyTable(makeTable([[makeCell(), right]]));
    expect(result?.kind).toBe("splitRow");
    const rightRuns = (result?.props as Record<string, unknown>)["right"] as Array<{ text: string }>;
    expect(rightRuns.map(r => r.text).join("")).toBe("MEDIA & INVESTOR RELATIONS");
  });
});

// ── List markers survive flattening (Ітерація 9c) ────────────────────────────
// A cell's content is always flattened to plain text (flattenLinesWithBreaks /
// flattenCellForAlertBand — no real <ul> is reachable from inside a table cell), so
// listItem <li>-derived paragraphs used to lose their bullet/number entirely once
// flattened — this regression checks the manual "• "/"N. " text prefix survives.

describe("classifyTable — list items keep a bullet/number marker when flattened", () => {
  function listPara(text: string, extra: Partial<Pick<Paragraph, "ordered" | "listGroupId">> = {}): Paragraph {
    return { type: "p", size: "body", listItem: true, lines: [[makeRun(text)]], ...extra };
  }

  it("unordered <li> items get a '• ' prefix", () => {
    const cell = makeCell({
      bg: "#f1ede6",
      children: [listPara("A", { listGroupId: 1 }), listPara("B", { listGroupId: 1 })],
    });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("alertBand");
    const lines = (result?.props as Record<string, unknown>)["lines"] as Array<Array<{ text: string }>>;
    expect(lines[0][0].text).toBe("• A");
    expect(lines[1][0].text).toBe("• B");
  });

  it("ordered <li> items get a numbered '1. ', '2. ' prefix, resetting per listGroupId", () => {
    const cell = makeCell({
      bg: "#f1ede6",
      children: [
        listPara("First", { ordered: true, listGroupId: 1 }),
        listPara("Second", { ordered: true, listGroupId: 1 }),
        listPara("Restarted", { ordered: true, listGroupId: 2 }),
      ],
    });
    const result = classifyTable(makeTable([[cell]]));
    const lines = (result?.props as Record<string, unknown>)["lines"] as Array<Array<{ text: string }>>;
    expect(lines[0][0].text).toBe("1. First");
    expect(lines[1][0].text).toBe("2. Second");
    expect(lines[2][0].text).toBe("1. Restarted"); // new listGroupId restarts numbering
  });

  it("a non-list paragraph in between resets the counter for the next list run", () => {
    const cell = makeCell({
      bg: "#f1ede6",
      children: [
        listPara("First", { ordered: true, listGroupId: 1 }),
        { type: "p", size: "body", lines: [[makeRun("Interrupting prose")]] },
        listPara("Restarted", { ordered: true, listGroupId: 1 }),
      ],
    });
    const result = classifyTable(makeTable([[cell]]));
    const lines = (result?.props as Record<string, unknown>)["lines"] as Array<Array<{ text: string }>>;
    expect(lines[0][0].text).toBe("1. First");
    expect(lines[1][0].text).toBe("Interrupting prose");
    expect(lines[2][0].text).toBe("1. Restarted");
  });
});

// ── Images as direct cell children (GDocs' <p><span><img></span></p> wrapping means
// these arrive as standalone ImageNodes, not part of any paragraph's runs) ─────────
// Regression for a real GDocs doc: a dark 1×1 box (headline + CTA line + a plain
// screenshot image, no <a>) silently dropped the image with no warning — the cell
// flatteners only switched on child.type "p"/"table", never "img".

describe("classifyTable — images as direct cell children", () => {
  const img = { type: "img" as const, src: "https://example.com/image.png", alt: "Caption" };

  it("dark bg (alertBand) keeps the image as an images segment at its position", () => {
    const cell = makeCell({ bg: "#000000", children: [makePara("Lorem ipsum dolor"), img] });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("alertBand");
    const images = (result?.props as Record<string, unknown>)["images"] as Array<{ atLine: number; props: { src: string } }>;
    expect(images).toHaveLength(1);
    expect(images[0].props.src).toBe("https://example.com/image.png");
    expect(images[0].atLine).toBe(1);
  });

  it("dark bg with an image alone does not get swallowed into a buttonBand", () => {
    // findHref's promotion (single logical line, no buttons/bands) must not fire just
    // because the cell happens to have no OTHER content besides one image.
    const cell = makeCell({ bg: "#000000", children: [img] });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("alertBand");
  });

  it("border-left accent (calloutLeft) keeps the image as an images segment", () => {
    const cell = makeCell({
      border: { left: { color: "#047857" } },
      children: [makePara("Quoted text"), img],
    });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("calloutLeft");
    const images = (result?.props as Record<string, unknown>)["images"] as Array<{ atLine: number; props: { src: string } }>;
    expect(images).toHaveLength(1);
    expect(images[0].props.src).toBe("https://example.com/image.png");
  });

  it("light bg with no border (alertBand fallback) keeps the image too", () => {
    const cell = makeCell({ bg: "#f5f5f5", children: [makePara("Note"), img] });
    const result = classifyTable(makeTable([[cell]]));
    expect(result?.kind).toBe("alertBand");
    const images = (result?.props as Record<string, unknown>)["images"] as Array<{ atLine: number; props: { src: string } }>;
    expect(images).toHaveLength(1);
  });

  it("statsGrid cells have no rendered shape for images — warns instead of silently dropping", () => {
    const cellA = makeCell({ bg: "#f5f5f5", children: [makePara("Lorem"), img] });
    const cellB = makeCell({ bg: "#f5f5f5", children: [makePara("Ipsum")] });
    const warn = jest.fn();
    const result = classifyTable(makeTable([[cellA, cellB]]), undefined, warn);
    expect(result?.kind).toBe("statsGrid");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Зображення в клітинці"));
  });
});
