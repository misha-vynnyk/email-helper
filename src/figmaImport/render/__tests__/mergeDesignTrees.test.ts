import type { DesignNode, FrameNode, ImageNode, TextNode } from "../../types";
import { mergeDesignTrees } from "../mergeDesignTrees";

function textNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: "t1",
    type: "text",
    defaultStyle: { fontFamily: "Inter", fontSizePx: 16, fontWeight: 400, color: "#000000" },
    runs: [{ text: "Hello" }],
    padding: { top: 0, bottom: 0 },
    ...overrides,
  };
}

function frameNode(overrides: Partial<FrameNode> = {}): FrameNode {
  return {
    id: "f1",
    type: "frame",
    direction: "column",
    children: [],
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

function imageNode(overrides: Partial<ImageNode> = {}): ImageNode {
  return {
    id: "i1",
    type: "image",
    altDescription: "photo",
    widthPx: 300,
    padding: { top: 0, bottom: 0 },
    ...overrides,
  };
}

describe("mergeDesignTrees — identical trees", () => {
  it("renders once, mints no classes, reports no diagnostics", () => {
    const nodes: DesignNode[] = [textNode()];
    const result = mergeDesignTrees(nodes, nodes.map((n) => ({ ...n })));
    expect(result.diagnostics).toEqual([]);
    expect(result.cssRules.size).toBe(0);
    // exactly one rendering of the text, not doubled
    expect(result.contentHtml.match(/Hello/g)).toHaveLength(1);
  });
});

describe("mergeDesignTrees — leaf-value diffs on same-shape nodes", () => {
  it("text: resolves a fontSizePx diff to a matched utility class, keeps desktop's inline value", () => {
    const desktop = [textNode({ defaultStyle: { fontFamily: "Inter", fontSizePx: 24, fontWeight: 400 } })];
    const mobile = [textNode({ defaultStyle: { fontFamily: "Inter", fontSizePx: 16, fontWeight: 400 } })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain("font-size: 24px"); // desktop's literal value, unchanged
    expect(result.contentHtml).toContain('class="text-base"'); // mobile's 16px resolved to the existing scale class
    expect(result.cssRules.get("text-base")).toBe(".text-base { font-size: 16px !important; }");
    expect(result.diagnostics).toEqual([]);
  });

  it("text: mints a class when the mobile value has no existing scale tick", () => {
    const desktop = [textNode({ padding: { top: 10, bottom: 0 } })];
    const mobile = [textNode({ padding: { top: 6, bottom: 0 } })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.cssRules.get("pt-6")).toBe(".pt-6 { padding-top: 6px !important; }");
  });

  it("text: unsupported property diffs (color) are logged, not applied", () => {
    const desktop = [textNode({ defaultStyle: { fontFamily: "Inter", fontSizePx: 16, color: "#000000" } })];
    const mobile = [textNode({ defaultStyle: { fontFamily: "Inter", fontSizePx: 16, color: "#ff0000" } })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain("color: #000000");
    expect(result.contentHtml).not.toContain("#ff0000");
    expect(result.diagnostics.some((d) => d.includes("defaultStyle.color differs"))).toBe(true);
  });

  it("frame: padding diff resolves to a matched class on the frame's own <td>", () => {
    const desktop = [frameNode({ padding: { top: 24, right: 0, bottom: 0, left: 0 } })];
    const mobile = [frameNode({ padding: { top: 16, right: 0, bottom: 0, left: 0 } })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain("padding-top: 24px"); // desktop inline value
    expect(result.contentHtml).toContain('class="pt-16"');
  });

  it("frame: cornerRadius removed on mobile resolves to no-radius", () => {
    const desktop = [frameNode({ cornerRadius: 10 })];
    const mobile = [frameNode({ cornerRadius: undefined })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain("no-radius");
    expect(result.cssRules.get("no-radius")).toBe(".no-radius { border-radius: 0 !important; }");
  });

  it("frame: unsupported gap/fill/border/width diffs are logged", () => {
    const desktop = [frameNode({ gap: 24, width: 200 })];
    const mobile = [frameNode({ gap: 12, width: 100 })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.diagnostics.some((d) => d.includes("gap differs"))).toBe(true);
    expect(result.diagnostics.some((d) => d.includes("width differs"))).toBe(true);
  });

  it("image: padding/align diffs resolve; widthPx diffs are logged as unsupported", () => {
    const desktop = [imageNode({ widthPx: 500, align: "left", padding: { top: 8, bottom: 0 } })];
    const mobile = [imageNode({ widthPx: 300, align: "center", padding: { top: 0, bottom: 0 } })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="text-center pt-0"');
    expect(result.diagnostics.some((d) => d.includes("widthPx differs"))).toBe(true);
  });

  it("frame: recurses into children with identical id sequences", () => {
    const desktop = [frameNode({ children: [textNode({ id: "child", defaultStyle: { fontSizePx: 20 } })] })];
    const mobile = [frameNode({ children: [textNode({ id: "child", defaultStyle: { fontSizePx: 14 } })] })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="text-sm"'); // diffs always resolve at the base (602px) tier
  });
});

describe("mergeDesignTrees — structural divergence", () => {
  it("row↔column with the same children merges into ONE adaptive row, not a toggled duplicate", () => {
    const desktop = [frameNode({ direction: "row", children: [textNode({ id: "a" }), textNode({ id: "b" })] })];
    const mobile = [frameNode({ direction: "column", children: [textNode({ id: "a" }), textNode({ id: "b" })] })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).not.toContain('class="hidden"');
    expect(result.contentHtml).not.toContain('class="block"');
    // "base" tier (`w-full`), not renderRow.ts's own literal "sm-w-full" default — see
    // mergeRowToStack's doc comment: this module's assembler collapses every registered class
    // into one @media(max-width:602px) block regardless of name prefix, so "base" is the honest
    // choice, matching every other resolve in this module.
    expect(result.contentHtml).toContain('class="w-full"');
    expect(result.contentHtml).not.toContain("sm-w-full");
    expect(result.contentHtml).toContain("display: inline-block;");
    expect(result.contentHtml.match(/Hello/g)).toHaveLength(2); // rendered once per child, not doubled
    expect(result.diagnostics.some((d) => d.includes("merged into one adaptive row"))).toBe(true);
    expect(result.cssRules.get("w-full")).toBe(".w-full { width: 100%; max-width: 100%; min-width: 100% !important; }");
  });

  it("row↔column columns split proportionally from desktop's own numeric widths", () => {
    const desktop = [
      frameNode({
        direction: "row",
        children: [frameNode({ id: "a", width: 40, children: [textNode({ id: "a-text" })] }), frameNode({ id: "b", width: 160, children: [textNode({ id: "b-text" })] })],
      }),
    ];
    const mobile = [
      frameNode({
        direction: "column",
        children: [frameNode({ id: "a", children: [textNode({ id: "a-text" })] }), frameNode({ id: "b", children: [textNode({ id: "b-text" })] })],
      }),
    ];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('width="20%"'); // 40 / (40+160)
    expect(result.contentHtml).toContain('width="80%"'); // 160 / (40+160)
  });

  it("row↔column neutralizes each card's own desktop pixel width so it can actually fill the stacked column", () => {
    const desktop = [frameNode({ direction: "row", children: [frameNode({ id: "a", width: 184, children: [textNode({ id: "a-text" })] })] })];
    const mobile = [frameNode({ direction: "column", children: [frameNode({ id: "a", children: [textNode({ id: "a-text" })] })] })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).not.toContain("max-width: 184px");
    expect(result.diagnostics.some((d) => d.includes('id="a": width differs'))).toBe(false);
  });

  it("still toggles both variants when a row↔column frame's children differ, not just its direction", () => {
    const desktop = [frameNode({ direction: "row", children: [textNode({ id: "a" })] })];
    const mobile = [frameNode({ direction: "column", children: [textNode({ id: "a" }), textNode({ id: "extra" })] })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="hidden"');
    expect(result.contentHtml).toContain('class="block"');
  });

  it("renders both variants when a frame's children differ in id/order", () => {
    // distinct text per child so swapped order is actually visible in the rendered output —
    // reordering two visually-identical children would render byte-identical either way and
    // correctly take the "nothing changed" fast path instead (not a bug, see the identical-trees
    // describe block above).
    const desktop = [frameNode({ children: [textNode({ id: "a", runs: [{ text: "A" }] }), textNode({ id: "b", runs: [{ text: "B" }] })] })];
    const mobile = [frameNode({ children: [textNode({ id: "b", runs: [{ text: "B" }] }), textNode({ id: "a", runs: [{ text: "A" }] })] })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="hidden"');
    expect(result.contentHtml).toContain('class="block"');
  });

  it("falls back to the toggle for any diff on a non-leaf-diffable type (e.g. divider)", () => {
    const desktop: DesignNode[] = [{ id: "d1", type: "divider", color: "#000000" }];
    const mobile: DesignNode[] = [{ id: "d1", type: "divider", color: "#ffffff" }];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain("#000000");
    expect(result.contentHtml).toContain("#ffffff");
    expect(result.contentHtml).toContain('class="hidden"');
    expect(result.contentHtml).toContain('class="block"');
  });
});

describe("mergeDesignTrees — visibility-only nodes (present in one file only)", () => {
  it("desktop-only top-level node renders once, hidden below 602px", () => {
    const desktop = [frameNode({ id: "only-desktop", visibility: "desktopOnly" })];
    const mobile: DesignNode[] = [];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="hidden"');
    expect(result.contentHtml).not.toContain('class="block"');
  });

  it("mobile-only top-level node renders once, shown only below 602px", () => {
    const desktop: DesignNode[] = [];
    const mobile = [frameNode({ id: "only-mobile", visibility: "mobileOnly" })];
    const result = mergeDesignTrees(desktop, mobile);
    expect(result.contentHtml).toContain('class="block"');
    expect(result.contentHtml).toContain("display: none");
  });

  it("preserves desktop's top-level order and appends mobile-only ids after", () => {
    const desktop = [textNode({ id: "first", name: "First" }), textNode({ id: "second", name: "Second" })];
    const mobile = [
      textNode({ id: "second", name: "Second" }),
      { ...textNode({ id: "mobile-extra", name: "MobileExtra" }), visibility: "mobileOnly" as const },
    ];
    const result = mergeDesignTrees(desktop, mobile);
    const firstIdx = result.contentHtml.indexOf("<!-- First -->");
    const secondIdx = result.contentHtml.indexOf("<!-- Second -->");
    const extraIdx = result.contentHtml.indexOf("<!-- MobileExtra -->");
    expect(firstIdx).toBeGreaterThanOrEqual(0);
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(extraIdx);
  });
});
