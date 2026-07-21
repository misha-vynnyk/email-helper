import { tokens } from "../config/tokens";
import { classify } from "../detect/classify";
import type { CellNode,Paragraph, StructuralNode, TableNode } from "../ir/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePara(
  text: string,
  size: Paragraph["size"] = "body",
  align: Paragraph["align"] = "left",
  extra: Partial<Pick<Paragraph, "listItem" | "ordered" | "listGroupId" | "tightNext" | "tightBefore" | "border" | "accentPadX" | "marginTopPt" | "marginBottomPt">> = {},
): Paragraph {
  return { type: "p", size, align, lines: [[{ text }]], ...extra };
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
    const lines = (result[0].props as Record<string, unknown>)["lines"] as unknown[][];
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

  // § between paragraphs whose size/align/variant differ can't merge into one block (they
  // can't share a single <span>'s formatting), but the "no gap" intent should still
  // collapse the padding between the two separate blocks to ~ a single-<br> gap.
  it("§ (tightNext) between mismatched-size paragraphs: stays 2 blocks, padding collapses", () => {
    const nodes: StructuralNode[] = [
      makePara("Headline", "headline", "left", { tightNext: true }),
      makePara("Body", "body", "left"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
  });

  it("§ (tightNext) between mismatched-align paragraphs: stays 2 blocks, padding collapses", () => {
    const nodes: StructuralNode[] = [
      makePara("Eyebrow", "body", "center", { tightNext: true }),
      makePara("Body", "body", "left"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
  });

  it("without § (no tightNext), mismatched paragraphs get neither tight flag", () => {
    const nodes: StructuralNode[] = [makePara("big", "headline"), makePara("small", "body")];
    const result = classify(nodes);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBeUndefined();
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBeUndefined();
  });

  // Mirror of tightNext: the author placed § at the START of the SECOND paragraph
  // instead of the end of the first one — same intent, other end of the boundary.
  it("leading § (tightBefore) merges same-style paragraphs with NO paraBreak (single <br>)", () => {
    const nodes: StructuralNode[] = [
      makePara("Line one", "body", "left"),
      makePara("Line two", "body", "left", { tightBefore: true }),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
  });

  it("leading § (tightBefore) between mismatched-size paragraphs: stays 2 blocks, padding collapses", () => {
    const nodes: StructuralNode[] = [
      makePara("Headline", "headline", "left"),
      makePara("Body", "body", "left", { tightBefore: true }),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
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
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
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
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  // Real <ul>/<li> lists are structurally certain — fromDom.ts sets listItem:true on every
  // <li>-derived paragraph. Each arrives as its own single-item "list" node (classifyFlow
  // processes one StructuralNode at a time); pushMerged combines consecutive ones from the
  // same <ul>/<ol> into a single "list" ComponentNode instead of a separate <ul> per item.
  it("merges adjacent listItem paragraphs into one 'list' node, whatever their text", () => {
    const nodes: StructuralNode[] = [
      makePara("Partners: Google, Meta", "body", "left", { listItem: true }),
      makePara("Backed by: Pat Gelsinger", "body", "left", { listItem: true }),
      makePara("4,000% valuation growth", "body", "left", { listItem: true }),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("list");
    const items = (result[0].props as Record<string, unknown>)["items"] as unknown[][];
    expect(items).toHaveLength(3);
  });

  it("keeps ordered (<ol>) and unordered (<ul>) lists separate even when adjacent", () => {
    const nodes: StructuralNode[] = [
      makePara("bullet one", "body", "left", { listItem: true, ordered: false }),
      makePara("number one", "body", "left", { listItem: true, ordered: true }),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("list");
    expect(result[1].kind).toBe("list");
  });

  // Regression, Ітерація 9b (fix-advanced.md): two adjacent but SEPARATE <ol>s (distinct
  // listGroupId) of the same ordered-ness used to fuse into one continuous numbering.
  it("two adjacent <ol>s with different listGroupId stay separate lists", () => {
    const nodes: StructuralNode[] = [
      makePara("First list item A", "body", "left", { listItem: true, ordered: true, listGroupId: 1 }),
      makePara("First list item B", "body", "left", { listItem: true, ordered: true, listGroupId: 1 }),
      makePara("Second list item A", "body", "left", { listItem: true, ordered: true, listGroupId: 2 }),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("list");
    expect(result[1].kind).toBe("list");
    expect((result[0].props as Record<string, unknown>)["items"]).toHaveLength(2);
    expect((result[1].props as Record<string, unknown>)["items"]).toHaveLength(1);
  });

  // A manually-typed checklist (no real <ul>, just <p>s with a leading "✓") is detected
  // by the marker PAIR signal: both adjacent paragraphs start with a list glyph. A
  // margin-top heuristic was tried instead and reverted — it collapsed whole sections'
  // <br><br>s to <br>.
  it("merges manually-typed checklist paragraphs (✓ pair) with NO paraBreak", () => {
    const nodes: StructuralNode[] = [
      makePara("✓  Partners: Google, Meta", "body", "left"),
      makePara("✓  Backed by: Pat Gelsinger", "body", "left"),
      makePara("✓  4,000% valuation growth", "body", "left"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
  });

  // The glyph may sit in its own run ("✓ " styled green, text after it black) — the marker
  // check must look at the first run only, not require the whole line to be one run.
  it("merges checklist items whose ✓ is an isolated styled run", () => {
    const nodes: StructuralNode[] = [
      { type: "p", size: "body", lines: [[{ text: "✓  ", color: "#166434" }, { text: "Partners: ", bold: true }, { text: "Google, Meta" }]] },
      { type: "p", size: "body", lines: [[{ text: "✓  ", color: "#166534", bold: true }, { text: "Backed by: ", bold: true }, { text: "Pat Gelsinger" }]] },
    ] as StructuralNode[];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
  });

  // A checklist glyph on only ONE side of the pair is not a list — prose keeps the gap.
  it("keeps paraBreak when only one paragraph of the pair starts with a marker", () => {
    const nodes: StructuralNode[] = [
      makePara("✓  Partners: Google, Meta", "body", "left"),
      makePara("And that's just the beginning.", "body", "left"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  it("does NOT treat a single dash/asterisk mid-sentence as a list marker", () => {
    // Plain prose starting with "-" must not be mistaken for a bullet — there is no
    // listItem flag, so it stays genuine prose.
    const nodes: StructuralNode[] = [
      { type: "p", size: "body", align: "left", lines: [[{ text: "- not a bullet, just a dash-led sentence." }]] },
      { type: "p", size: "body", align: "left", lines: [[{ text: "Second sentence continues normally." }]] },
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
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
    const rows = (result[0].props as Record<string, unknown>)["rows"] as unknown[];
    expect(rows).toHaveLength(4);
  });

  // Bug: two unrelated same-column-count tables separated by an author-typed blank line
  // (top-level <br> — see TableNode.gapBefore, set by ir/fromDom.ts) were silently fused
  // into one recordRow. gapBefore is the explicit "these are two separate tables" signal
  // that must block the merge below, even though nothing else here (ncols, borderColor,
  // widths) tells the two tables apart.
  it("does NOT merge recordRows separated by an explicit gapBefore", () => {
    const t1 = makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]);
    const t2: TableNode = {
      ...makeTable([[makeCell(), makeCell()], [makeCell(), makeCell()]]),
      gapBefore: true,
    };
    const result = classify([t1, t2]);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("recordRow");
    expect(result[1].kind).toBe("recordRow");
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
    expect((result[0].props as Record<string, unknown>)["bg"]).toBe(tokens.color.button);
  });

  // A standalone h5 (not inside a colored <td> — see classifyTable's hasButtonMarker
  // branch for that case) can carry its OWN background-color directly on the <h5> style.
  // The document's color must win over the house default button color.
  it("h5 with its own background-color uses that color, not the house default", () => {
    const para: Paragraph = { type: "p", size: "small", headingLevel: 5, bg: "#7b4fbf", lines: [[{ text: "Watch now" }]] };
    const result = classify([para]);
    expect(result[0].kind).toBe("buttonBand");
    expect((result[0].props as Record<string, unknown>)["bg"]).toBe("#7b4fbf");
  });

  it("h5 with no declared background-color still falls back to the house default", () => {
    const result = classify([makeHeading(5, "Click me")]);
    expect((result[0].props as Record<string, unknown>)["bg"]).toBe(tokens.color.button);
  });

  it("h5 button runs contain the text", () => {
    const result = classify([makeHeading(5, "Buy now")]);
    const runs = (result[0].props as Record<string, unknown>)["runs"] as Array<{ text: string }>;
    expect(runs.map(r => r.text).join("")).toContain("Buy now");
  });

  it("h5 button uses placeholder href when no href in runs", () => {
    const result = classify([makeHeading(5, "Click")]);
    expect((result[0].props as Record<string, unknown>)["href"]).toBe(tokens.placeholderHref);
  });

  it("h5 button always uses placeholder href regardless of run href", () => {
    const para: Paragraph = {
      type: "p", size: "small", headingLevel: 5,
      lines: [[{ text: "Go", href: "https://example.com" }]],
    };
    const result = classify([para]);
    expect((result[0].props as Record<string, unknown>)["href"]).toBe(tokens.placeholderHref);
  });

  it("h4 → paragraph with variant=quote", () => {
    const result = classify([makeHeading(4, "Quote text")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect((result[0].props as Record<string, unknown>)["variant"]).toBe("quote");
  });

  it("h1 → paragraph with size=headline (no buttonBand)", () => {
    const result = classify([makeHeading(1, "Headline")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect((result[0].props as Record<string, unknown>)["size"]).toBe("headline");
  });

  it("h6 → paragraph with size=small", () => {
    const result = classify([makeHeading(6, "Footer text")]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    expect((result[0].props as Record<string, unknown>)["size"]).toBe("small");
  });

  it("h4 paragraphs are NOT merged with adjacent body paragraphs", () => {
    const nodes: StructuralNode[] = [
      makePara("before"),
      makeHeading(4, "quote"),
      makePara("after"),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(3);
    expect((result[1].props as Record<string, unknown>)["variant"]).toBe("quote");
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

// ── § around images (F4) ──────────────────────────────────────────────────────

describe("classify — § around images", () => {
  const img: StructuralNode = { type: "img", src: "https://example.com/banner.png" };

  it("paragraph ending with § before an image zeroes the gap on both sides", () => {
    const result = classify([makePara("intro", "body", "left", { tightNext: true }), img]);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
  });

  it("paragraph starting with § after an image zeroes the image's bottom padding", () => {
    const result = classify([img, makePara("caption", "body", "left", { tightBefore: true })]);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
  });

  it("image without § keeps full padding on both sides", () => {
    const result = classify([makePara("intro"), img, makePara("outro")]);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBeUndefined();
    expect((result[1].props as Record<string, unknown>)["tightAfter"]).toBeUndefined();
  });
});

// ── Multi-line h5 flow button label (F2) ──────────────────────────────────────

describe("classify — h5 flow button label", () => {
  it("joins multi-line labels with a space instead of gluing words", () => {
    const h5: Paragraph = {
      type: "p", size: "small", headingLevel: 5,
      lines: [[{ text: "Click" }], [{ text: "Here" }]],
    };
    const result = classify([h5]);
    expect(result[0].kind).toBe("buttonBand");
    const runs = (result[0].props as Record<string, unknown>)["runs"] as Array<{ text: string }>;
    expect(runs.map(r => r.text).join("")).toBe("Click Here");
  });
});

// ── <p> with its own border-left (quote/callout convention, not a wrapping <td>) ──

describe("classify — paragraph's own border-left → calloutLeft", () => {
  const accent = { left: { color: "#b71c1c", widthPx: 4 } };

  it("a single bordered <p> becomes a calloutLeft using the document's own color/width", () => {
    const result = classify([makePara("Skipping SPCX", "body", "left", { border: accent })]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("calloutLeft");
    const props = result[0].props as Record<string, unknown>;
    expect(props["accentColor"]).toBe("#b71c1c");
    expect(props["accentWidthPx"]).toBe(4);
  });

  it("merges consecutive same-accent bordered paragraphs into ONE calloutLeft, not three", () => {
    const result = classify([
      makePara("Skipping SPCX at $135.", "body", "left", { border: accent, marginTopPt: 0, marginBottomPt: 0 }),
      makePara("Loading one ticker ahead.", "body", "left", { border: accent, marginTopPt: 0, marginBottomPt: 0 }),
      makePara("Releasing the name free.", "body", "left", { border: accent, marginTopPt: 0, marginBottomPt: 0 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("calloutLeft");
    const lines = (result[0].props as Record<string, unknown>)["lines"] as unknown[][];
    expect(lines).toHaveLength(3);
  });

  it("a different accent color starts a NEW calloutLeft instead of merging", () => {
    const otherAccent = { left: { color: "#1a56db", widthPx: 4 } };
    const result = classify([
      makePara("Red quote", "body", "left", { border: accent }),
      makePara("Blue quote", "body", "left", { border: otherAccent }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("calloutLeft");
    expect(result[1].kind).toBe("calloutLeft");
  });

  it("a plain paragraph in between keeps the two calloutLeft boxes separate", () => {
    const result = classify([
      makePara("First quote", "body", "left", { border: accent }),
      makePara("Unrelated prose"),
      makePara("Second quote", "body", "left", { border: accent }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("calloutLeft");
    expect(result[1].kind).toBe("paragraph");
    expect(result[2].kind).toBe("calloutLeft");
  });

  it("threads accentPadX (document's own gap) through to the ComponentNode", () => {
    const result = classify([makePara("Quote", "body", "left", { border: accent, accentPadX: 16 })]);
    expect((result[0].props as Record<string, unknown>)["accentPadX"]).toBe(16);
  });

  it("a different accentPadX starts a NEW calloutLeft instead of merging", () => {
    const result = classify([
      makePara("Narrow indent", "body", "left", { border: accent, accentPadX: 10 }),
      makePara("Wide indent", "body", "left", { border: accent, accentPadX: 16 }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("calloutLeft");
    expect(result[1].kind).toBe("calloutLeft");
  });

  // Regression, Ітерація 8 (fix-advanced.md): CalloutLeftProps has no size/align field, so a
  // heading with border-left used to silently lose its size/alignment (rendered as plain 14px
  // left-aligned body text) by routing into calloutLeft like any other bordered paragraph.
  it("a headline (size !== body) with border-left stays a headline paragraph, not calloutLeft", () => {
    const result = classify([makePara("Big centered heading", "headline", "center", { border: accent })]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("paragraph");
    const props = result[0].props as Record<string, unknown>;
    expect(props["size"]).toBe("headline");
    expect(props["align"]).toBe("center");
  });

  it("small-size (h6) text with border-left also stays a plain paragraph, not calloutLeft", () => {
    const result = classify([makePara("Fine print", "small", "left", { border: accent })]);
    expect(result[0].kind).toBe("paragraph");
    expect((result[0].props as Record<string, unknown>)["size"]).toBe("small");
  });
});

// ── calloutLeft merge (table-cell path) preserves nested buttons/bands ───────
// Regression for Ітерація 6 (fix-advanced.md): merging two adjacent same-accent
// calloutLeft table cells rebuilt props as {...last.props, ...} — comp's own
// buttons/bands (only reachable via the table-cell path, flattenCellForAlertBand)
// were silently dropped, or the whole second cell was discarded outright when it
// carried nothing but a button.

describe("classify — calloutLeft merge (table cells) carries nested buttons/bands", () => {
  const leftAccent = { left: { color: "#38a169", widthPx: 4 } };

  function buttonTable(label: string, bg = "#0b7285"): TableNode {
    return makeTable([[makeCell([{ type: "p", size: "small", headingLevel: 5, lines: [[{ text: label }]] }], bg)]]);
  }

  it("second cell is ONLY a button (no own text) — merges in instead of vanishing", () => {
    const nodes: StructuralNode[] = [
      makeTable([[{ type: "cell", children: [makePara("Intro text")], border: leftAccent }]]),
      makeTable([[{ type: "cell", children: [buttonTable("Watch the video")], border: leftAccent }]]),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("calloutLeft");
    const props = result[0].props as Record<string, unknown>;
    const lines = props["lines"] as unknown[][];
    const buttons = props["buttons"] as { atLine: number; props: Record<string, unknown> }[];
    expect(lines).toHaveLength(1); // only the first cell's line — second contributed none
    expect(buttons).toHaveLength(1);
    expect(buttons[0].atLine).toBe(1); // offset past the first cell's one line
    expect(buttons[0].props["bg"]).toBe("#0b7285");
  });

  it("second cell has text AND a button — both merge in, button not lost", () => {
    const nodes: StructuralNode[] = [
      makeTable([[{ type: "cell", children: [makePara("First quote")], border: leftAccent }]]),
      makeTable([[{ type: "cell", children: [makePara("More info"), buttonTable("Learn more")], border: leftAccent }]]),
    ];
    const result = classify(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("calloutLeft");
    const props = result[0].props as Record<string, unknown>;
    const lines = props["lines"] as unknown[][];
    const buttons = props["buttons"] as { atLine: number; props: Record<string, unknown> }[];
    expect(lines).toHaveLength(2); // "First quote" + "More info"
    expect(buttons).toHaveLength(1);
    expect(buttons[0].atLine).toBe(2); // after both merged lines
  });
});

// ── Pairwise margin-sum boundary rule + gapBefore ────────────────────────────

describe("classify — margin-sum boundary rule", () => {
  function marginPara(
    text: string,
    extra: Partial<Pick<Paragraph, "marginTopPt" | "marginBottomPt" | "gapBefore" | "tightNext">> = {},
  ): Paragraph {
    return { type: "p", size: "body", align: "left", lines: [[{ text }]], ...extra };
  }

  // Derived from the token, not hardcoded pt values — a fixture that happens to sit under/over
  // a hardcoded number silently breaks (or silently stops testing anything meaningful) the next
  // time gapMarginThresholdPt is retuned. `under` sums (with itself) to half the threshold;
  // `over` sums to 1.5x the threshold while EACH SIDE ALONE still stays under it — that "neither
  // side alone reaches the threshold, only their sum does" case is exactly what this rule tests.
  const T = tokens.layout.gapMarginThresholdPt;
  const under = T / 4;
  const over = T * 0.75;

  it("merges a small-margin boundary (well under gapMarginThresholdPt on both sides) with a single <br>", () => {
    const result = classify([
      marginPara("one", { marginTopPt: under, marginBottomPt: under }),
      marginPara("two", { marginTopPt: under, marginBottomPt: under }),
    ]);
    expect(result).toHaveLength(1);
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
  });

  it("keeps the <br><br> gap when the boundary SUM reaches gapMarginThresholdPt, even though neither side alone does", () => {
    const result = classify([
      marginPara("disclaimer one", { marginTopPt: over, marginBottomPt: over }),
      marginPara("disclaimer two", { marginTopPt: over, marginBottomPt: over }),
    ]);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  it("undeclared margins on either side → conservative <br><br> gap", () => {
    const result = classify([
      marginPara("one", { marginBottomPt: 0 }),
      marginPara("two"),
    ]);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  it("gapBefore (author-typed blank line) forces the gap even across a zero-margin boundary", () => {
    const result = classify([
      marginPara("one", { marginTopPt: 0, marginBottomPt: 0 }),
      marginPara("two", { marginTopPt: 0, marginBottomPt: 0, gapBefore: true }),
    ]);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  it("gapBefore also vetoes the centered-merge convention", () => {
    const result = classify([
      makePara("HEADLINE", "body", "center"),
      { ...makePara("subline", "body", "center"), gapBefore: true } as Paragraph,
    ]);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(1)).toBe(true);
  });

  it("§ outranks gapBefore on the same boundary", () => {
    const result = classify([
      marginPara("one", { tightNext: true }),
      marginPara("two", { gapBefore: true }),
    ]);
    expect(result).toHaveLength(1);
    expect((result[0].props as Record<string, unknown>)["paraBreaks"]).toBeUndefined();
  });

  it("cross-style small-margin boundary zeroes the paddings (tightAfter/tightBefore)", () => {
    const headline: Paragraph = { type: "p", size: "headline", align: "left", lines: [[{ text: "Head" }]], marginTopPt: under, marginBottomPt: under };
    const body: Paragraph = { type: "p", size: "body", align: "left", lines: [[{ text: "Body" }]], marginTopPt: under, marginBottomPt: under };
    const result = classify([headline, body]);
    expect(result).toHaveLength(2);
    expect((result[0].props as Record<string, unknown>)["tightAfter"]).toBe(true);
    expect((result[1].props as Record<string, unknown>)["tightBefore"]).toBe(true);
  });

  it("the merged tail's margin-bottom governs the NEXT merge", () => {
    const result = classify([
      marginPara("one", { marginTopPt: 0, marginBottomPt: 0 }),
      marginPara("two", { marginTopPt: 0, marginBottomPt: 14 }),
      marginPara("three", { marginTopPt: 0, marginBottomPt: 0 }),
    ]);
    // one+two merge (0+0), but two's 14pt bottom vs three's 0 top → 14 ≥ threshold → gap
    expect(result).toHaveLength(1);
    const breaks = (result[0].props as Record<string, unknown>)["paraBreaks"] as Set<number>;
    expect(breaks.has(2)).toBe(true);
    expect(breaks.has(1)).toBe(false);
  });
});
