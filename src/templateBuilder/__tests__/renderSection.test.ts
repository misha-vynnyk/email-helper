import { renderSection } from "../render/renderSection";
import { createDefaultSectionBlock, createDefaultShellConfig, createDefaultTextBlock } from "../types";
import { nodeMap } from "../testSupport/nodeMap";

const shell = createDefaultShellConfig();

describe("renderSection", () => {
  it("renders padding and centers the inner table at the configured width when no styling is set", () => {
    const block = createDefaultSectionBlock("c1", null);
    const html = renderSection(block, {}, shell, shell.contentWidthPx);

    expect(html).toContain('padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;');
    expect(html).toContain('<table align="center" border="0" cellspacing="0" cellpadding="0" width="552" style="width: 100%; max-width:552px; padding: 0; margin: 0;" role="presentation">');
    expect(html).not.toContain("bgcolor=");
    expect(html).not.toContain("border-radius");
    expect(html).not.toContain("box-shadow");
  });

  it("adds fill/border/cornerRadius/shadow only when explicitly set", () => {
    const block = {
      ...createDefaultSectionBlock("c2", null),
      fill: "#fff9e9",
      border: { widthPx: 1, color: "#365373" },
      cornerRadius: 8,
      shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" },
    };

    const html = renderSection(block, {}, shell, shell.contentWidthPx);

    expect(html).toContain('bgcolor="#fff9e9"');
    expect(html).toContain("background-color: #fff9e9");
    expect(html).toContain("border: 1px solid #365373");
    expect(html).toContain("border-radius: 8px");
    expect(html).toContain("box-shadow: 0px 2px 4px rgba(0,0,0,0.1)");
  });

  it("overrides the shell's global border-collapse:collapse inline whenever a border or corner radius is set, since collapse silently kills border-radius", () => {
    const withBorderOnly = { ...createDefaultSectionBlock("c5", null), border: { widthPx: 1, color: "#000000" } };
    const withRadiusOnly = { ...createDefaultSectionBlock("c6", null), cornerRadius: 8 };
    const withNeither = createDefaultSectionBlock("c7", null);

    expect(renderSection(withBorderOnly, {}, shell, shell.contentWidthPx)).toContain("border-collapse: separate");
    expect(renderSection(withRadiusOnly, {}, shell, shell.contentWidthPx)).toContain("border-collapse: separate");
    expect(renderSection(withNeither, {}, shell, shell.contentWidthPx)).not.toContain("border-collapse");
  });

  it("renders its children by resolving childIds through the node map", () => {
    const text = { ...createDefaultTextBlock("t1", "c3"), contentHtml: "nested content" };
    const block = { ...createDefaultSectionBlock("c3", null), childIds: ["t1"] };

    const html = renderSection(block, nodeMap([text]), shell, shell.contentWidthPx);

    expect(html).toContain("nested content");
  });

  it("omits the width attribute and max-width cap when widthPx is undefined (a nested instance)", () => {
    const block = { ...createDefaultSectionBlock("c4", "parent"), widthPx: undefined };

    const html = renderSection(block, {}, shell, 300);

    expect(html).not.toContain("max-width:");
    expect(html).not.toMatch(/\swidth="\d+"/);
    expect(html).toContain("width: 100%;");
  });
});
