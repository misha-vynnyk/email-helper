import { renderReadyMade } from "../render/renderReadyMade";
import type { ReadyMadeBlock } from "../types";

describe("renderReadyMade", () => {
  it("substitutes every slot in the header-simple template", () => {
    const block: ReadyMadeBlock = { id: "h1", parentId: "s1", type: "ready-made", definitionId: "header-simple", values: { src: "https://cdn.example.com/logo.png", href: "https://example.com" } };

    const html = renderReadyMade(block);

    expect(html).toContain('src="https://cdn.example.com/logo.png"');
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("{{");
  });

  it("substitutes both image slots and the shared href in header-adaptive, keeping the MSO conditional comment literal", () => {
    const block: ReadyMadeBlock = {
      id: "h2",
      parentId: "s1",
      type: "ready-made",
      definitionId: "header-adaptive",
      values: { desktopSrc: "https://cdn.example.com/desktop.png", mobileSrc: "https://cdn.example.com/mobile.png", href: "https://example.com" },
    };

    const html = renderReadyMade(block);

    expect(html).toContain('src="https://cdn.example.com/desktop.png"');
    expect(html).toContain('src="https://cdn.example.com/mobile.png"');
    expect(html.match(/href="https:\/\/example\.com"/g)?.length).toBe(2); // both <a> tags share the one href slot
    expect(html).toContain("<!--[if !mso 9]><!-->");
    expect(html).toContain("<!--<![endif]-->");
    expect(html).toContain('class="sm-hidden"');
    expect(html).toContain('class="sm-tab-cell"');
  });

  it("falls back to each slot's own defaultValue when a value is missing", () => {
    const block: ReadyMadeBlock = { id: "h3", parentId: "s1", type: "ready-made", definitionId: "header-simple", values: {} };

    const html = renderReadyMade(block);

    expect(html).toContain('href="urlhere"'); // header-simple's href slot default
    expect(html).not.toContain("{{");
  });

  it("drops an unsafe href and falls back to the urlhere placeholder, same as other renderers", () => {
    const block: ReadyMadeBlock = { id: "h4", parentId: "s1", type: "ready-made", definitionId: "header-simple", values: { href: "javascript:alert(1)" } };

    const html = renderReadyMade(block);

    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="urlhere"');
  });

  it("returns an empty string for an unknown definitionId instead of throwing", () => {
    const block: ReadyMadeBlock = { id: "h5", parentId: "s1", type: "ready-made", definitionId: "does-not-exist", values: {} };
    expect(renderReadyMade(block)).toBe("");
  });

  it("applies a node's opted-in responsiveClassNames onto the header-simple template's own td (no base class there)", () => {
    const block: ReadyMadeBlock = { id: "h6", parentId: "s1", type: "ready-made", definitionId: "header-simple", values: {}, responsiveClassNames: ["sm-hidden", "xs-text-center"] };

    const html = renderReadyMade(block);

    expect(html).toContain('<td class="sm-hidden xs-text-center"');
    expect(html).not.toContain("{{");
  });

  it("merges a node's opted-in responsiveClassNames with header-adaptive's own literal base classes on each cell", () => {
    const block: ReadyMadeBlock = { id: "h7", parentId: "s1", type: "ready-made", definitionId: "header-adaptive", values: {}, responsiveClassNames: ["xs-text-center"] };

    const html = renderReadyMade(block);

    expect(html).toContain('<td class="sm-hidden xs-text-center"');
    expect(html).toContain('<td class="sm-tab-cell xs-text-center"');
  });

  it("omits the class attribute entirely on header-simple when the node has no responsiveClassNames", () => {
    const block: ReadyMadeBlock = { id: "h8", parentId: "s1", type: "ready-made", definitionId: "header-simple", values: {} };

    const html = renderReadyMade(block);

    expect(html).not.toMatch(/<td\s+class=/);
    expect(html).toMatch(/<td\s+align="center"/);
  });
});
