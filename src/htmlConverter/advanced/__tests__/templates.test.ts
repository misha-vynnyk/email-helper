import { baseStyle, blockRow,buildTemplates } from "../config/templates";
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
  // Fix #5: gridBorder is computed from recordBorderPx + tableBorder (no separate token)
  it("statsGrid border matches tok.color.tableBorder", () => {
    const html = tmpl.statsGrid([{ innerHtml: "a" }, { innerHtml: "b" }], { n: 2 });
    expect(html).toContain(tokens.color.tableBorder);
  });

  it("custom tableBorder color is reflected in statsGrid", () => {
    const tok = mergeTokens(tokens, { color: { tableBorder: "#aabbcc" } });
    const html = buildTemplates(tok).statsGrid([{ innerHtml: "a" }, { innerHtml: "b" }], { n: 2 });
    expect(html).toContain("#aabbcc");
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

  it("uses default calloutBg when bg not specified", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc" });
    expect(html).toContain(tokens.color.calloutBg);
  });

  it("uses custom bg when provided", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#aabbcc", bg: "#fff3cd" });
    expect(html).toContain("#fff3cd");
    expect(html).not.toContain(tokens.color.calloutBg);
  });
});

// ── image template ────────────────────────────────────────────────────────────

describe("buildTemplates — image", () => {
  it("renders img wrapped in a placeholder link (matches simple wrapImg)", () => {
    const html = tmpl.image({ src: "https://cdn.example.com/pic.png", alt: "Promo" });
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
    expect(html).toContain('src="https://cdn.example.com/pic.png"');
    expect(html).toContain('alt="Promo"');
    expect(html).toContain(`class="${tokens.classes.imgBg}"`);
  });

  it("width equals containerMaxWidth − 2×sidePadding (560 by default)", () => {
    const html = tmpl.image({ src: "x.png" });
    const w = tokens.layout.containerMaxWidth - 2 * tokens.layout.sidePadding;
    expect(html).toContain(`width="${w}"`);
    expect(html).toContain(`max-width:${w}px`);
  });

  it("falls back to alt=\"Image\" when alt is absent", () => {
    const html = tmpl.image({ src: "x.png" });
    expect(html).toContain('alt="Image"');
  });

  it("escapes quotes in src and alt attributes", () => {
    const html = tmpl.image({ src: 'x.png" onerror="alert(1)', alt: '"><script>' });
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).not.toContain("<script>");
  });

  it("uses tok.layout.blockPadY for outer padding", () => {
    const html = tmpl.image({ src: "x.png" });
    expect(html).toContain(`padding-top:${tokens.layout.blockPadY}px`);
    expect(html).toContain(`padding-bottom:${tokens.layout.blockPadY}px`);
  });

  it("profile override of sidePadding changes rendered width", () => {
    const tok = mergeTokens(tokens, { layout: { sidePadding: 30 } });
    const html = buildTemplates(tok).image({ src: "x.png" });
    expect(html).toContain(`width="${tok.layout.containerMaxWidth - 60}"`);
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
