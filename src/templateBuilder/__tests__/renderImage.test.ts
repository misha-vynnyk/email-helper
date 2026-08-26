import { renderImage } from "../render/renderImage";
import { createDefaultImageBlock, PLACEHOLDER_IMAGE_SRC } from "../types";

describe("renderImage", () => {
  it("renders without a link wrapper when href is not set", () => {
    const block = createDefaultImageBlock("i1", "parent");
    const html = renderImage(block, 14);

    expect(html).not.toContain("<a ");
    expect(html).toContain(`src="${PLACEHOLDER_IMAGE_SRC}"`);
    expect(html).toContain('class="img-bg-block"');
    expect(html).toContain("padding-bottom: 14px;");
  });

  it("wraps the image in a target=_blank link when href is set", () => {
    const block = createDefaultImageBlock("i2", "parent");
    block.href = "https://example.com";
    block.widthPx = 300;
    const html = renderImage(block, 0);

    expect(html).toContain('<a href="https://example.com" target="_blank">');
    expect(html).toContain('max-width: 300px;');
    expect(html).toContain('width="300"');
  });

  it("escapes alt text", () => {
    const block = createDefaultImageBlock("i3", "parent");
    block.alt = 'a "quoted" alt';
    const html = renderImage(block, 0);

    expect(html).toContain('alt="a &quot;quoted&quot; alt"');
  });

  it("drops a javascript: href instead of rendering it", () => {
    const block = createDefaultImageBlock("i4", "parent");
    block.href = "javascript:alert(1)";
    const html = renderImage(block, 0);

    expect(html).not.toContain("<a ");
    expect(html).not.toContain("javascript:");
  });
});
