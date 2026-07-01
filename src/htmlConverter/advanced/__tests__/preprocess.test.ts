import { resolveOneBrSymbol, normalizeSymbols, mergeSimilarBlockTags, preprocess } from "../preprocess";

// ── resolveOneBrSymbol ────────────────────────────────────────────────────────

describe("resolveOneBrSymbol", () => {
  it("replaces § with <br>", () => {
    expect(resolveOneBrSymbol("text§more")).toBe("text<br>\nmore");
  });

  it("absorbs adjacent <br> before §", () => {
    expect(resolveOneBrSymbol("text<br>§more")).toBe("text<br>\nmore");
  });

  it("absorbs adjacent <br> after §", () => {
    expect(resolveOneBrSymbol("text§<br>more")).toBe("text<br>\nmore");
  });

  it("absorbs multiple <br> on both sides of §", () => {
    expect(resolveOneBrSymbol("text<br><br>§<br><br>more")).toBe("text<br>\nmore");
  });

  it("handles § inside HTML without breaking tags", () => {
    const result = resolveOneBrSymbol("<p>text§more</p>");
    expect(result).toContain("<br>");
    expect(result).not.toContain("§");
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

// ── mergeSimilarBlockTags ─────────────────────────────────────────────────────

describe("mergeSimilarBlockTags", () => {
  it("merges two adjacent identical <p> tags", () => {
    const input = '<p dir="ltr">First</p><p dir="ltr">Second</p>';
    const result = mergeSimilarBlockTags(input);
    expect(result).toContain("First");
    expect(result).toContain("Second");
    expect(result).toContain("<br>");
    // Only one opening <p> should remain
    const pCount = (result.match(/<p /g) ?? []).length;
    expect(pCount).toBe(1);
  });

  it("does NOT merge <p> tags with different attributes", () => {
    const input = '<p style="text-align:left">A</p><p style="text-align:center">B</p>';
    const result = mergeSimilarBlockTags(input);
    // Two different p tags should stay separate
    const pCount = (result.match(/<p /g) ?? []).length;
    expect(pCount).toBe(2);
  });

  it("does not touch content when no adjacent identical tags", () => {
    const input = "<p>A</p><h1>B</h1>";
    const result = mergeSimilarBlockTags(input);
    expect(result).toBe(input);
  });
});

// ── preprocess pipeline ───────────────────────────────────────────────────────

describe("preprocess", () => {
  it("converts § to <br>", () => {
    const result = preprocess("<p>line1§line2</p>");
    expect(result).not.toContain("§");
    expect(result).toContain("<br>");
  });

  it("encodes emoji", () => {
    const result = preprocess("<p>Hi 😊</p>");
    expect(result).not.toContain("😊");
    expect(result).toContain("&#");
  });

  it("does NOT merge adjacent paragraphs (handled by classify.ts pushMerged instead)", () => {
    // mergeSimilarBlockTags is intentionally excluded from the pipeline;
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
