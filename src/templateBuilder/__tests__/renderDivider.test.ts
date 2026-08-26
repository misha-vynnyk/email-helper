import { renderDivider } from "../render/renderDivider";
import { createDefaultDividerBlock } from "../types";

describe("renderDivider", () => {
  it("renders the color and thickness as a border-top, not a literal <hr>", () => {
    const block = createDefaultDividerBlock("d1");
    const html = renderDivider(block, 14);

    expect(html).not.toContain("<hr");
    expect(html).toContain(`border-top:${block.thicknessPx}px solid ${block.color};`);
    expect(html).toContain("padding-bottom: 14px;");
  });

  it("reflects a custom thickness/color/width", () => {
    const block = createDefaultDividerBlock("d2");
    block.thicknessPx = 3;
    block.color = "#ff0000";
    block.widthPercent = 50;
    const html = renderDivider(block, 0);

    expect(html).toContain("border-top:3px solid #ff0000;");
    expect(html).toContain('width="50%"');
    expect(html).toContain("width:50%;");
  });
});
