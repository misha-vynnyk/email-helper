import { renderButton } from "../render/renderButton";
import { createDefaultButtonBlock } from "../types";

const FONT = "'Roboto', Arial, Helvetica, sans-serif";

describe("renderButton", () => {
  it("renders a filled button by default, with fill/radius on the outer table", () => {
    const block = createDefaultButtonBlock("b1", "parent");
    const html = renderButton(block, FONT, 14);

    expect(html).not.toContain("bgcolor=");
    expect(html).toContain(`background-color:${block.bgColor};`);
    expect(html).not.toContain("border:");
    expect(html).toContain("padding-bottom: 14px;");
    expect(html).toContain(`border-radius:${block.borderRadiusPx}px;`);
  });

  it("renders a ghost button with no background at all when bgColor is unset", () => {
    const block = createDefaultButtonBlock("b2", "parent");
    block.bgColor = undefined;
    const html = renderButton(block, FONT, 0);

    expect(html).not.toContain("background-color:");
    expect(html).not.toContain("transparent");
  });

  it("renders an outline-only button using the border as its entire visual identity", () => {
    const block = createDefaultButtonBlock("b3", "parent");
    block.bgColor = undefined;
    block.border = { widthPx: 2, color: "#111111" };
    const html = renderButton(block, FONT, 0);

    expect(html).toContain("border:2px solid #111111;");
    expect(html).not.toContain("background-color:");
  });

  it("falls back to the placeholder href when given an unsafe href", () => {
    const block = createDefaultButtonBlock("b4", "parent");
    block.href = "javascript:alert(1)";
    const html = renderButton(block, FONT, 0);

    expect(html).toContain('href="urlhere"');
    expect(html).not.toContain("javascript:");
  });

  it("keeps a safe href as-is, with no target=_blank", () => {
    const block = createDefaultButtonBlock("b5", "parent");
    block.href = "https://example.com";
    const html = renderButton(block, FONT, 0);

    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("target=");
  });

  it("renders auto width with no width attribute or style at all", () => {
    const block = createDefaultButtonBlock("b6", "parent");
    block.width = "auto";
    const html = renderButton(block, FONT, 0);

    expect(html).not.toMatch(/<table[^>]*\swidth=/);
    expect(html).not.toContain("max-width:");
  });

  it("renders full width as width=100% on the table", () => {
    const block = createDefaultButtonBlock("b7", "parent");
    block.width = "full";
    const html = renderButton(block, FONT, 0);

    expect(html).toContain('width="100%"');
    expect(html).toContain("width:100%;max-width:100%;");
  });

  it("renders a fixed px width as an explicit width attribute and max-width", () => {
    const block = createDefaultButtonBlock("b8", "parent");
    block.width = 210;
    const html = renderButton(block, FONT, 0);

    expect(html).toContain('width="210"');
    expect(html).toContain("max-width:210px;");
  });

  it("escapes the label", () => {
    const block = createDefaultButtonBlock("b9", "parent");
    block.label = 'Click "here"';
    const html = renderButton(block, FONT, 0);

    expect(html).toContain("Click &quot;here&quot;");
  });

  it("uses the shell's default font family when the block has no override", () => {
    const block = createDefaultButtonBlock("b10", "parent");
    const html = renderButton(block, FONT, 0);

    expect(html).toContain(`font-family:${FONT}`);
  });

  it("uses the block's own fontFamily override instead of the shell default when set", () => {
    const block = createDefaultButtonBlock("b11", "parent");
    block.fontFamily = "'Poppins', Arial, sans-serif";
    const html = renderButton(block, FONT, 0);

    expect(html).toContain("font-family:'Poppins', Arial, sans-serif");
  });

  it("guarantees a fixed height and duplicates text styling on both the td and the a", () => {
    const block = createDefaultButtonBlock("b12", "parent");
    const html = renderButton(block, FONT, 0);

    expect(html).toContain('height="40"');
    expect(html.match(new RegExp(`color:${block.textColor}`, "g"))?.length).toBe(2);
  });
});
