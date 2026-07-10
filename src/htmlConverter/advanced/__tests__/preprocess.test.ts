import { normalizeSymbols, preprocess,resolveOneBrSymbol } from "../preprocess";

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
