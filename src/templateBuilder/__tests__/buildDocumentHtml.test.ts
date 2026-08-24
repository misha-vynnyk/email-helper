import { buildDocumentHtml } from "../render/buildDocumentHtml";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultSectionBlock, createDefaultShellConfig, createDefaultTextBlock } from "../types";

describe("buildDocumentHtml", () => {
  it("applies gapPx as padding-bottom on every section child except the last", () => {
    const shell = createDefaultShellConfig();
    const section = createDefaultSectionBlock("c1");
    section.gapPx = 20;
    const text = createDefaultTextBlock("t1");
    const image = createDefaultImageBlock("i1");
    section.children = [text, image];

    const html = buildDocumentHtml(shell, [section]);

    expect(html.indexOf(text.contentHtml)).toBeLessThan(html.indexOf(image.src));
    expect(html).toContain("padding-bottom: 20px;");
    expect(html).toContain("padding-bottom: 0px;");
  });

  it("renders multiple canvas blocks (sections and rows) in order", () => {
    const shell = createDefaultShellConfig();
    const section = createDefaultSectionBlock("c1");
    const text = createDefaultTextBlock("t1");
    text.contentHtml = "Section text";
    section.children = [text];

    const row = createDefaultRowBlock("r1", ["col-a", "col-b"], 2);
    const image = createDefaultImageBlock("i1");
    row.columns[0].children = [image];

    const html = buildDocumentHtml(shell, [section, row]);

    expect(html.indexOf("Section text")).toBeLessThan(html.indexOf(image.src));
    expect(html).toContain("<!--[------ Section start ------]-->");
    expect(html).toContain("<!--[------ Row start ------]-->");
  });

  it("produces a single self-contained HTML document", () => {
    const shell = createDefaultShellConfig();
    const section = createDefaultSectionBlock("c1");
    section.children = [createDefaultTextBlock("t1")];

    const html = buildDocumentHtml(shell, [section]);

    expect(html.trim().startsWith("<!DOCTYPE html")).toBe(true);
    expect(html.trim().endsWith("</html>")).toBe(true);
  });
});
