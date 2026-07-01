import { renderRuns, renderLines, renderNode } from "../render/toEmailHtml";
import { tokens, mergeTokens } from "../config/tokens";
import { buildTemplates } from "../config/templates";
import type { Run, ComponentNode } from "../ir/types";

const tmpl = buildTemplates(tokens);

// ── renderRuns ────────────────────────────────────────────────────────────────

describe("renderRuns", () => {
  it("renders plain text", () => {
    const runs: Run[] = [{ text: "hello" }];
    expect(renderRuns(runs, tokens)).toBe("hello");
  });

  it("escapes HTML special chars in text", () => {
    const runs: Run[] = [{ text: '<script>alert("xss")</script>' }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("wraps bold in tok.tags.bold element", () => {
    const runs: Run[] = [{ text: "bold", bold: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<${tokens.tags.bold}>`);
    expect(result).toContain(`</${tokens.tags.bold}>`);
  });

  it("wraps italic in tok.tags.italic element", () => {
    const runs: Run[] = [{ text: "italic", italic: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<${tokens.tags.italic}>`);
  });

  it("wraps underline in tok.tags.underline element (non-href)", () => {
    const runs: Run[] = [{ text: "under", underline: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<${tokens.tags.underline}>`);
  });

  it("renders href as <a> tag with tok.color.link", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com" }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("<a href=");
    expect(result).toContain("https://example.com");
    expect(result).toContain(tokens.color.link);
  });

  // Fix #7: unsafe URIs must not produce <a> tags
  it("blocks javascript: href — renders as plain text", () => {
    const runs: Run[] = [{ text: "evil", href: "javascript:alert(1)" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
    expect(result).toContain("evil");
  });

  it("blocks data: href", () => {
    const runs: Run[] = [{ text: "evil", href: "data:text/html,<h1>xss</h1>" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
  });

  it("blocks vbscript: href", () => {
    const runs: Run[] = [{ text: "evil", href: "vbscript:msgbox(1)" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
  });

  it("href+bold: bold applied as font-weight inside <a>, no outer <b> wrapper", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com", bold: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("<a href=");
    expect(result).toContain("font-weight:bold");
    // no <b> element wrapping the <a>
    expect(result).not.toMatch(/<b[^>]*><a/);
    expect(result).not.toMatch(/<\/a><\/b>/);
  });

  it("href+italic: <em> wraps text inside <a>, not outside", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com", italic: true }];
    const result = renderRuns(runs, tokens);
    // <em> must be inside the <a>, not wrapping it
    expect(result).toMatch(/<a[^>]+><em>click<\/em><\/a>/);
    expect(result).not.toMatch(/<em><a/);
  });

  it("href with run.color uses run.color, not tok.color.link", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com", color: "#cc0000" }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("color:#cc0000");
    expect(result).toContain("<a href=");
  });

  it("omits color tag when run.color matches baseColor", () => {
    const runs: Run[] = [{ text: "same", color: "#000000" }];
    const result = renderRuns(runs, tokens, "#000000");
    expect(result).not.toContain("style=");
    expect(result).toBe("same");
  });

  it("adds color tag when run.color differs from baseColor", () => {
    const runs: Run[] = [{ text: "red", color: "#cc0000" }];
    const result = renderRuns(runs, tokens, "#000000");
    expect(result).toContain("color:#cc0000");
  });

  it("bold with color produces <b style=color:...>", () => {
    const runs: Run[] = [{ text: "colored bold", bold: true, color: "#cc0000" }];
    const result = renderRuns(runs, tokens, "#000000");
    expect(result).toMatch(/<b style="color:#cc0000;">/);
  });

  it("respects custom tags from tok", () => {
    const customTok = mergeTokens(tokens, { tags: { bold: "strong", italic: "i", underline: "u", colorWrap: "span" } });
    const runs: Run[] = [{ text: "bold", bold: true }];
    expect(renderRuns(runs, customTok)).toContain("<strong>");
  });
});

// ── renderLines ───────────────────────────────────────────────────────────────

describe("renderLines", () => {
  it("joins lines within a paragraph with single <br>", () => {
    // Within-paragraph <br> (no paraBreaks) → single <br>
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }]];
    const result = renderLines(lines, tokens);
    expect(result).toBe("a<br>\nb");
  });

  it("uses <br><br> at paragraph boundaries (paraBreaks set)", () => {
    // Second line starts a new paragraph (index 1 in paraBreaks)
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }]];
    const result = renderLines(lines, tokens, undefined, new Set([1]));
    expect(result).toBe("a<br><br>\nb");
  });

  it("mixes single and double <br> based on paraBreaks", () => {
    // lines[0]='a', lines[1]='b' (within para), lines[2]='c' (new para)
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }], [{ text: "c" }]];
    const result = renderLines(lines, tokens, undefined, new Set([2]));
    expect(result).toBe("a<br>\nb<br><br>\nc");
  });

  it("skips empty lines", () => {
    const lines: Run[][] = [[{ text: "a" }], [], [{ text: "b" }]];
    const result = renderLines(lines, tokens);
    expect(result).toBe("a<br>\nb");
  });
});

// ── renderNode — paragraph ────────────────────────────────────────────────────

describe("renderNode — paragraph", () => {
  function makeParagraph(size: "body" | "small" | "headline", align: "left" | "center" = "left"): ComponentNode {
    return { kind: "paragraph", props: { lines: [[{ text: "text" }]], size, align } };
  }

  it("body size uses tok.font.bodyPx", () => {
    const result = renderNode(makeParagraph("body"), tmpl, tokens);
    expect(result).toContain(`${tokens.font.bodyPx}px`);
  });

  it("headline size uses tok.font.headlinePx", () => {
    const result = renderNode(makeParagraph("headline"), tmpl, tokens);
    expect(result).toContain(`${tokens.font.headlinePx}px`);
  });

  it("small size uses tok.font.smallPx", () => {
    const result = renderNode(makeParagraph("small"), tmpl, tokens);
    expect(result).toContain(`${tokens.font.smallPx}px`);
  });

  it("center align is reflected in output", () => {
    const result = renderNode(makeParagraph("body", "center"), tmpl, tokens);
    expect(result).toContain("center");
  });
});

// ── renderNode — statsGrid width distribution ─────────────────────────────────

describe("renderNode — statsGrid", () => {
  function makeGrid(n: number): ComponentNode {
    return {
      kind: "statsGrid",
      props: { n },
      children: Array.from({ length: n }, (_, i) => ({
        kind: "paragraph" as const,
        props: { lines: [[{ text: `cell${i}` }]], size: "small", align: "center" },
      })),
    };
  }

  // Fix #10: widths must sum to 100%
  it("n=3: widths sum to 100% (33+33+34)", () => {
    const html = renderNode(makeGrid(3), tmpl, tokens);
    const widths = [...html.matchAll(/width="(\d+)%"/g)].map(m => parseInt(m[1]));
    const outerWidths = widths.filter(w => w < 100);
    const total = outerWidths.reduce((s, w) => s + w, 0);
    expect(total).toBe(100);
  });

  it("n=5: widths sum to 100%", () => {
    const html = renderNode(makeGrid(5), tmpl, tokens);
    const widths = [...html.matchAll(/width="(\d+)%"/g)].map(m => parseInt(m[1]));
    const outerWidths = widths.filter(w => w < 100);
    const total = outerWidths.reduce((s, w) => s + w, 0);
    expect(total).toBe(100);
  });

  it("n=7: widths sum to 100%", () => {
    const html = renderNode(makeGrid(7), tmpl, tokens);
    const widths = [...html.matchAll(/width="(\d+)%"/g)].map(m => parseInt(m[1]));
    const outerWidths = widths.filter(w => w < 100);
    const total = outerWidths.reduce((s, w) => s + w, 0);
    expect(total).toBe(100);
  });
});

// ── renderNode — alertBand text color ─────────────────────────────────────────

describe("renderNode — alertBand", () => {
  it("uses white text on dark background", () => {
    const node: ComponentNode = { kind: "alertBand", props: { runs: [{ text: "hi" }], bg: "#000000" } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(tokens.color.white);
    expect(result).toContain("#000000");
  });

  it("uses black text on light background", () => {
    const node: ComponentNode = { kind: "alertBand", props: { runs: [{ text: "hi" }], bg: "#ffeeee" } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(tokens.color.black);
  });
});
