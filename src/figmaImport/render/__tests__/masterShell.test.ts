import { assembleDocument } from "../masterShell";

describe("assembleDocument", () => {
  it("substitutes the title slot and inserts content between the Content bracket comments", () => {
    const html = assembleDocument("<tr><td>CONTENT_MARKER</td></tr>", { title: "My Template" });

    expect(html).toContain("<title>My Template</title>");
    expect(html).toContain("CONTENT_MARKER");
    expect(html.indexOf("Content start")).toBeLessThan(html.indexOf("CONTENT_MARKER"));
    expect(html.indexOf("CONTENT_MARKER")).toBeLessThan(html.indexOf("Content / end"));
  });

  it("never leaves the title placeholder token in the output", () => {
    const html = assembleDocument("", { title: "Anything" });
    expect(html).not.toContain("__FIGMA_IMPORT_TITLE__");
  });

  it("builds a Google Fonts link and [style*=] rules from the given font list, not a hardcoded set", () => {
    const html = assembleDocument("", {
      title: "SteadyFiscalNote.com",
      fonts: [
        { family: "Roboto", googleQuery: "Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400" },
        { family: "Montserrat", googleQuery: "Montserrat:wght@600" },
      ],
    });

    expect(html).toContain(
      "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Montserrat:wght@600&display=swap",
    );
    expect(html).toContain('[style*="Roboto"] { font-family: "Roboto", Arial, Helvetica, sans-serif; }');
    expect(html).toContain('[style*="Montserrat"] { font-family: "Montserrat", Arial, Helvetica, sans-serif; }');
    // the old hardcoded placeholder fonts from the original reference file must be gone
    expect(html).not.toContain("Instrument+Sans");
    expect(html).not.toContain("Jost");
    expect(html).not.toContain("Poppins");
  });

  it("respects a custom fallback stack per font", () => {
    const html = assembleDocument("", {
      title: "t",
      fonts: [{ family: "Playfair Display", googleQuery: "Playfair+Display:wght@700", fallback: "Georgia, serif" }],
    });
    expect(html).toContain('[style*="Playfair Display"] { font-family: "Playfair Display", Georgia, serif; }');
  });

  it("emits no font link/rules and leaves no token behind when no fonts are given", () => {
    const html = assembleDocument("", { title: "t" });
    expect(html).not.toContain("fonts.googleapis.com/css2?family=");
    expect(html).not.toContain("__FIGMA_IMPORT_FONT_LINK__");
    expect(html).not.toContain("__FIGMA_IMPORT_FONT_RULES__");
    expect(html).not.toContain("__FIGMA_IMPORT_EXTRA_CSS__");
  });

  it("keeps the rest of the shell (doctype, meta, MSO blocks, Wrapper/Outer/Inner tables) regardless of title/fonts", () => {
    const html = assembleDocument("", { title: "t" });
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain('<meta name="x-apple-disable-message-reformatting" />');
    expect(html).toContain("<!--[if (gte mso 9)|(IE)]>");
    expect(html).toContain("<!--[ Wrapper ]-->");
    expect(html).toContain("<!--[ Outer — max-width wrap + background ]-->");
    expect(html).toContain("<!--[ BG Pattern — optional repeating background image ]-->");
    expect(html).toContain("<!--[ Inner — 600px content table ]-->");
  });
});
