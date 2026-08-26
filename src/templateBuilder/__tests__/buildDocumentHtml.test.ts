import { buildDocumentHtml } from "../render/buildDocumentHtml";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultRowColumnBlock, createDefaultSectionBlock, createDefaultShellConfig, createDefaultTextBlock } from "../types";
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
});
