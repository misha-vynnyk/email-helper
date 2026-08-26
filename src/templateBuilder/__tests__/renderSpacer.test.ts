import { renderSpacer } from "../render/renderSpacer";
import { createDefaultSpacerBlock } from "../types";

describe("renderSpacer", () => {
  it("reflects heightPx in both the height attribute and the inline style", () => {
    const block = createDefaultSpacerBlock("s1");
    const html = renderSpacer(block);

    expect(html).toContain(`height="${block.heightPx}"`);
    expect(html).toContain(`height:${block.heightPx}px;`);
  });

  it("reflects a custom height", () => {
    const block = createDefaultSpacerBlock("s2");
    block.heightPx = 60;
    const html = renderSpacer(block);

    expect(html).toContain('height="60"');
    expect(html).toContain("height:60px;");
  });
});
