import { renderButton } from "../render/renderButton";
import { createDefaultButtonBlock } from "../types";

describe("renderButton", () => {
  it("renders a filled button by default", () => {
    const block = createDefaultButtonBlock("b1");
    const html = renderButton(block, 14);

    expect(html).toContain(`bgcolor="${block.bgColor}"`);
    expect(html).toContain(`background-color:${block.bgColor};`);
    expect(html).not.toContain("border:");
    expect(html).toContain("padding-bottom: 14px;");
  });

  it("renders a ghost button with no background at all when bgColor is unset", () => {
    const block = createDefaultButtonBlock("b2");
    block.bgColor = undefined;
    const html = renderButton(block, 0);

    expect(html).not.toContain("bgcolor=");
    expect(html).not.toContain("background-color:");
    expect(html).not.toContain("transparent");
  });

  it("renders an outline-only button using the border as its entire visual identity", () => {
    const block = createDefaultButtonBlock("b3");
    block.bgColor = undefined;
    block.border = { widthPx: 2, color: "#111111" };
    const html = renderButton(block, 0);

    expect(html).toContain("border:2px solid #111111;");
    expect(html).not.toContain("background-color:");
  });

  it("falls back to the placeholder href when given an unsafe href", () => {
    const block = createDefaultButtonBlock("b4");
    block.href = "javascript:alert(1)";
    const html = renderButton(block, 0);

    expect(html).toContain('href="urlhere"');
    expect(html).not.toContain("javascript:");
  });

  it("keeps a safe href as-is", () => {
    const block = createDefaultButtonBlock("b5");
    block.href = "https://example.com";
    const html = renderButton(block, 0);

    expect(html).toContain('href="https://example.com"');
  });

  it("renders full width as a width=100% table when fullWidth is set", () => {
    const block = createDefaultButtonBlock("b6");
    block.fullWidth = true;
    const html = renderButton(block, 0);

    expect(html).toContain('width="100%"');
    expect(html).toContain("width:100%;max-width:100%;");
  });

  it("escapes the label", () => {
    const block = createDefaultButtonBlock("b7");
    block.label = 'Click "here"';
    const html = renderButton(block, 0);

    expect(html).toContain("Click &quot;here&quot;");
  });
});
