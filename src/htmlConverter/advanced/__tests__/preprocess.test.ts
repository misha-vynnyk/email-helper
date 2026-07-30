import { normalizeSymbols, preprocess, resolveOneBrSymbol,resolveSideImageMarkers } from "../preprocess";

// ── resolveOneBrSymbol ────────────────────────────────────────────────────────

describe("resolveOneBrSymbol", () => {
  it("replaces § with <br>", () => {
    expect(resolveOneBrSymbol("text§more")).toBe('text<br data-one-br="1">more');
  });

  it("absorbs adjacent <br> before §", () => {
    expect(resolveOneBrSymbol("text<br>§more")).toBe('text<br data-one-br="1">more');
  });

  it("absorbs adjacent <br> after §", () => {
    expect(resolveOneBrSymbol("text§<br>more")).toBe('text<br data-one-br="1">more');
  });

  it("absorbs multiple <br> on both sides of §", () => {
    expect(resolveOneBrSymbol("text<br><br>§<br><br>more")).toBe('text<br data-one-br="1">more');
  });

  it("handles § inside HTML without breaking tags", () => {
    const result = resolveOneBrSymbol("<p>text§more</p>");
    expect(result).toContain("<br");
    expect(result).not.toContain("§");
  });

  it("replaces a custom symbol instead of §", () => {
    expect(resolveOneBrSymbol("text~more", "~")).toBe('text<br data-one-br="1">more');
  });

  it("leaves § alone when a custom symbol is configured", () => {
    expect(resolveOneBrSymbol("text§~more", "~")).toBe('text§<br data-one-br="1">more');
  });
});

// ── normalizeSymbols ──────────────────────────────────────────────────────────

describe("normalizeSymbols", () => {
  it("encodes emoji as HTML entities", () => {
    const result = normalizeSymbols("Hello 🎉 World");
    expect(result).not.toContain("🎉");
    expect(result).toContain("&#");
  });

  it("does not encode plain ASCII letters", () => {
    const result = normalizeSymbols("<p>Hello World</p>");
    expect(result).toBe("<p>Hello World</p>");
  });

  it("does not encode HTML angle brackets", () => {
    const result = normalizeSymbols("<b>bold</b>");
    expect(result).toBe("<b>bold</b>");
  });
});

// ── resolveSideImageMarkers ───────────────────────────────────────────────────

describe("resolveSideImageMarkers", () => {
  it("wraps content between <div>i-r-s</div>...<div>i-r-s-e</div> into a data-side-image=right div", () => {
    const result = resolveSideImageMarkers("<div>i-r-s</div><p>Hello</p><div>i-r-s-e</div>");
    expect(result).toBe('<div data-side-image="right"><p>Hello</p></div>');
  });

  it("wraps content between <div>i-l-s</div>...<div>i-l-s-e</div> into a data-side-image=left div", () => {
    const result = resolveSideImageMarkers("<div>i-l-s</div><p>Hello</p><div>i-l-s-e</div>");
    expect(result).toBe('<div data-side-image="left"><p>Hello</p></div>');
  });

  it("leaves unrelated content around the pair untouched", () => {
    const result = resolveSideImageMarkers("<p>Before</p><div>i-r-s</div><p>Inside</p><div>i-r-s-e</div><p>After</p>");
    expect(result).toBe('<p>Before</p><div data-side-image="right"><p>Inside</p></div><p>After</p>');
  });

  it("does not confuse i-l-s with i-r-s's close marker", () => {
    // i-r-s's own regex only pairs with i-r-s-e — an i-l-s-e nearby must not match it.
    const result = resolveSideImageMarkers("<div>i-r-s</div><p>A</p><div>i-l-s-e</div>");
    expect(result).not.toContain("data-side-image");
  });

  it("strips an unclosed opening marker and warns", () => {
    const warn = jest.fn();
    const result = resolveSideImageMarkers("<p>Before</p><div>i-r-s</div><p>After</p>", warn);
    expect(result).toBe("<p>Before</p><p>After</p>");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("strips an unclosed closing marker and warns", () => {
    const warn = jest.fn();
    const result = resolveSideImageMarkers("<p>Before</p><div>i-l-s-e</div><p>After</p>", warn);
    expect(result).toBe("<p>Before</p><p>After</p>");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not warn when no marker is present", () => {
    const warn = jest.fn();
    resolveSideImageMarkers("<p>Nothing special</p>", warn);
    expect(warn).not.toHaveBeenCalled();
  });

  it("is a no-op without warn callback when markers are unclosed (still strips silently)", () => {
    const result = resolveSideImageMarkers("<div>i-r-s</div><p>After</p>");
    expect(result).toBe("<p>After</p>");
  });
});

// ── preprocess pipeline ───────────────────────────────────────────────────────

describe("preprocess", () => {
  it("converts § to <br>", () => {
    const result = preprocess("<p>line1§line2</p>");
    expect(result).not.toContain("§");
    expect(result).toContain("<br");
  });

  it("does NOT encode emoji (normalizeSymbols runs after DOM round-trip in index.ts)", () => {
    // normalizeSymbols was moved out of preprocess() because DOMParser decodes
    // HTML entities back to raw characters, making the encoding a no-op.
    // It is now applied to the final rendered HTML string in index.ts instead.
    const result = preprocess("<p>Hi 😊</p>");
    expect(result).toContain("😊");
  });

  it("does NOT merge adjacent paragraphs (handled by classify.ts pushMerged instead)", () => {
    // paragraph merging with paraBreaks tracking happens in classify.ts
    const input = '<p dir="ltr">A</p><p dir="ltr">B</p>';
    const result = preprocess(input);
    expect((result.match(/<p /g) ?? []).length).toBe(2);
  });

  it("does not alter plain HTML without special chars", () => {
    const input = "<p>hello world</p>";
    expect(preprocess(input)).toBe(input);
  });
});
