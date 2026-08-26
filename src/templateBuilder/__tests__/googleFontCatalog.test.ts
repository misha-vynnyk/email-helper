import { buildGoogleFontsHref, fontFamilyStack, GOOGLE_FONT_CATALOG } from "../googleFontCatalog";

describe("googleFontCatalog", () => {
  it("has exactly 50 curated fonts with no duplicate names", () => {
    expect(GOOGLE_FONT_CATALOG).toHaveLength(50);
    expect(new Set(GOOGLE_FONT_CATALOG.map((f) => f.name)).size).toBe(50);
  });

  it("builds a fallback stack matching the font's category", () => {
    expect(fontFamilyStack("Roboto", "sans-serif")).toBe("'Roboto', Arial, Helvetica, sans-serif");
    expect(fontFamilyStack("Playfair Display", "serif")).toBe("'Playfair Display', Georgia, 'Times New Roman', serif");
  });

  it("returns undefined for an empty selection", () => {
    expect(buildGoogleFontsHref([])).toBeUndefined();
  });

  it("builds a single-font href with spaces encoded as +", () => {
    const href = buildGoogleFontsHref(["Playfair Display"]);
    expect(href).toContain("family=Playfair+Display:ital,wght@");
    expect(href).toContain("&display=swap");
    expect(href?.startsWith("https://fonts.googleapis.com/css2?")).toBe(true);
  });

  it("uses the compact min..max range syntax for true variable fonts", () => {
    const href = buildGoogleFontsHref(["Roboto"]);
    expect(href).toContain("family=Roboto:ital,wght@0,100..900;1,100..900");
  });

  it("lists only the font's own real static weights, in ascending (ital, wght) order", () => {
    const href = buildGoogleFontsHref(["Lato"]);
    expect(href).toContain("family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900");
    // Lato never ships 200/500/600/800 — must not be requested.
    expect(href).not.toContain("0,200");
  });

  it("combines multiple fonts into one href joined by &family=", () => {
    const href = buildGoogleFontsHref(["Inter", "Lato"]);
    expect(href).toContain("family=Inter:ital,wght@0,100..900;1,100..900");
    expect(href).toContain("&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900");
  });

  it("silently skips a name that isn't in the catalog", () => {
    const href = buildGoogleFontsHref(["Not A Real Font"]);
    expect(href).toBeUndefined();
  });

  it("every catalog entry's static weight list (when not variable) is non-empty and sorted ascending", () => {
    for (const font of GOOGLE_FONT_CATALOG) {
      if (font.weights === "variable") continue;
      expect(font.weights.length).toBeGreaterThan(0);
      expect(font.weights).toEqual([...font.weights].sort((a, b) => a - b));
    }
  });
});
