import { buildTemplates } from "../config/templates";
import { mergeTokens,tokens } from "../config/tokens";
import type { ComponentNode,Run } from "../ir/types";
import { renderLines, renderNode,renderRuns } from "../render/toEmailHtml";

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

  it("renders href as <a> with placeholder href + full link style", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com" }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`href="${tokens.placeholderHref}"`);
    expect(result).toContain(tokens.color.link);
    expect(result).toContain(`font-weight:${tokens.font.linkWeight}`);
    expect(result).toContain(`text-decoration:${tokens.font.linkDecoration}`);
    expect(result).toContain(tokens.font.stack);
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

  it("blocks JAVASCRIPT: uppercase href", () => {
    const runs: Run[] = [{ text: "evil", href: "JAVASCRIPT:alert(1)" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
    expect(result).toContain("evil");
  });

  it("blocks javascript: with leading whitespace", () => {
    const runs: Run[] = [{ text: "evil", href: "   javascript:alert(1)" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
  });

  it("empty href is treated as no href (no <a> rendered)", () => {
    const runs: Run[] = [{ text: "link", href: "" }];
    const result = renderRuns(runs, tokens);
    // run.href is falsy — skips the href branch entirely
    expect(result).not.toContain("<a");
    expect(result).toBe("link");
  });

  it("allows fragment-only href (#section)", () => {
    const runs: Run[] = [{ text: "jump", href: "#section" }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("<a");
  });

  it("blocks DATA: uppercase href", () => {
    const runs: Run[] = [{ text: "evil", href: "DATA:text/html,<h1>xss</h1>" }];
    const result = renderRuns(runs, tokens);
    expect(result).not.toContain("<a");
  });

  it("href+bold: all links get font-weight from tokens, no outer <b> wrapper", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com", bold: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("<a href=");
    expect(result).toContain(`font-weight:${tokens.font.linkWeight}`);
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

  it("href with run.color uses run.color as link color, not tok.color.link", () => {
    const runs: Run[] = [{ text: "click", href: "https://example.com", color: "#cc0000" }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain("color:#cc0000");
    expect(result).toContain(`href="${tokens.placeholderHref}"`);
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

  it("bold+italic → single <b style=font-style:italic>, no nesting", () => {
    const runs: Run[] = [{ text: "bi", bold: true, italic: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<b style="font-style:italic;">`);
    expect(result).not.toContain(`<em>`);
  });

  it("bold+italic+underline → single <b style=font-style:italic;text-decoration:underline>", () => {
    const runs: Run[] = [{ text: "biu", bold: true, italic: true, underline: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<b style="font-style:italic;text-decoration:underline;">`);
    expect(result).not.toContain(`<em>`);
    expect(result).not.toContain(`<u>`);
  });

  it("italic+underline → single <em style=text-decoration:underline>, no nesting", () => {
    const runs: Run[] = [{ text: "iu", italic: true, underline: true }];
    const result = renderRuns(runs, tokens);
    expect(result).toContain(`<em style="text-decoration:underline;">`);
    expect(result).not.toContain(`<u>`);
  });

  it("respects custom tags from tok", () => {
    const customTok = mergeTokens(tokens, { tags: { bold: "strong", italic: "i", underline: "u", colorWrap: "span" } });
    const runs: Run[] = [{ text: "bold", bold: true }];
    expect(renderRuns(runs, customTok)).toContain("<strong>");
  });
});

// ── renderLines ───────────────────────────────────────────────────────────────

describe("renderLines", () => {
  it("joins lines within a paragraph with single <br> closing the line", () => {
    // Within-paragraph <br> (no paraBreaks) → single <br> at end of line
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }]];
    const result = renderLines(lines, tokens);
    expect(result).toBe("a <br>\nb");
  });

  it("uses <br><br> on its own line at paragraph boundaries (paraBreaks set)", () => {
    // Second line starts a new paragraph (index 1 in paraBreaks)
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }]];
    const result = renderLines(lines, tokens, undefined, new Set([1]));
    expect(result).toBe("a\n<br><br>\nb");
  });

  it("mixes single and double <br> based on paraBreaks", () => {
    // lines[0]='a', lines[1]='b' (within para), lines[2]='c' (new para)
    const lines: Run[][] = [[{ text: "a" }], [{ text: "b" }], [{ text: "c" }]];
    const result = renderLines(lines, tokens, undefined, new Set([2]));
    expect(result).toBe("a <br>\nb\n<br><br>\nc");
  });

  it("skips empty lines", () => {
    const lines: Run[][] = [[{ text: "a" }], [], [{ text: "b" }]];
    const result = renderLines(lines, tokens);
    expect(result).toBe("a <br>\nb");
  });
});

// ── renderNode — paragraph ────────────────────────────────────────────────────

describe("renderNode — paragraph", () => {
  function makeParagraph(size: "body" | "small" | "headline", align: "left" | "center" = "left", extra: Record<string, unknown> = {}): ComponentNode {
    return { kind: "paragraph", props: { lines: [[{ text: "text" }]], size, align, ...extra } };
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

  // h1 marker: headline must be bold (matches simple converter behavior)
  it("headline paragraph renders as bold", () => {
    const result = renderNode(makeParagraph("headline"), tmpl, tokens);
    expect(result).toContain("font-weight:bold");
  });

  // body/small paragraphs must NOT be bold
  it("body paragraph is not bold", () => {
    const result = renderNode(makeParagraph("body"), tmpl, tokens);
    expect(result).not.toContain("font-weight:bold");
  });

  // h4 marker: quote variant adds horizontal padding
  it("quote variant adds quotePadX horizontal padding", () => {
    const result = renderNode(makeParagraph("body", "left", { variant: "quote" }), tmpl, tokens);
    expect(result).toContain(`padding-left:${tokens.layout.quotePadX}px`);
    expect(result).toContain(`padding-right:${tokens.layout.quotePadX}px`);
  });

  // plain paragraph must NOT have quote padding
  it("plain paragraph has no extra horizontal padding", () => {
    const result = renderNode(makeParagraph("body"), tmpl, tokens);
    expect(result).not.toContain(`padding-left:${tokens.layout.quotePadX}px`);
  });
});

// ── renderNode — calloutBox ────────────────────────────────────────────────────
// A bordered box with a single plain-text paragraph (the common case — a note/callout
// with no nested button) must not nest a second <table> just to hold that one row.

describe("renderNode — calloutBox", () => {
  function makeBox(children: ComponentNode[]): ComponentNode {
    return { kind: "calloutBox", props: { border: { top: { color: "#c2410c" } } }, children };
  }

  it("single plain (body, no variant) paragraph child skips the inner rows table", () => {
    const node = makeBox([{ kind: "paragraph", props: { lines: [[{ text: "Note text" }]], size: "body" } }]);
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("Note text");
    expect((result.match(/<table/g) ?? []).length).toBe(1);
  });

  // Regression: this flattened shortcut's <td style> used to hold bare text with no
  // wrapping <span> — same client font-inheritance reasoning as recordRow/statsGrid.
  it("wraps the flattened shortcut's text in a font-styled <span>", () => {
    const node = makeBox([{ kind: "paragraph", props: { lines: [[{ text: "Note text" }]], size: "body" } }]);
    const result = renderNode(node, tmpl, tokens);
    expect(result).toMatch(/<span style="font-family:[^"]*">\s*Note text\s*<\/span>/);
  });

  it("multiple children still use the general children-recursion path (nested table)", () => {
    const node = makeBox([
      { kind: "paragraph", props: { lines: [[{ text: "Line one" }]], size: "body" } },
      { kind: "paragraph", props: { lines: [[{ text: "Line two" }]], size: "body" } },
    ]);
    const result = renderNode(node, tmpl, tokens);
    expect((result.match(/<table/g) ?? []).length).toBe(2);
  });

  it("a nested buttonBand child still uses the general children-recursion path (F10)", () => {
    const node = makeBox([
      { kind: "buttonBand", props: { runs: [{ text: "Click" }], href: "urlhere", bg: "#111111" } },
    ]);
    const result = renderNode(node, tmpl, tokens);
    // Box table + children-rows table + buttonTableHtml's own table = 3, not the
    // 1-table flattened shortcut — the button must not be silently dropped/flattened.
    expect((result.match(/<table/g) ?? []).length).toBe(3);
    expect(result).toContain("bgcolor=\"#111111\"");
  });

  it("a headline-size single child does not take the flattened shortcut", () => {
    const node = makeBox([{ kind: "paragraph", props: { lines: [[{ text: "Big" }]], size: "headline" } }]);
    const result = renderNode(node, tmpl, tokens);
    expect((result.match(/<table/g) ?? []).length).toBe(2);
  });

  // Regression, Ітерація 7 (fix-advanced.md): the flattened shortcut used to render via a
  // bare renderLines — align was never read (hardcoded to "left" in tmpl.calloutBox) and any
  // attached list (ParagraphProps.lists) vanished entirely.
  it("preserves a centered single paragraph's alignment (not hardcoded left)", () => {
    const node = makeBox([{ kind: "paragraph", props: { lines: [[{ text: "Centered note" }]], size: "body", align: "center" } }]);
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain('align="center"');
    expect(result).not.toContain('align="left"');
    // Regression: the HTML `align` attribute alone isn't enough — most email clients honor
    // the CSS text-align on the inner <td style>, which used to stay hardcoded to "left"
    // even when the align attribute above was correctly "center".
    expect(result).toContain("text-align:center");
    expect(result).not.toContain("text-align:left");
  });

  it("keeps an attached list on the single-paragraph shortcut, instead of dropping it", () => {
    const node = makeBox([{
      kind: "paragraph",
      props: {
        lines: [[{ text: "Intro:" }]],
        size: "body",
        lists: [{ atLine: 1, props: { items: [[{ text: "Item A" }], [{ text: "Item B" }]], ordered: false } }],
      },
    }]);
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("<ul");
    expect(result).toContain("<li>Item A</li>");
    expect(result).toContain("<li>Item B</li>");
    expect(result).toContain("Intro:");
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

  // Regression: each cell's <td style> used to hold bare text with no wrapping <span> —
  // some clients don't reliably inherit font styles from the <td> onto its text content,
  // same reasoning already covered for recordRow (see e2e.test.ts's "wraps cell text in a
  // font-styled <span>" test).
  it("wraps cell text in a font-styled <span>, matching the recordRow convention", () => {
    const html = renderNode(makeGrid(2), tmpl, tokens);
    expect(html).toMatch(/<span style="font-family:[^"]*">\s*cell0\s*<\/span>/);
  });
});

// ── renderNode — splitRow ──────────────────────────────────────────────────────

describe("renderNode — splitRow", () => {
  it("renders left/right cells with the right cell in a nested align=right table", () => {
    const node: ComponentNode = {
      kind: "splitRow",
      props: {
        left: [{ text: "immersed", bold: true, color: "#111827" }],
        right: [{ text: "MEDIA & INVESTOR RELATIONS", bold: true, color: "#6b7280" }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain('<td align="right">');
    expect(html).toContain('<table align="right"');
    expect(html).toContain('<b style="color:#111827;">immersed</b>');
    expect(html).toContain('<b style="color:#6b7280;">MEDIA &amp; INVESTOR RELATIONS</b>');
    // Both cells share the same left-aligned text style (on both <td> and inner <span>) —
    // the right cell is positioned via the nested table's align="right", not text-align.
    expect((html.match(/text-align:left/g) ?? []).length).toBe(4);
  });

  it("plain (non-bold, no color) runs render as bare text, no <b>/<span> wrapper", () => {
    const node: ComponentNode = {
      kind: "splitRow",
      props: { left: [{ text: "Name" }], right: [{ text: "Role" }] },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain(">Name<");
    expect(html).toContain(">Role<");
    expect(html).not.toContain("<b>Name</b>");
    expect(html).not.toContain("<b>Role</b>");
  });

  it("a right-cell href renders as a placeholder-href <a>, not a <b>", () => {
    const node: ComponentNode = {
      kind: "splitRow",
      props: {
        left: [{ text: "Name" }],
        right: [{ text: "Learn more", href: "https://example.com" }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
    expect(html).toContain(">Learn more</a>");
  });

  it("empty left/right run lists still produce a valid row (no crash)", () => {
    const node: ComponentNode = { kind: "splitRow", props: { left: [], right: [] } };
    expect(() => renderNode(node, tmpl, tokens)).not.toThrow();
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain('<table align="right"');
  });

  it("multi-run left cell (mixed plain + bold) concatenates correctly", () => {
    const node: ComponentNode = {
      kind: "splitRow",
      props: {
        left: [{ text: "Jane Doe, " }, { text: "CEO", bold: true }],
        right: [{ text: "Q3 2026" }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain("Jane Doe, <b>CEO</b>");
  });
});

// ── renderNode — statsGrid highlighted cell (per-cell bg) ─────────────────────

describe("renderNode — statsGrid with per-cell background", () => {
  it("carries child bg through to the rendered cell", () => {
    const node: ComponentNode = {
      kind: "statsGrid",
      props: { n: 2 },
      children: [
        { kind: "paragraph", props: { lines: [[{ text: "plain" }]], size: "small", align: "center" } },
        { kind: "paragraph", props: { lines: [[{ text: "$0.50" }]], size: "small", align: "center", bg: "#0a2463" } },
      ],
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain('bgcolor="#0a2463"');
    expect(result).toContain("$0.50");
  });

  it("implicit (non-colored) text on a dark cell renders white for legibility", () => {
    const node: ComponentNode = {
      kind: "statsGrid",
      props: { n: 1 },
      children: [
        { kind: "paragraph", props: { lines: [[{ text: "Until May 29" }]], size: "small", align: "center", bg: "#0a2463" } },
      ],
    };
    const result = renderNode(node, tmpl, tokens);
    // baseColor flips to white on dark bg, so plain (uncolored) text renders inside white-styled markup
    expect(result).toContain(tokens.color.white);
  });

  it("cell without bg renders with no bgcolor attribute", () => {
    const node: ComponentNode = {
      kind: "statsGrid",
      props: { n: 1 },
      children: [
        { kind: "paragraph", props: { lines: [[{ text: "plain" }]], size: "small", align: "center" } },
      ],
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).not.toContain("bgcolor=");
  });
});

// ── renderNode — alertBand text color ─────────────────────────────────────────

describe("renderNode — alertBand", () => {
  it("uses white text on dark background", () => {
    const node: ComponentNode = { kind: "alertBand", props: { lines: [[{ text: "hi" }]], bg: "#000000" } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(tokens.color.white);
    expect(result).toContain("#000000");
  });

  it("uses black text on light background", () => {
    const node: ComponentNode = { kind: "alertBand", props: { lines: [[{ text: "hi" }]], bg: "#ffeeee" } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(tokens.color.black);
  });

  // Fix #3: dark bg + cell border must not be dropped on the way to the template
  it("passes border through to the template", () => {
    const node: ComponentNode = {
      kind: "alertBand",
      props: { lines: [[{ text: "hi" }]], bg: "#000000", border: { top: { color: "#ffffff" } } },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("border-top:");
  });

  // Multi-line alertBand (e.g. a promo box with a headline, an inline "fake link" line,
  // and a footer line) must preserve line breaks instead of gluing everything together.
  it("preserves paragraph breaks across multiple lines", () => {
    const node: ComponentNode = {
      kind: "alertBand",
      props: {
        lines: [[{ text: "Headline" }], [{ text: "Footer" }]],
        paraBreaks: new Set([1]),
        bg: "#000000",
      },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("Headline");
    expect(result).toContain("Footer");
    expect(result).toContain("<br><br>");
  });

  // Regression: the plain-text (non-segments) path's <td style> used to hold bare text
  // with no wrapping <span> — same client font-inheritance reasoning as recordRow/statsGrid.
  it("wraps its text in a font-styled <span>, matching the recordRow/statsGrid convention", () => {
    const node: ComponentNode = { kind: "alertBand", props: { lines: [[{ text: "hi" }]], bg: "#000000" } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toMatch(/<span style="font-family:[^"]*">\s*hi\s*<\/span>/);
  });
});

// ── renderNode — image ────────────────────────────────────────────────────────

describe("renderNode — image", () => {
  it("renders an img row with the source URL and alt", () => {
    const node: ComponentNode = {
      kind: "image",
      props: { src: "https://lh7.googleusercontent.com/abc", alt: "Chart" },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain('src="https://lh7.googleusercontent.com/abc"');
    expect(result).toContain('alt="Chart"');
    expect(result).toContain(`href="${tokens.placeholderHref}"`);
  });

  it("returns empty string when src is missing", () => {
    // Malformed node (src is required by ImageProps) — cast to exercise the
    // runtime src guard that shields render from IR built outside the type system.
    const node = { kind: "image", props: {} } as unknown as ComponentNode;
    expect(renderNode(node, tmpl, tokens)).toBe("");
  });
});

// ── renderNode — spacer ───────────────────────────────────────────────────────

describe("renderNode — spacer", () => {
  it("renders a spacer row with the given heightPx", () => {
    const node: ComponentNode = { kind: "spacer", props: { heightPx: 32 } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain('height="32"');
  });

  it("heightPx=0 falls back to default — `| 0` makes 0 indistinguishable from missing", () => {
    // `((heightPx | 0) || spacerPx)` coerces both undefined and 0 to falsy 0
    const node: ComponentNode = { kind: "spacer", props: { heightPx: 0 } };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(`height="${tokens.layout.spacerPx}"`);
  });

  it("falls back to tok.layout.spacerPx when heightPx is absent", () => {
    const node: ComponentNode = { kind: "spacer", props: {} };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(`height="${tokens.layout.spacerPx}"`);
  });
});

// ── renderNode — calloutLeft ──────────────────────────────────────────────────

describe("renderNode — calloutLeft", () => {
  it("renders runs with left accent border", () => {
    const node: ComponentNode = {
      kind: "calloutLeft",
      props: { lines: [[{ text: "tip" }]], accentColor: "#ff9900" },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("tip");
    expect(result).toContain("#ff9900");
    expect(result).toContain("border-left:");
  });

  // Regression: the plain-text (non-segments) path's <td style> used to hold bare text
  // with no wrapping <span> — same client font-inheritance reasoning as recordRow/statsGrid.
  it("wraps its text in a font-styled <span>, matching the recordRow/statsGrid convention", () => {
    const node: ComponentNode = {
      kind: "calloutLeft",
      props: { lines: [[{ text: "tip" }]], accentColor: "#ff9900" },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toMatch(/<span style="font-family:[^"]*">\s*tip\s*<\/span>/);
  });
});

// ── renderNode — textDivider ──────────────────────────────────────────────────

describe("renderNode — textDivider", () => {
  it("renders plain flowing text followed by a border-bottom rule row, no boxing/<hr>", () => {
    const node: ComponentNode = {
      kind: "textDivider",
      props: { lines: [[{ text: "eyebrow copy" }]], ruleColor: "#111111" },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("eyebrow copy");
    expect(result).toContain("border-bottom:1px solid #111111;");
    expect(result).not.toContain("<hr");
    expect(result).not.toContain("padding-left:");
  });
});

// ── renderNode — buttonBand ───────────────────────────────────────────────────

describe("renderNode — buttonBand", () => {
  it("renders button text and placeholder href", () => {
    const node: ComponentNode = {
      kind: "buttonBand",
      props: {
        runs: [{ text: "Click me" }],
        href: "https://example.com",
        bg: "#28b628",
      },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("Click me");
    expect(result).toContain("https://example.com");
  });

  it("uses dark bg → white text color for button runs", () => {
    const node: ComponentNode = {
      kind: "buttonBand",
      props: { runs: [{ text: "Go" }], href: "http://x.com", bg: "#000000" },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain(tokens.color.white);
  });

  // Fix #3: dark bg + cell border must not be dropped on the way to the template
  it("passes border through to the template", () => {
    const node: ComponentNode = {
      kind: "buttonBand",
      props: { runs: [{ text: "Go" }], href: "http://x.com", bg: "#000000", border: { left: { color: "#ff0000" } } },
    };
    const result = renderNode(node, tmpl, tokens);
    expect(result).toContain("border-left:");
    expect(result).toContain("#ff0000");
  });

  // Note: the former `label` fallback and the `subtitleHtml` pass-through tests were
  // removed — ButtonBandProps now requires `runs` and has no `label`/`subtitleHtml`
  // fields, so both behaviors are guaranteed by the type system at the classify→render
  // boundary. Subtitle rendering is still covered at the template level in templates.test.
});

// ── renderNode — unknown kind returns empty string ────────────────────────────

describe("renderNode — unknown kind", () => {
  it("returns empty string for unhandled component kind", () => {
    const node = { kind: "nonexistent", props: {} } as unknown as ComponentNode;
    const result = renderNode(node, tmpl, tokens);
    expect(result).toBe("");
  });
});

// ── renderLines — edge cases ──────────────────────────────────────────────────

describe("renderLines — edge cases", () => {
  it("returns empty string for empty lines array", () => {
    expect(renderLines([], tokens)).toBe("");
  });

  it("returns empty string when all lines are empty", () => {
    const lines: Run[][] = [[], [], []];
    expect(renderLines(lines, tokens)).toBe("");
  });
});

// ── renderNode — alertBand with nested bands (F10) ────────────────────────────

describe("renderNode — alertBand nested bands", () => {
  it("renders a nested band as its own colored row inside the outer band", () => {
    const node: ComponentNode = {
      kind: "alertBand",
      props: {
        lines: [[{ text: "SERIES A · REG A+" }]],
        bg: "#000000",
        bands: [{ atLine: 1, props: { lines: [[{ text: "INVEST AT $0.50 →" }]], bg: "#0a2463" } }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain('bgcolor="#0a2463"');
    expect(html).toContain("INVEST AT $0.50");
    // Dark inner band → white text td style present on the band row
    expect(html).toContain("SERIES A");
  });

  it("keeps the double-nested band's own buttons as button rows", () => {
    const node: ComponentNode = {
      kind: "alertBand",
      props: {
        lines: [[{ text: "HEAD" }]],
        bg: "#000000",
        bands: [{
          atLine: 1,
          props: {
            lines: [[{ text: "BAND TEXT" }]],
            bg: "#0a2463",
            buttons: [{ atLine: 1, props: { runs: [{ text: "GO" }], href: "urlhere", bg: "#28b628" } }],
          },
        }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain("BAND TEXT");
    expect(html).toContain("GO");
    expect(html).toContain('bgcolor="#28b628"');
  });
});

// ── renderNode — nested button run color (real <a> vs plain colored span) ────
// A run inside a nested h5-button carries the browser's default link-blue only when it
// came from a real <a href> — that's an artifact of it being a link, not a color the
// author chose, and must be stripped in favor of the button's own contrast color. A plain
// colored span with no href (e.g. a hand-picked white-on-orange CTA) is a deliberate
// choice and must survive.

describe("renderNode — alertBand/calloutLeft nested button run color", () => {
  it("strips the run's color when it came from a real href (link-blue artifact)", () => {
    const node: ComponentNode = {
      kind: "calloutLeft",
      props: {
        lines: [[{ text: "Intro" }]],
        accentColor: "#38a169",
        buttons: [{
          atLine: 1,
          props: { runs: [{ text: "Watch", color: "#1155cc", underline: true, href: "https://x.com" }], href: "urlhere", bg: "#38a169" },
        }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).not.toContain("#1155cc");
    expect(html).toContain(tokens.color.white);
  });

  it("keeps a plain colored span's color when it has no href (deliberate author choice)", () => {
    const node: ComponentNode = {
      kind: "alertBand",
      props: {
        lines: [[{ text: "Intro" }]],
        bg: "#000000",
        buttons: [{
          atLine: 1,
          props: { runs: [{ text: "Lock In", color: "#ffffff" }], href: "urlhere", bg: "#e07b39" },
        }],
      },
    };
    const html = renderNode(node, tmpl, tokens);
    expect(html).toContain("#ffffff");
  });
});
