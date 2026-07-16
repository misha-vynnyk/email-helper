import { baseStyle, blockRow,borderSpecToStyle,buildTemplates } from "../config/templates";
import { mergeTokens,tokens } from "../config/tokens";
import { profile as alphaoneProfile } from "../profiles/alphaone";
import { profile as tttProfile } from "../profiles/ttt";

const tmpl = buildTemplates(tokens);

// ── document() scaffold ───────────────────────────────────────────────────────

describe("buildTemplates — document()", () => {
  it("contains the default sidePadding (20px)", () => {
    const html = tmpl.document("<tr><td>content</td></tr>");
    expect(html).toContain("padding-left:20px");
    expect(html).toContain("padding-right:20px");
  });

  it("contains the default containerMaxWidth (600px)", () => {
    const html = tmpl.document("<tr><td>content</td></tr>");
    expect(html).toContain("max-width:600px");
  });

  it("wraps content in the document", () => {
    const html = tmpl.document("<tr><td>MY_CONTENT</td></tr>");
    expect(html).toContain("MY_CONTENT");
  });

  // Fix #3: TTT profile sidePadding (21px) must be respected
  it("TTT profile uses sidePadding:21px", () => {
    const tttTok = mergeTokens(tokens, tttProfile);
    const tttTmpl = buildTemplates(tttTok);
    const html = tttTmpl.document("<tr><td>x</td></tr>");
    expect(html).toContain("padding-left:21px");
    expect(html).toContain("padding-right:21px");
  });

  it("TTT profile spacerPx is reflected in scaffold spacers", () => {
    const tttTok = mergeTokens(tokens, tttProfile);
    const tttTmpl = buildTemplates(tttTok);
    const html = tttTmpl.document("<tr><td>x</td></tr>");
    expect(html).toContain(`height="${tttTok.layout.spacerPx}"`);
  });

  it("AlfaOne profile sidePadding stays at default (20px)", () => {
    const tok = mergeTokens(tokens, alphaoneProfile);
    const html = buildTemplates(tok).document("<tr><td>x</td></tr>");
    expect(html).toContain("padding-left:20px");
  });
});

// ── escHref ───────────────────────────────────────────────────────────────────

describe("buildTemplates — escHref in buttonTableHtml", () => {
  // Fix #8: escHref must escape <, >, &, "
  it("escapes ampersand in href", () => {
    const html = tmpl.buttonBand({
      innerHtml: "click",
      href: "https://example.com?a=1&b=2",
      bg: "#000000",
    });
    expect(html).toContain("&amp;");
    // No raw unescaped & should appear in the href attribute value
    expect(html).not.toMatch(/href="[^"]*&(?!amp;|lt;|gt;|quot;|#)/);
  });

  it("escapes double-quote in href", () => {
    const html = tmpl.buttonBand({
      innerHtml: "click",
      href: 'https://example.com?q="hello"',
      bg: "#000000",
    });
    expect(html).toContain("&quot;");
  });

  it("escapes < and > in href", () => {
    const html = tmpl.buttonBand({
      innerHtml: "click",
      href: "https://example.com?a=<b>",
      bg: "#000000",
    });
    expect(html).toContain("&lt;");
    expect(html).toContain("&gt;");
  });
});

// ── border on buttonBand/alertBand (Fix #3) ───────────────────────────────────

describe("buildTemplates — border on buttonBand/alertBand", () => {
  it("buttonBand draws the border when passed (dark bg CTA with an outline)", () => {
    const html = tmpl.buttonBand({
      innerHtml: "click",
      href: "https://example.com",
      bg: "#000000",
      border: { top: { color: "#ffffff" } },
    });
    expect(html).toContain("border-top:");
    expect(html).toContain("#ffffff");
  });

  it("buttonBand has no border style when border is absent (no regression)", () => {
    const html = tmpl.buttonBand({ innerHtml: "click", href: "https://example.com", bg: "#000000" });
    expect(html).not.toContain("border-top:");
    expect(html).not.toContain("border-left:");
  });

  it("alertBand draws the border when passed", () => {
    const html = tmpl.alertBand({
      innerHtml: "alert",
      bg: "#000000",
      border: { left: { color: "#ff0000" } },
    });
    expect(html).toContain("border-left:");
    expect(html).toContain("#ff0000");
  });

  it("alertBand has no border style when border is absent (no regression)", () => {
    const html = tmpl.alertBand({ innerHtml: "alert", bg: "#000000" });
    expect(html).not.toContain("border-left:");
  });
});

// ── blockRow padding ──────────────────────────────────────────────────────────

describe("buildTemplates — blockRow padding", () => {
  it("uses tok.layout.blockPadY for padding-top and padding-bottom", () => {
    const html = tmpl.paragraph({ innerHtml: "text", size: "body" });
    expect(html).toContain(`padding-top:${tokens.layout.blockPadY}px`);
    expect(html).toContain(`padding-bottom:${tokens.layout.blockPadY}px`);
  });

  it("TTT profile blockPadY (15) is reflected", () => {
    const tok = mergeTokens(tokens, tttProfile);
    const html = buildTemplates(tok).paragraph({ innerHtml: "text", size: "body" });
    expect(html).toContain("padding-top:15px");
    expect(html).toContain("padding-bottom:15px");
  });

  it("AlfaOne profile blockPadY (16) is reflected", () => {
    const tok = mergeTokens(tokens, alphaoneProfile);
    const html = buildTemplates(tok).paragraph({ innerHtml: "text", size: "body" });
    expect(html).toContain("padding-top:16px");
    expect(html).toContain("padding-bottom:16px");
  });
});

// ── Profile font stack ────────────────────────────────────────────────────────

describe("buildTemplates — profile font stacks", () => {
  it("default uses Roboto font", () => {
    const html = tmpl.paragraph({ innerHtml: "text", size: "body" });
    expect(html).toContain("Roboto");
  });

  it("AlfaOne profile uses Verdana font stack", () => {
    const tok = mergeTokens(tokens, alphaoneProfile);
    const html = buildTemplates(tok).paragraph({ innerHtml: "text", size: "body" });
    expect(html).toContain("Verdana");
  });
});

// ── statsGrid border ──────────────────────────────────────────────────────────

describe("buildTemplates — statsGrid gridBorder", () => {
  // Design principle: never synthesize a border the source document didn't declare.
  it("renders no border when neither cell nor grid declares a borderColor", () => {
    const html = tmpl.statsGrid([{ innerHtml: "a" }, { innerHtml: "b" }], { n: 2 });
    expect(html).not.toContain("border:");
  });

  it("uses the grid's shared borderColor when provided", () => {
    const html = tmpl.statsGrid([{ innerHtml: "a" }, { innerHtml: "b" }], { n: 2, borderColor: "#aabbcc" });
    expect(html).toContain("#aabbcc");
  });

  // Fix #5: per-cell borderColor must render per-<td>, not collapse to one shared color
  it("each cell's own borderColor overrides the shared grid borderColor", () => {
    const html = tmpl.statsGrid(
      [{ innerHtml: "a", borderColor: "#ff0000" }, { innerHtml: "b", borderColor: "#0000ff" }],
      { n: 2, borderColor: "#00ff00" },
    );
    expect(html).toContain("#ff0000");
    expect(html).toContain("#0000ff");
  });

  it("cell without its own borderColor falls back to the shared grid borderColor", () => {
    const html = tmpl.statsGrid(
      [{ innerHtml: "a", borderColor: "#ff0000" }, { innerHtml: "b" }],
      { n: 2, borderColor: "#00ff00" },
    );
    expect(html).toContain("#ff0000");
    expect(html).toContain("#00ff00");
  });
});

// ── recordRow border ──────────────────────────────────────────────────────────

describe("buildTemplates — recordRow per-cell borderColor", () => {
  it("each cell's own borderColor overrides the shared row borderColor", () => {
    const html = tmpl.recordRow({
      borderColor: "#00ff00",
      rows: [{ cells: [
        { innerHtml: "a", borderColor: "#ff0000" },
        { innerHtml: "b", borderColor: "#0000ff" },
      ] }],
    });
    expect(html).toContain("#ff0000");
    expect(html).toContain("#0000ff");
  });

  it("cell without its own borderColor falls back to the shared row borderColor", () => {
    const html = tmpl.recordRow({
      borderColor: "#00ff00",
      rows: [{ cells: [{ innerHtml: "a" }] }],
    });
    expect(html).toContain("#00ff00");
  });

  // Bug fix: a row with a dark-bg label cell + a light-bg content cell must not leak the
  // dark cell's white text color onto the light cell — each cell's own bg (or the row's
  // *uniform* bg, when set) decides its text color, never a sibling's bg.
  it("light-bg cell in a row that also has a dark-bg cell gets black text, not white", () => {
    const html = tmpl.recordRow({
      rows: [{ cells: [
        { innerHtml: "label", bg: "#0a2463" },
        { innerHtml: "content", bg: "#f9f9f9" },
      ] }],
    });
    // First "<td" is the template's own outer wrapper cell — skip it, keep only the
    // per-record <td align="..."> cells.
    const cells = html.split("<td").slice(1).filter(c => c.startsWith(" align="));
    expect(cells[0]).toContain("color:#ffffff");
    expect(cells[1]).toContain("color:#000000");
    expect(cells[1]).not.toContain("color:#ffffff");
  });
});

// ── statsGrid per-cell background ─────────────────────────────────────────────

describe("buildTemplates — statsGrid highlighted cell", () => {
  it("renders bgcolor and background-color for a cell with bg", () => {
    const html = tmpl.statsGrid(
      [{ innerHtml: "a" }, { innerHtml: "b", bg: "#0a2463" }],
      { n: 2 },
    );
    expect(html).toContain('bgcolor="#0a2463"');
    expect(html).toContain("background-color:#0a2463");
  });

  it("uses white text color on a dark cell background", () => {
    const html = tmpl.statsGrid([{ innerHtml: "x", bg: "#0a2463" }], { n: 1 });
    expect(html).toContain(tokens.color.white);
  });

  it("uses black text color on a light cell background", () => {
    const html = tmpl.statsGrid([{ innerHtml: "x", bg: "#f1ede6" }], { n: 1 });
    expect(html).toContain(tokens.color.black);
  });

  it("cell without bg has no bgcolor attribute", () => {
    const html = tmpl.statsGrid([{ innerHtml: "x" }], { n: 1 });
    expect(html).not.toContain("bgcolor=");
  });
});

// ── calloutLeft ───────────────────────────────────────────────────────────────

describe("buildTemplates — calloutLeft", () => {
  it("uses border-left, not full border", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#ff9900" });
    expect(html).toMatch(/border-left:\d+px solid/);
    expect(html).not.toMatch(/border:\d+px solid/);
  });

  // Design principle: never synthesize a background the source document didn't declare.
  it("renders no bgcolor/background when bg not specified", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc" });
    expect(html).not.toContain("bgcolor=");
    expect(html).not.toContain("background-color:");
  });

  it("uses custom bg when provided", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc", bg: "#fff3cd" });
    expect(html).toContain("#fff3cd");
    expect(html).toContain('bgcolor="#fff3cd"');
  });

  it("renders a dashed accent when the source declared one", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc", accentStyle: "dashed" });
    expect(html).toMatch(/border-left:\d+px dashed #aabbcc/);
  });

  it("uses the document's own accentPadX instead of the calloutPadX token when declared", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc", accentPadX: 16 });
    expect(html).toContain("padding-left:16px;padding-right:16px;");
    expect(html).not.toContain(`padding-left:${tokens.layout.calloutPadX}px`);
  });

  it("falls back to the calloutPadX token when the source declares no indent", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc" });
    expect(html).toContain(`padding-left:${tokens.layout.calloutPadX}px;padding-right:${tokens.layout.calloutPadX}px;`);
  });
});

// ── borderSpecToStyle ─────────────────────────────────────────────────────────

describe("borderSpecToStyle", () => {
  it("defaults to solid when a side declares no style", () => {
    const css = borderSpecToStyle({ top: { color: "#000000" } }, tokens);
    expect(css).toMatch(/border-top:\d+px solid #000000;/);
  });

  it("uses the side's declared dashed/dotted style independently per side", () => {
    const css = borderSpecToStyle(
      { top: { color: "#000000", style: "dashed" }, left: { color: "#ff0000", style: "dotted" } },
      tokens,
    );
    expect(css).toMatch(/border-top:\d+px dashed #000000;/);
    expect(css).toMatch(/border-left:\d+px dotted #ff0000;/);
  });

  // A plain frame — all four sides present and visually identical — collapses to the
  // `border:` shorthand instead of 4 near-duplicate border-<side> declarations.
  it("collapses to the `border:` shorthand when all four sides are identical", () => {
    const side = { color: "#c2410c", widthPx: 2 };
    const css = borderSpecToStyle({ top: side, right: side, bottom: side, left: side }, tokens);
    expect(css).toBe("border:2px solid #c2410c;");
  });

  it("does NOT collapse when only three of four sides are present", () => {
    const side = { color: "#c2410c", widthPx: 2 };
    const css = borderSpecToStyle({ top: side, right: side, bottom: side }, tokens);
    expect(css).not.toContain("border:");
    expect(css).toContain("border-top:");
    expect(css).toContain("border-right:");
    expect(css).toContain("border-bottom:");
  });

  // A majority of matching sides (3 of 4) collapses into the `border:` shorthand, with an
  // explicit override for only the side that differs — fewer near-duplicate declarations
  // than 4 separate border-<side> lines, while still rendering the exact same result.
  it("collapses the 3 matching sides + overrides the 1 that differs in color", () => {
    const css = borderSpecToStyle(
      { top: { color: "#000000" }, right: { color: "#000000" }, bottom: { color: "#000000" }, left: { color: "#ff0000" } },
      tokens,
    );
    expect(css).toMatch(/^border:\d+px solid #000000;/);
    expect(css).toContain("border-left:");
    expect(css).toMatch(/border-left:\d+px solid #ff0000;/);
    expect(css).not.toContain("border-top:");
    expect(css).not.toContain("border-right:");
    expect(css).not.toContain("border-bottom:");
  });

  it("collapses the 3 matching sides + overrides the 1 that differs in width", () => {
    const css = borderSpecToStyle(
      {
        top: { color: "#000000", widthPx: 1 }, right: { color: "#000000", widthPx: 1 },
        bottom: { color: "#000000", widthPx: 1 }, left: { color: "#000000", widthPx: 3 },
      },
      tokens,
    );
    expect(css).toBe("border:1px solid #000000;border-left:3px solid #000000;");
  });

  it("collapses the 3 matching sides + overrides the 1 that differs in style (solid vs dashed)", () => {
    const css = borderSpecToStyle(
      {
        top: { color: "#000000" }, right: { color: "#000000" },
        bottom: { color: "#000000" }, left: { color: "#000000", style: "dashed" },
      },
      tokens,
    );
    expect(css).toMatch(/^border:\d+px solid #000000;/);
    expect(css).toMatch(/border-left:\d+px dashed #000000;/);
  });

  // No majority (all 4 sides pairwise different, or a 2-vs-2 tie split) — the merge only
  // pays off when 3+ sides agree, so a fully-mixed frame still falls back to explicit
  // per-side declarations.
  it("does NOT collapse when all four sides are pairwise different", () => {
    const css = borderSpecToStyle(
      {
        top: { color: "#000000" }, right: { color: "#ff0000" },
        bottom: { color: "#00ff00" }, left: { color: "#0000ff" },
      },
      tokens,
    );
    expect(css).not.toMatch(/^border:/);
    expect(css).toContain("border-top:");
    expect(css).toContain("border-right:");
    expect(css).toContain("border-bottom:");
    expect(css).toContain("border-left:");
  });
});

// ── image template ────────────────────────────────────────────────────────────

describe("buildTemplates — image", () => {
  // src/alt are NEVER read from the source document — every advanced-converter image is
  // re-uploaded through the app's own storage flow after conversion (matches Simple
  // converter's wrapImg/signatureImg convention, src/htmlConverter/templates.ts), which
  // finds/replaces this exact placeholder. tok.placeholderImageSrc/Alt are the only source.
  it("renders img wrapped in a placeholder link, using tok.placeholderImageSrc/Alt (matches simple wrapImg)", () => {
    const html = tmpl.image({});
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
    expect(html).toContain(`src="${tokens.placeholderImageSrc}"`);
    expect(html).toContain(`alt="${tokens.placeholderImageAlt}"`);
    expect(html).toContain(`class="${tokens.classes.imgBg}"`);
  });

  it("ignores src/alt even if a caller passes them (IR built outside the type system)", () => {
    const html = tmpl.image({ ...({ src: "https://docs.google.com/leaked-blob", alt: "from the doc" } as object) });
    expect(html).not.toContain("leaked-blob");
    expect(html).not.toContain('alt="from the doc"');
    expect(html).toContain(`src="${tokens.placeholderImageSrc}"`);
  });

  it("width equals tok.layout.placeholderImageWidth (560 by default)", () => {
    const html = tmpl.image({});
    expect(html).toContain(`width="${tokens.layout.placeholderImageWidth}"`);
    expect(html).toContain(`max-width:${tokens.layout.placeholderImageWidth}px`);
  });

  it("uses tok.layout.blockPadY for outer padding", () => {
    const html = tmpl.image({});
    expect(html).toContain(`padding-top:${tokens.layout.blockPadY}px`);
    expect(html).toContain(`padding-bottom:${tokens.layout.blockPadY}px`);
  });

  // placeholderImageWidth is its own hand-picked constant per Simple-converter provider
  // (560/562/400 — see Tokens.layout.placeholderImageWidth doc comment), NOT derived from
  // containerMaxWidth/sidePadding — overriding sidePadding alone must not move it.
  it("profile override of sidePadding does NOT change the rendered image width", () => {
    const tok = mergeTokens(tokens, { layout: { sidePadding: 30 } });
    const html = buildTemplates(tok).image({});
    expect(html).toContain(`width="${tokens.layout.placeholderImageWidth}"`);
  });

  it("profile override of placeholderImageWidth changes the rendered width (e.g. TTT's 400)", () => {
    const tok = mergeTokens(tokens, { layout: { placeholderImageWidth: 400 } });
    const html = buildTemplates(tok).image({});
    expect(html).toContain('width="400"');
    expect(html).toContain("max-width:400px");
  });

  // Locks the real profiles to the Simple converter's own hardcoded per-provider constants
  // (ttt/templates.ts's FULL_IMAGE_WIDTH="400", alphaone/templates.ts's width="562") — neither
  // follows containerMaxWidth − 2×sidePadding, so a formula-based width would silently drift
  // from what the Simple converter (and the app's real upload/replace flow) actually expects.
  it("TTT profile renders width=400, matching ttt/templates.ts's FULL_IMAGE_WIDTH", () => {
    const html = buildTemplates(mergeTokens(tokens, tttProfile)).image({});
    expect(html).toContain('width="400"');
    expect(html).toContain("max-width:400px");
  });

  it("AlfaOne profile renders width=562, matching alphaone/templates.ts's wrapImg", () => {
    const html = buildTemplates(mergeTokens(tokens, alphaoneProfile)).image({});
    expect(html).toContain('width="562"');
    expect(html).toContain("max-width:562px");
  });

  it("profile override of placeholderImageSrc changes the rendered src (e.g. TTT/AlfaOne bucket)", () => {
    const tok = mergeTokens(tokens, { placeholderImageSrc: "https://ogfinstorage.com/" });
    const html = buildTemplates(tok).image({});
    expect(html).toContain('src="https://ogfinstorage.com/"');
  });
});

// ── spacer template ───────────────────────────────────────────────────────────

describe("buildTemplates — spacer", () => {
  it("renders a <tr> with the given heightPx", () => {
    const html = tmpl.spacer(24);
    expect(html).toContain('height="24"');
  });

  it("uses tok.classes.spacer as class name", () => {
    const html = tmpl.spacer(16);
    expect(html).toContain(tokens.classes.spacer);
  });

  it("contains non-breaking space to keep cell height in email clients", () => {
    const html = tmpl.spacer(16);
    expect(html).toContain("&#160;");
  });
});

// ── buttonBand with subtitle ──────────────────────────────────────────────────

describe("buildTemplates — buttonBand subtitle", () => {
  it("renders subtitleHtml below the button when provided", () => {
    const html = tmpl.buttonBand({
      innerHtml: "Click",
      href: "https://example.com",
      bg: "#28b628",
      subtitleHtml: "<em>Note</em>",
    });
    expect(html).toContain("Click");
    expect(html).toContain("<em>Note</em>");
    expect(html).toContain(`padding-top:${tokens.layout.buttonSubtitlePadTop}px`);
  });

  it("does not render subtitle row when subtitleHtml is absent", () => {
    const html = tmpl.buttonBand({
      innerHtml: "Click",
      href: "https://example.com",
      bg: "#28b628",
    });
    expect(html).not.toContain(`padding-top:${tokens.layout.buttonSubtitlePadTop}px`);
  });

  it("radiusOverride=0 removes border-radius from button", () => {
    const html = tmpl.buttonBand({
      innerHtml: "Flat",
      href: "https://example.com",
      bg: "#0000ff",
      radius: 0,
    });
    expect(html).not.toContain("border-radius");
  });

  it("radiusOverride value overrides tok.button.radius", () => {
    const html = tmpl.buttonBand({
      innerHtml: "Round",
      href: "https://example.com",
      bg: "#0000ff",
      radius: 20,
    });
    expect(html).toContain("border-radius:20px");
  });
});

// ── baseStyle ─────────────────────────────────────────────────────────────────

describe("baseStyle", () => {
  it("includes font-family from tokens", () => {
    expect(baseStyle({}, tokens)).toContain(`font-family:${tokens.font.stack}`);
  });

  it("defaults to bodyPx font-size", () => {
    expect(baseStyle({}, tokens)).toContain(`font-size:${tokens.font.bodyPx}px`);
  });

  it("uses provided fontSize", () => {
    expect(baseStyle({ fontSize: 24 }, tokens)).toContain("font-size:24px");
  });

  it("defaults to text-align:left", () => {
    expect(baseStyle({}, tokens)).toContain("text-align:left");
  });

  it("uses provided align", () => {
    expect(baseStyle({ align: "center" }, tokens)).toContain("text-align:center");
  });

  it("defaults to font-weight:normal", () => {
    expect(baseStyle({}, tokens)).toContain("font-weight:normal");
  });

  it("uses provided fontWeight", () => {
    expect(baseStyle({ fontWeight: "bold" }, tokens)).toContain("font-weight:bold");
  });

  it("appends extraStyle at the end", () => {
    const result = baseStyle({ extraStyle: "padding-left:10px;" }, tokens);
    expect(result).toContain("padding-left:10px;");
  });
});

// ── blockRow ──────────────────────────────────────────────────────────────────

describe("blockRow", () => {
  it("wraps innerHtml in a <tr><td> structure", () => {
    const html = blockRow("CONTENT", {}, tokens);
    expect(html).toContain("<tr>");
    expect(html).toContain("<td");
    expect(html).toContain("CONTENT");
  });

  it("uses tok.layout.blockPadY as default padY", () => {
    const html = blockRow("x", {}, tokens);
    expect(html).toContain(`padding-top:${tokens.layout.blockPadY}px`);
    expect(html).toContain(`padding-bottom:${tokens.layout.blockPadY}px`);
  });

  it("uses custom padY when provided", () => {
    const html = blockRow("x", { padY: 30 }, tokens);
    expect(html).toContain("padding-top:30px");
    expect(html).toContain("padding-bottom:30px");
  });

  it("uses tok.tags.bold wrapper when fontWeight=bold", () => {
    const html = blockRow("x", { fontWeight: "bold" }, tokens);
    expect(html).toContain(`<${tokens.tags.bold}`);
  });

  it("uses tok.tags.blockWrap wrapper when fontWeight is not bold", () => {
    const html = blockRow("x", { fontWeight: "normal" }, tokens);
    expect(html).toContain(`<${tokens.tags.blockWrap}`);
  });
});
