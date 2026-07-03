import { tokens, mergeTokens } from "../config/tokens";

describe("mergeTokens", () => {
  it("returns original token values when override is empty", () => {
    const merged = mergeTokens(tokens, {});
    expect(merged.font.bodyPx).toBe(tokens.font.bodyPx);
    expect(merged.color.link).toBe(tokens.color.link);
    expect(merged.layout.sidePadding).toBe(tokens.layout.sidePadding);
  });

  it("overrides a single color field, preserving others", () => {
    const merged = mergeTokens(tokens, { color: { link: "#ff0000" } });
    expect(merged.color.link).toBe("#ff0000");
    expect(merged.color.white).toBe(tokens.color.white);
    expect(merged.color.black).toBe(tokens.color.black);
    expect(merged.color.button).toBe(tokens.color.button);
  });

  it("overrides a single font field, preserving others", () => {
    const merged = mergeTokens(tokens, { font: { bodyPx: 20 } });
    expect(merged.font.bodyPx).toBe(20);
    expect(merged.font.headlinePx).toBe(tokens.font.headlinePx);
    expect(merged.font.stack).toBe(tokens.font.stack);
  });

  it("overrides a single layout field, preserving others", () => {
    const merged = mergeTokens(tokens, { layout: { sidePadding: 30 } });
    expect(merged.layout.sidePadding).toBe(30);
    expect(merged.layout.blockPadY).toBe(tokens.layout.blockPadY);
    expect(merged.layout.containerMaxWidth).toBe(tokens.layout.containerMaxWidth);
  });

  it("overrides button fields", () => {
    const merged = mergeTokens(tokens, { button: { radius: 0 } });
    expect(merged.button.radius).toBe(0);
    expect(merged.button.height).toBe(tokens.button.height);
  });

  it("overrides tags fields", () => {
    const merged = mergeTokens(tokens, { tags: { bold: "strong" } });
    expect(merged.tags.bold).toBe("strong");
    expect(merged.tags.italic).toBe(tokens.tags.italic);
    expect(merged.tags.underline).toBe(tokens.tags.underline);
  });

  it("overrides accentBullet", () => {
    const merged = mergeTokens(tokens, { accentBullet: "→ " });
    expect(merged.accentBullet).toBe("→ ");
  });

  it("keeps default accentBullet when not in override", () => {
    const merged = mergeTokens(tokens, { font: { bodyPx: 16 } });
    expect(merged.accentBullet).toBe(tokens.accentBullet);
  });

  it("overrides multiple categories at once", () => {
    const merged = mergeTokens(tokens, {
      font: { bodyPx: 16, headlinePx: 24 },
      layout: { sidePadding: 25 },
    });
    expect(merged.font.bodyPx).toBe(16);
    expect(merged.font.headlinePx).toBe(24);
    expect(merged.layout.sidePadding).toBe(25);
    // unchanged categories
    expect(merged.color.link).toBe(tokens.color.link);
  });

  it("does not mutate the base tokens object", () => {
    const originalBodyPx = tokens.font.bodyPx;
    mergeTokens(tokens, { font: { bodyPx: 99 } });
    expect(tokens.font.bodyPx).toBe(originalBodyPx);
  });
});
