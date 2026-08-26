import { buildDocumentHtml } from "../render/buildDocumentHtml";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultRowColumnBlock, createDefaultSectionBlock, createDefaultShellConfig, createDefaultTextBlock, type ReadyMadeBlock } from "../types";
import { nodeMap } from "../testSupport/nodeMap";

describe("buildDocumentHtml", () => {
  it("applies gapPx as padding-bottom on every section child except the last", () => {
    const shell = createDefaultShellConfig();
    const text = { ...createDefaultTextBlock("t1", "c1"), contentHtml: "gap text" };
    const image = createDefaultImageBlock("i1", "c1");
    const section = { ...createDefaultSectionBlock("c1", null), gapPx: 20, childIds: ["t1", "i1"] };

    const html = buildDocumentHtml(shell, nodeMap([section, text, image]), ["c1"]);

    expect(html.indexOf("gap text")).toBeLessThan(html.indexOf(image.src));
    expect(html).toContain("padding-bottom: 20px;");
    expect(html).toContain("padding-bottom: 0px;");
  });

  it("renders multiple canvas blocks (sections and rows) in order", () => {
    const shell = createDefaultShellConfig();
    const text = { ...createDefaultTextBlock("t1", "c1"), contentHtml: "Section text" };
    const section = { ...createDefaultSectionBlock("c1", null), childIds: ["t1"] };
    const column = createDefaultRowColumnBlock("col-a", "r1", 100);
    const image = createDefaultImageBlock("i1", "col-a");
    const row = { ...createDefaultRowBlock("r1", null), childIds: ["col-a"] };
    const columnWithImage = { ...column, childIds: ["i1"] };

    const html = buildDocumentHtml(shell, nodeMap([section, text, row, columnWithImage, image]), ["c1", "r1"]);

    expect(html.indexOf("Section text")).toBeLessThan(html.indexOf(image.src));
    expect(html).toContain("<!--[------ Section start ------]-->");
    expect(html).toContain("<!--[------ Row start ------]-->");
  });

  it("produces a single self-contained HTML document", () => {
    const shell = createDefaultShellConfig();
    const text = createDefaultTextBlock("t1", "c1");
    const section = { ...createDefaultSectionBlock("c1", null), childIds: ["t1"] };

    const html = buildDocumentHtml(shell, nodeMap([section, text]), ["c1"]);

    expect(html.trim().startsWith("<!DOCTYPE html")).toBe(true);
    expect(html.trim().endsWith("</html>")).toBe(true);
  });

  it("renders a deeply nested tree (Section -> Row -> Section -> Text) and threads the real available width down", () => {
    const shell = createDefaultShellConfig();

    const text = { ...createDefaultTextBlock("t1", "inner"), contentHtml: "deeply nested text" };
    const inner = { ...createDefaultSectionBlock("inner", "col-a"), childIds: ["t1"] }; // nested: widthPx undefined
    const column = { ...createDefaultRowColumnBlock("col-a", "row", 50), childIds: ["inner"] };
    const otherColumn = createDefaultRowColumnBlock("col-b", "row", 50);
    const row = { ...createDefaultRowBlock("row", "outer"), childIds: ["col-a", "col-b"] }; // nested: widthPx undefined
    const outer = { ...createDefaultSectionBlock("outer", null), childIds: ["row"] }; // top-level: widthPx 552

    const html = buildDocumentHtml(shell, nodeMap([outer, row, column, otherColumn, inner, text]), ["outer"]);

    expect(html).toContain("deeply nested text");
    // outer section keeps its 552px cap; the nested row/section underneath render with no cap of their own
    expect(html.match(/max-width:\d+px;/g)?.length).toBe(1);
    // column min-width = (552 - outer's own 40px padding) * 50% = 256px -> the row's real inherited
    // width, not the unrelated 600px shell content width it would have used before this was fixed
    expect(html).toContain("min-width: 256px");
    expect(html).toContain("<!--[------ Section start ------]-->");
    expect(html).toContain("<!--[------ Row start ------]-->");
  });

  it("ships both a used ready-made block's general utility-class dependency and its own block-specific CSS, tree-shaken together", () => {
    const shell = createDefaultShellConfig();
    const header: ReadyMadeBlock = { id: "h1", parentId: "c1", type: "ready-made", definitionId: "header-adaptive", values: {} };
    const section = { ...createDefaultSectionBlock("c1", null), childIds: ["h1"] };

    const html = buildDocumentHtml(shell, nodeMap([section, header]), ["c1"]);

    // header-adaptive's usesUtilityClasses: ["sm-hidden"] -> general catalog rule ships
    const mediaStartIndex = html.indexOf("@media screen and (max-width: 464px)");
    expect(mediaStartIndex).toBeGreaterThan(-1);

    // header-adaptive's own extraShellCss (.sm-tab-cell) must not appear anywhere BEFORE the
    // 464px @media block opens — that's the exact bug this test guards against: it used to ship
    // as a bare, unscoped rule that applied at every screen width, not just below 464px.
    expect(html.slice(0, mediaStartIndex)).not.toContain(".sm-tab-cell {");

    const styleEndIndex = html.indexOf("</style>");
    const styleContent = html.slice(0, styleEndIndex);
    expect(styleContent).toContain(".sm-hidden { display: none !important; }");
    expect(styleContent).toContain(".sm-tab-cell { display: block !important; }");
    // and it appears AFTER the 464px @media opens, i.e. genuinely inside that block
    expect(styleContent.indexOf(".sm-tab-cell {")).toBeGreaterThan(mediaStartIndex);

    // and the block itself rendered its two-cell/MSO-conditional markup
    expect(html).toContain("<!--[if !mso 9]><!-->");

    // a template with no ready-made block at all ships neither
    const withoutHeader = buildDocumentHtml(shell, nodeMap([createDefaultSectionBlock("c2", null)]), ["c2"]);
    expect(withoutHeader).not.toContain("sm-tab-cell");
    expect(withoutHeader).not.toContain("@media screen and (max-width: 464px)");
  });

  it("renders a leaf sitting directly at the canvas root (no wrapping Section) alongside a Section, in order", () => {
    const shell = createDefaultShellConfig();
    const rootText = { ...createDefaultTextBlock("t1", null), contentHtml: "root-level text" };
    const sectionText = { ...createDefaultTextBlock("t2", "c1"), contentHtml: "text inside a section" };
    const section = { ...createDefaultSectionBlock("c1", null), childIds: ["t2"] };

    const html = buildDocumentHtml(shell, nodeMap([rootText, section, sectionText]), ["t1", "c1"]);

    expect(html).toContain("root-level text");
    expect(html).toContain("text inside a section");
    expect(html.indexOf("root-level text")).toBeLessThan(html.indexOf("text inside a section"));
    // the root-level leaf is a bare <tr> fragment, not wrapped in its own Section markers
    expect(html.indexOf("<!--[------ Section start ------]-->")).toBeGreaterThan(html.indexOf("root-level text"));
  });
});
