import { buildTemplates, baseStyle, blockRow } from "../config/templates";
import { tokens, mergeTokens } from "../config/tokens";
import { profile as tttProfile } from "../profiles/ttt";
import { profile as alphaoneProfile } from "../profiles/alphaone";

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
    const html = tmpl.statsGrid(["a", "b"], { n: 2 });
    expect(html).toContain(tokens.color.tableBorder);
  });

  it("custom tableBorder color is reflected in statsGrid", () => {
    const tok = mergeTokens(tokens, { color: { tableBorder: "#aabbcc" } });
    const html = buildTemplates(tok).statsGrid(["a", "b"], { n: 2 });
    expect(html).toContain("#aabbcc");
  });
});

// ── calloutBox ────────────────────────────────────────────────────────────────

describe("buildTemplates — calloutBox", () => {
  it("uses full border (border: N px solid color), not just border-left", () => {
    const html = tmpl.calloutBox("content", { accentColor: "#ff9900" });
    expect(html).toContain("content");
    expect(html).toMatch(/border:\d+px solid #ff9900/);
    expect(html).not.toMatch(/border-left:/);
  });

  it("uses calloutBoxBorderPx from tokens", () => {
    const html = tmpl.calloutBox("x", { accentColor: "#ff9900" });
    expect(html).toContain(`${tokens.layout.calloutBoxBorderPx}px solid`);
  });

  it("uses default calloutBg when bg not specified", () => {
    const html = tmpl.calloutBox("x", { accentColor: "#aabbcc" });
    expect(html).toContain(tokens.color.calloutBg);
  });

  it("uses custom bg when provided", () => {
    const html = tmpl.calloutBox("x", { accentColor: "#aabbcc", bg: "#fff3cd" });
    expect(html).toContain("#fff3cd");
    expect(html).not.toContain(tokens.color.calloutBg);
  });

  it("calloutLeft uses border-left, not full border", () => {
    const html = tmpl.calloutLeft("x", { accentColor: "#ff9900" });
    expect(html).toMatch(/border-left:\d+px solid/);
    expect(html).not.toMatch(/border:\d+px solid/);
  });
});

// ── divider template ──────────────────────────────────────────────────────────

describe("buildTemplates — divider", () => {
  it("renders a table row with border-top matching the given color", () => {
    const html = tmpl.divider({ color: "#cccccc" });
    expect(html).toContain("border-top:");
    expect(html).toContain("#cccccc");
  });

  it("uses tok.layout.dividerPx for border width", () => {
    const html = tmpl.divider({ color: "#000000" });
    expect(html).toContain(`${tokens.layout.dividerPx}px solid`);
  });

  it("custom dividerPx is reflected", () => {
    const tok = mergeTokens(tokens, { layout: { dividerPx: 3 } });
    const html = buildTemplates(tok).divider({ color: "#333333" });
    expect(html).toContain("3px solid");
  });

  it("uses tok.layout.blockPadY for outer padding", () => {
    const html = tmpl.divider({ color: "#000000" });
    expect(html).toContain(`padding-top:${tokens.layout.blockPadY}px`);
    expect(html).toContain(`padding-bottom:${tokens.layout.blockPadY}px`);
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
