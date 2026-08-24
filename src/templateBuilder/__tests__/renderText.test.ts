import { renderText } from "../render/renderText";
import { createDefaultTextBlock } from "../types";

describe("renderText", () => {
  it("renders without a link wrapper when href is not set", () => {
    const block = createDefaultTextBlock("t1");
    block.contentHtml = "Hello <b>world</b>";
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 14);

    expect(html).not.toContain("<a ");
    expect(html).toContain("Hello <b>world</b>");
    expect(html).toContain("padding-bottom: 14px;");
    expect(html).toContain("font-family:'Roboto', Arial, Helvetica, sans-serif");
  });

  it("wraps content in a link when href is set, using the fixed link style", () => {
    const block = createDefaultTextBlock("t2");
    block.href = "https://example.com";
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 0);

    expect(html).toContain('<a href="https://example.com" style="font-family:');
    expect(html).toContain("text-decoration: underline;font-weight: 700; color: #0000EE;");
    expect(html).toContain("padding-bottom: 0px;");
  });

  it("uses the block's own fontFamily override instead of the shell default when set", () => {
    const block = createDefaultTextBlock("t3");
    block.fontFamily = "'Poppins', Arial, sans-serif";
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 14);

    expect(html).toContain("font-family:'Poppins', Arial, sans-serif;font-size");
  });

  it("cannot break out of the style attribute via fontFamily", () => {
    const block = createDefaultTextBlock("t4");
    block.fontFamily = 'Arial" onmouseover="alert(1)';
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 0);

    // A real breakout would produce `..."  onmouseover="alert(1);...` — a second, live
    // attribute sitting outside the style="" value. The escaped/stripped form never does.
    expect(html).not.toContain('" onmouseover="');
    expect(html).not.toMatch(/<td[^>]*\sonmouseover=/);
  });

  it("drops a javascript: href instead of rendering it", () => {
    const block = createDefaultTextBlock("t5");
    block.href = "javascript:alert(document.cookie)";
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 0);

    expect(html).not.toContain("<a ");
    expect(html).not.toContain("javascript:");
  });

  it("keeps a placeholder href like the default 'urlhere' text", () => {
    const block = createDefaultTextBlock("t6");
    block.href = "urlhere";
    const html = renderText(block, "'Roboto', Arial, Helvetica, sans-serif", 0);

    expect(html).toContain('<a href="urlhere"');
  });
});
