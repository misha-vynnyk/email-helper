import { buildTemplates } from "../config/templates";
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
    expect(html).not.toMatch(/href="[^"]*&[^a][^m]/);
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
