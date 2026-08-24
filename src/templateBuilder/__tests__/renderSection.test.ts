import { renderSection } from "../render/renderSection";
import { createDefaultSectionBlock } from "../types";

describe("renderSection", () => {
  it("renders padding and centers the inner table at the configured width when no styling is set", () => {
    const block = createDefaultSectionBlock("c1");
    const html = renderSection(block, "<!-- children -->");

    expect(html).toContain('padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;');
    expect(html).toContain('<table align="center" border="0" cellspacing="0" cellpadding="0" width="552" style="width: 100%; max-width:552px; padding: 0; margin: 0;" role="presentation">');
    expect(html).toContain("<!-- children -->");
    expect(html).not.toContain("bgcolor=");
    expect(html).not.toContain("border-radius");
    expect(html).not.toContain("box-shadow");
  });

  it("adds fill/border/cornerRadius/shadow only when explicitly set", () => {
    const block = createDefaultSectionBlock("c2");
    block.fill = "#fff9e9";
    block.border = { widthPx: 1, color: "#365373" };
    block.cornerRadius = 8;
    block.shadow = { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" };

    const html = renderSection(block, "");

    expect(html).toContain('bgcolor="#fff9e9"');
    expect(html).toContain("background-color: #fff9e9");
    expect(html).toContain("border: 1px solid #365373");
    expect(html).toContain("border-radius: 8px");
    expect(html).toContain("box-shadow: 0px 2px 4px rgba(0,0,0,0.1)");
  });
});
