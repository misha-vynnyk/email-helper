// Unit tests for ir/fromDom — covers paths not reached by e2e fixtures.
import { tokens } from "../config/tokens";
import { fromDom } from "../ir/fromDom";
import type { Paragraph, TableNode } from "../ir/types";

function parse(html: string): HTMLBodyElement {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return doc.body as HTMLBodyElement;
}

function nodes(html: string) {
  return fromDom(parse(html));
}

function firstParagraph(html: string): Paragraph {
  const result = nodes(html);
  const p = result.find((n) => n.type === "p");
  if (!p) throw new Error(`No paragraph node in: ${html}`);
  return p as Paragraph;
}

// ── Heading size roles ────────────────────────────────────────────────────────

describe("fromDom — heading size roles", () => {
  it("H1 → size=headline", () => {
    expect(firstParagraph("<h1>Title</h1>").size).toBe("headline");
  });

  it("H2 → size=headline", () => {
    expect(firstParagraph("<h2>Title</h2>").size).toBe("headline");
  });

  it("H3 → size=body (not headline)", () => {
    expect(firstParagraph("<h3>Sub</h3>").size).toBe("body");
  });

  it("H4 → size=body (not headline)", () => {
    expect(firstParagraph("<h4>Quote</h4>").size).toBe("body");
  });

  it("H5 → size=small", () => {
    expect(firstParagraph("<h5>Small</h5>").size).toBe("small");
  });

  it("H6 → size=small", () => {
    expect(firstParagraph("<h6>Tiny</h6>").size).toBe("small");
  });

  it("P → size=body", () => {
    expect(firstParagraph("<p>Text</p>").size).toBe("body");
  });
});

// ── headingLevel property ─────────────────────────────────────────────────────

describe("fromDom — headingLevel", () => {
  it("H1 sets headingLevel=1", () => {
    expect(firstParagraph("<h1>Title</h1>").headingLevel).toBe(1);
  });

  it("H3 sets headingLevel=3", () => {
    expect(firstParagraph("<h3>Sub</h3>").headingLevel).toBe(3);
  });

  it("H5 sets headingLevel=5", () => {
    expect(firstParagraph("<h5>Small</h5>").headingLevel).toBe(5);
  });

  it("P has no headingLevel", () => {
    expect(firstParagraph("<p>Text</p>").headingLevel).toBeUndefined();
  });
});

// ── Inline tag: STRONG and I ──────────────────────────────────────────────────

describe("fromDom — STRONG and I inline tags", () => {
  it("STRONG tag → run.bold=true", () => {
    const p = firstParagraph("<p><strong>Bold text</strong></p>");
    expect(p.lines[0][0].bold).toBe(true);
    expect(p.lines[0][0].text).toBe("Bold text");
  });

  it("I tag → run.italic=true", () => {
    const p = firstParagraph("<p><i>Italic text</i></p>");
    expect(p.lines[0][0].italic).toBe(true);
    expect(p.lines[0][0].text).toBe("Italic text");
  });

  it("B tag → run.bold=true (existing behavior still works)", () => {
    const p = firstParagraph("<p><b>Bold</b></p>");
    expect(p.lines[0][0].bold).toBe(true);
  });

  it("EM tag → run.italic=true (existing behavior still works)", () => {
    const p = firstParagraph("<p><em>Italic</em></p>");
    expect(p.lines[0][0].italic).toBe(true);
  });

  it("STRONG + EM combination → bold and italic on same run", () => {
    const p = firstParagraph("<p><strong><em>Both</em></strong></p>");
    const run = p.lines[0][0];
    expect(run.bold).toBe(true);
    expect(run.italic).toBe(true);
  });

  it("U tag → run.underline=true", () => {
    const p = firstParagraph("<p><u>Underlined</u></p>");
    expect(p.lines[0][0].underline).toBe(true);
  });
});

// ── UL / OL lists ─────────────────────────────────────────────────────────────

describe("fromDom — UL list", () => {
  it("each <li> becomes a separate paragraph node", () => {
    const result = nodes("<ul><li>Apple</li><li>Banana</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs).toHaveLength(2);
  });

  it("first run of each <li> is the bullet prefix '• '", () => {
    const result = nodes("<ul><li>Apple</li><li>Banana</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs[0].lines[0][0].text).toBe("• ");
    expect(paragraphs[1].lines[0][0].text).toBe("• ");
  });

  it("li text content follows the bullet prefix", () => {
    const result = nodes("<ul><li>Apple</li></ul>");
    const p = result[0] as Paragraph;
    const lineText = p.lines[0].map((r) => r.text).join("");
    expect(lineText).toBe("• Apple");
  });
});

describe("fromDom — OL list", () => {
  it("each <li> becomes a separate paragraph node", () => {
    const result = nodes("<ol><li>First</li><li>Second</li><li>Third</li></ol>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs).toHaveLength(3);
  });

  it("first run of each <li> is the numbered prefix '1. ', '2. ', '3. '", () => {
    const result = nodes("<ol><li>First</li><li>Second</li><li>Third</li></ol>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs[0].lines[0][0].text).toBe("1. ");
    expect(paragraphs[1].lines[0][0].text).toBe("2. ");
    expect(paragraphs[2].lines[0][0].text).toBe("3. ");
  });

  it("OL and UL produce different prefixes", () => {
    const olNodes = nodes("<ol><li>item</li></ol>");
    const ulNodes = nodes("<ul><li>item</li></ul>");
    const olPrefix = (olNodes[0] as Paragraph).lines[0][0].text;
    const ulPrefix = (ulNodes[0] as Paragraph).lines[0][0].text;
    expect(olPrefix).toBe("1. ");
    expect(ulPrefix).toBe("• ");
  });
});

// ── Container elements (recursed) ─────────────────────────────────────────────

describe("fromDom — container elements", () => {
  const containerTags = ["div", "section", "article", "blockquote", "header", "footer", "figure", "main", "aside"];

  for (const tag of containerTags) {
    it(`<${tag}> is transparent — content is extracted`, () => {
      const result = nodes(`<${tag}><p>Inside ${tag}</p></${tag}>`);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("p");
      expect((result[0] as Paragraph).lines[0][0].text).toBe(`Inside ${tag}`);
    });
  }

  it("nested containers are fully unwrapped", () => {
    const result = nodes("<div><section><article><p>Deep</p></article></section></div>");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("p");
  });
});

// ── Empty / whitespace-only paragraphs ────────────────────────────────────────

describe("fromDom — empty paragraphs", () => {
  it("empty <p> is not pushed as a node", () => {
    const result = nodes("<p></p>");
    expect(result).toHaveLength(0);
  });

  it("whitespace-only <p> IS pushed (whitespace text is a valid run)", () => {
    // The code only skips paragraphs with zero runs; whitespace text "   " is a run
    const result = nodes("<p>   </p>");
    expect(result).toHaveLength(1);
    expect((result[0] as Paragraph).lines[0][0].text.trim()).toBe("");
  });

  it("<p> with only <br> is not pushed", () => {
    const result = nodes("<p><br /></p>");
    expect(result).toHaveLength(0);
  });

  it("non-empty <p> between two empty ones produces exactly one node", () => {
    const result = nodes("<p></p><p>Content</p><p></p>");
    expect(result).toHaveLength(1);
    expect((result[0] as Paragraph).lines[0][0].text).toBe("Content");
  });
});

// ── Top-level BR ──────────────────────────────────────────────────────────────

describe("fromDom — top-level BR", () => {
  it("top-level <br> is skipped, does not produce a node", () => {
    const result = nodes("<br /><p>Text</p><br />");
    expect(result).toHaveLength(1);
  });
});

// ── TABLE produces TableNode ──────────────────────────────────────────────────

describe("fromDom — TABLE", () => {
  it("produces a TableNode", () => {
    const result = nodes(`
      <table>
        <tr><td>Cell A</td><td>Cell B</td></tr>
      </table>
    `);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("table");
  });

  it("TableNode has correct row and cell count", () => {
    const result = nodes(`
      <table>
        <tr><td>A1</td><td>A2</td></tr>
        <tr><td>B1</td><td>B2</td></tr>
      </table>
    `);
    const table = result[0] as TableNode;
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0].cells).toHaveLength(2);
  });

  it("empty table (no rows) produces no node", () => {
    const result = nodes("<table></table>");
    expect(result).toHaveLength(0);
  });

  it("cell bg-color is normalized to canonical hex", () => {
    const result = nodes(`
      <table>
        <tr>
          <td style="background-color:#0a0a0a;">dark</td>
        </tr>
      </table>
    `);
    const table = result[0] as TableNode;
    // near-black → snapped to #000000 by canonicalizeBg
    expect(table.rows[0].cells[0].bg).toBe("#000000");
  });
});

// ── Whitespace text in link-colored span ──────────────────────────────────────

describe("fromDom — link-color span whitespace stripping", () => {
  it("whitespace-only text inside a link-colored span gets no href", () => {
    // #1155cc is a typical GDocs blue — isLinkColor returns true for it
    const p = firstParagraph('<p><span style="color:#1155cc;">  </span>real text</p>');
    // whitespace-only run must exist (collectRuns emits it) and must have no href
    const whitespaceRun = p.lines[0].find((r) => r.text.trim() === "");
    expect(whitespaceRun).toBeDefined();
    expect(whitespaceRun!.href).toBeUndefined();
    // real text (no color) has no href either
    const textRun = p.lines[0].find((r) => r.text === "real text");
    expect(textRun?.href).toBeUndefined();
  });

  it("non-whitespace text in a link-colored span gets placeholder href", () => {
    const p = firstParagraph('<p><span style="color:#1155cc;">Click here</span></p>');
    const run = p.lines[0].find((r) => r.text === "Click here");
    expect(run?.href).toBe(tokens.color.placeholderHref);
  });
});

// ── META, STYLE, SCRIPT are skipped ──────────────────────────────────────────

describe("fromDom — skipped tags at root level", () => {
  it("skips <meta> at root", () => {
    const result = nodes('<meta charset="utf-8" /><p>Text</p>');
    expect(result).toHaveLength(1);
  });

  it("skips <style> at root", () => {
    const result = nodes("<style>body { color: red; }</style><p>Text</p>");
    expect(result).toHaveLength(1);
  });

  it("skips <script> at root", () => {
    const result = nodes('<script>alert("xss")</script><p>Text</p>');
    expect(result).toHaveLength(1);
  });
});

// ── Multiple paragraphs and mixed content ────────────────────────────────────

describe("fromDom — multiple paragraphs", () => {
  it("preserves order of multiple block elements", () => {
    const result = nodes("<h1>Title</h1><p>Body</p><h5>Small</h5>");
    expect(result).toHaveLength(3);
    expect((result[0] as Paragraph).size).toBe("headline");
    expect((result[1] as Paragraph).size).toBe("body");
    expect((result[2] as Paragraph).size).toBe("small");
  });

  it("inline <br> inside a paragraph splits into multiple lines", () => {
    const p = firstParagraph("<p>Line one<br />Line two</p>");
    expect(p.lines).toHaveLength(2);
    expect(p.lines[0][0].text).toBe("Line one");
    expect(p.lines[1][0].text).toBe("Line two");
  });
});

// ── Paragraph align ───────────────────────────────────────────────────────────

describe("fromDom — paragraph alignment", () => {
  it("text-align:center sets align=center", () => {
    const p = firstParagraph('<p style="text-align:center;">Centered</p>');
    expect(p.align).toBe("center");
  });

  it("text-align:right sets align=right", () => {
    const p = firstParagraph('<p style="text-align:right;">Right</p>');
    expect(p.align).toBe("right");
  });

  it("no text-align → align is undefined", () => {
    const p = firstParagraph("<p>Default</p>");
    expect(p.align).toBeUndefined();
  });
});
