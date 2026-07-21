// Unit tests for ir/fromDom — covers paths not reached by e2e fixtures.
import { tokens } from "../config/tokens";
import { fromDom, resetListGroupCounter } from "../ir/fromDom";
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

// ── Paragraph's own background-color (e.g. h5 button colored via its own style,
//    not a wrapping colored <td>) ──────────────────────────────────────────────

describe("fromDom — paragraph's own background-color", () => {
  it("captures background-color declared directly on an <h5>", () => {
    const p = firstParagraph('<h5 style="background-color:#7b4fbf;">Watch now</h5>');
    expect(p.bg).toBe("#7b4fbf");
  });

  it("leaves bg undefined when the source declares none", () => {
    const p = firstParagraph("<h5>Watch now</h5>");
    expect(p.bg).toBeUndefined();
  });
});

// ── Paragraph's own border (e.g. a quote/callout <p> with border-left, not a wrapping
//    colored <td>) ───────────────────────────────────────────────────────────

describe("fromDom — paragraph's own border", () => {
  it("captures border-left declared directly on a <p>", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;">Quoted line</p>');
    expect(p.border?.left?.color).toBe("#b71c1c");
    expect(p.border?.left?.widthPx).toBe(4); // 3pt × 96/72 = 4px
    expect(p.border?.top).toBeUndefined();
  });

  it("leaves border undefined when the source declares none", () => {
    const p = firstParagraph("<p>Plain line</p>");
    expect(p.border).toBeUndefined();
  });
});

// ── accentPadX (gap between a border-left <p> and its text) ─────────────────

describe("fromDom — accentPadX (border-left <p>'s gap to text)", () => {
  it("reads padding-left (longhand)", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;padding-left:12pt;">Quote</p>');
    expect(p.accentPadX).toBe(16); // 12pt × 96/72 = 16px
  });

  it("reads the left value out of the `padding` shorthand (4 values: T R B L)", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;padding:0pt 0pt 4pt 12pt;">Quote</p>');
    expect(p.accentPadX).toBe(16);
  });

  it("falls back to margin-left when no padding-left/padding is declared", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;margin-left:12pt;">Quote</p>');
    expect(p.accentPadX).toBe(16);
  });

  it("prefers padding-left over margin-left when both are declared", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;margin-left:12pt;padding-left:20pt;">Quote</p>');
    expect(p.accentPadX).toBe(27); // 20pt × 96/72 = 26.67 → 27px
  });

  it("leaves accentPadX undefined when none of padding-left/padding/margin-left is declared", () => {
    const p = firstParagraph('<p style="border-left:solid #b71c1c 3pt;">Quote</p>');
    expect(p.accentPadX).toBeUndefined();
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

  it("nested span with text-decoration:none cancels an inherited underline", () => {
    const p = firstParagraph(
      '<p><u><span>underlined </span><span style="text-decoration:none;">not underlined</span></u></p>',
    );
    expect(p.lines[0][0].underline).toBe(true);
    expect(p.lines[0][1].underline).toBeFalsy();
  });
});

// ── UL / OL lists ─────────────────────────────────────────────────────────────

describe("fromDom — UL list", () => {
  it("each <li> becomes a separate paragraph node", () => {
    const result = nodes("<ul><li>Apple</li><li>Banana</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs).toHaveLength(2);
  });

  it("marks each <li> paragraph as listItem, unordered", () => {
    const result = nodes("<ul><li>Apple</li><li>Banana</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs[0].listItem).toBe(true);
    expect(paragraphs[0].ordered).toBe(false);
    expect(paragraphs[1].listItem).toBe(true);
  });

  it("li text content has no manually-injected bullet prefix — real <ul> supplies it", () => {
    const result = nodes("<ul><li>Apple</li></ul>");
    const p = result[0] as Paragraph;
    const lineText = p.lines[0].map((r) => r.text).join("");
    expect(lineText).toBe("Apple");
  });
});

describe("fromDom — OL list", () => {
  it("each <li> becomes a separate paragraph node", () => {
    const result = nodes("<ol><li>First</li><li>Second</li><li>Third</li></ol>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs).toHaveLength(3);
  });

  it("marks each <li> paragraph as listItem, ordered — no manual numbering prefix", () => {
    const result = nodes("<ol><li>First</li><li>Second</li><li>Third</li></ol>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    for (const p of paragraphs) {
      expect(p.listItem).toBe(true);
      expect(p.ordered).toBe(true);
    }
    expect(paragraphs[0].lines[0][0].text).toBe("First");
  });

  it("OL and UL produce different `ordered` flags", () => {
    const olNodes = nodes("<ol><li>item</li></ol>");
    const ulNodes = nodes("<ul><li>item</li></ul>");
    expect((olNodes[0] as Paragraph).ordered).toBe(true);
    expect((ulNodes[0] as Paragraph).ordered).toBe(false);
  });
});

// ── listGroupId — distinguishes adjacent but separate <ul>/<ol> ──────────────
// Regression, Ітерація 9b (fix-advanced.md): without listGroupId, pushMerged's list-merge
// (classify.ts) couldn't tell two adjacent <ul>s of the same ordered-ness apart from
// consecutive <li>s of the SAME <ul> — they'd fuse into one continuous list/numbering.

describe("fromDom — listGroupId", () => {
  beforeEach(() => { resetListGroupCounter(); });

  it("increments listGroupId for each separate <ul>/<ol>", () => {
    const result = nodes("<ul><li>A</li></ul><ol><li>B</li></ol>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs[0].listGroupId).toBe(1);
    expect(paragraphs[1].listGroupId).toBe(2);
  });

  it("items within the SAME <ul> share one listGroupId", () => {
    const result = nodes("<ul><li>A</li><li>B</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs[0].listGroupId).toBe(paragraphs[1].listGroupId);
  });

  // The counter is module-level, not a local `let` inside fromDom() — a local one would
  // reset on the DIV recursion (fromDom calls itself for DIV/SECTION/... containers),
  // giving both lists listGroupId=1 and re-introducing the exact bug this fix targets.
  it("a list inside a <div> and an adjacent top-level list get DIFFERENT listGroupId", () => {
    const result = nodes("<div><ul><li>Inside div</li></ul></div><ul><li>Top level</li></ul>");
    const paragraphs = result.filter((n) => n.type === "p") as Paragraph[];
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].listGroupId).not.toBe(paragraphs[1].listGroupId);
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

  // <th> centers by default in every browser (user-agent stylesheet) — cellAlign
  // (detect/tableBlock.ts) relies on this flag when neither the cell nor its paragraph
  // declares an explicit align. <td> has no such default.
  it("marks a <th> cell as isHeader; a <td> cell is not", () => {
    const result = nodes(`
      <table><tr><th>Header</th><td>Data</td></tr></table>
    `);
    const table = result[0] as TableNode;
    expect(table.rows[0].cells[0].isHeader).toBe(true);
    expect(table.rows[0].cells[1].isHeader).toBe(false);
  });

  // Bug repro: two tables separated by an author-typed blank line (top-level <br>) were
  // silently merged into one recordRow because the gap signal never reached the second
  // TableNode — see TableNode.gapBefore and classify.ts's recordRow merge guard.
  it("a top-level <br> directly before a table sets its gapBefore", () => {
    const result = nodes(`
      <table><tr><td>A1</td><td>A2</td></tr></table>
      <br />
      <table><tr><td>B1</td><td>B2</td></tr></table>
    `);
    const tables = result.filter((n) => n.type === "table") as TableNode[];
    expect(tables).toHaveLength(2);
    expect(tables[0].gapBefore).toBeUndefined();
    expect(tables[1].gapBefore).toBe(true);
  });

  // GDocs wraps every pasted table in its own <div dir="ltr">, so the real-world shape is
  // "</table></div><br/><div><table>...", i.e. the <br> sits between the two DIVs, not
  // between the two TABLEs directly.
  it("a top-level <br> before a <div>-wrapped table sets the table's gapBefore", () => {
    const result = nodes(`
      <div><table><tr><td>A1</td><td>A2</td></tr></table></div>
      <br />
      <div><table><tr><td>B1</td><td>B2</td></tr></table></div>
    `);
    const tables = result.filter((n) => n.type === "table") as TableNode[];
    expect(tables).toHaveLength(2);
    expect(tables[0].gapBefore).toBeUndefined();
    expect(tables[1].gapBefore).toBe(true);
  });

  it("no <br> between two <div>-wrapped tables leaves gapBefore unset (still eligible to merge)", () => {
    const result = nodes(`
      <div><table><tr><td>A1</td><td>A2</td></tr></table></div>
      <div><table><tr><td>B1</td><td>B2</td></tr></table></div>
    `);
    const tables = result.filter((n) => n.type === "table") as TableNode[];
    expect(tables).toHaveLength(2);
    expect(tables[1].gapBefore).toBeUndefined();
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

  it("non-whitespace text in a link-colored + underlined span gets placeholder href", () => {
    const p = firstParagraph('<p><span style="color:#1155cc;text-decoration:underline;">Click here</span></p>');
    const run = p.lines[0].find((r) => r.text === "Click here");
    expect(run?.href).toBe(tokens.placeholderHref);
  });

  it("named-color blue + underlined span is detected as a link (name resolved to hex first)", () => {
    const p = firstParagraph('<p><span style="color:blue;text-decoration:underline;">Named link</span></p>');
    const run = p.lines[0].find((r) => r.text === "Named link");
    expect(run?.href).toBe(tokens.placeholderHref);
  });

  // Regression: color alone is too weak a signal — GDocs authors use blue for plain
  // emphasis/headings too (e.g. a promo banner's readable-blue line with no link intent).
  // Requiring underline as well avoids turning that into an accidental clickable link.
  it("blue but NOT underlined → no href (color alone is not enough)", () => {
    const p = firstParagraph('<p><span style="color:#1155cc;">Not a link</span></p>');
    const run = p.lines[0].find((r) => r.text === "Not a link");
    expect(run?.href).toBeUndefined();
  });

  it("underlined but NOT blue → no href (underline alone is not enough)", () => {
    const p = firstParagraph('<p><span style="color:#111827;text-decoration:underline;">Underlined only</span></p>');
    const run = p.lines[0].find((r) => r.text === "Underlined only");
    expect(run?.href).toBeUndefined();
  });

  it("underline inherited from an ancestor still counts (effective underline, not just own style)", () => {
    const p = firstParagraph(
      '<p><span style="text-decoration:underline;"><span style="color:#1155cc;">Inherited</span></span></p>'
    );
    const run = p.lines[0].find((r) => r.text === "Inherited");
    expect(run?.href).toBe(tokens.placeholderHref);
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

// ── Images ────────────────────────────────────────────────────────────────────

describe("fromDom — images", () => {
  it("top-level <img> becomes an ImageNode", () => {
    const result = nodes('<img src="https://x.com/a.png" alt="A">');
    expect(result).toEqual([{ type: "img", src: "https://x.com/a.png", alt: "A" }]);
  });

  it("GDocs image paragraph (<p><span><img></span></p>) becomes an ImageNode", () => {
    const result = nodes('<p><span><img src="https://lh7.googleusercontent.com/abc"></span></p>');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "img", src: "https://lh7.googleusercontent.com/abc" });
  });

  it("img without alt → alt is undefined", () => {
    const result = nodes('<p><img src="x.png"></p>');
    expect((result[0] as { alt?: string }).alt).toBeUndefined();
  });

  it("img without src is dropped", () => {
    expect(nodes("<p><img></p>")).toEqual([]);
  });

  it("image before text in the same paragraph → ImageNode precedes Paragraph", () => {
    const result = nodes('<p><img src="a.png">Caption text</p>');
    expect(result.map(n => n.type)).toEqual(["img", "p"]);
  });

  it("image after text in the same paragraph → Paragraph precedes ImageNode", () => {
    const result = nodes('<p>Intro text<img src="a.png"></p>');
    expect(result.map(n => n.type)).toEqual(["p", "img"]);
  });

  it("image inside a table cell is preserved in cell children", () => {
    const result = nodes('<table><tr><td><p><img src="cell.png"></p></td></tr></table>');
    const table = result[0] as import("../ir/types").TableNode;
    expect(table.type).toBe("table");
    expect(table.rows[0].cells[0].children).toEqual([{ type: "img", src: "cell.png", alt: undefined }]);
  });

  it("paragraph text is not affected by an embedded image", () => {
    const result = nodes('<p>Hello <b>world</b><img src="a.png"></p>');
    const p = result.find(n => n.type === "p") as Paragraph;
    expect(p.lines[0].map(r => r.text).join("")).toBe("Hello world");
  });
});

// ── Cell borders (Fix #2: named CSS colors) ────────────────────────────────────

describe("fromDom — cell borders", () => {
  it("resolves a named CSS border color (not just hex/rgb())", () => {
    const result = nodes('<table><tr><td style="border: 1px solid red;">x</td></tr></table>');
    const table = result[0] as TableNode;
    expect(table.rows[0].cells[0].border?.top?.color).toBe("#ff0000");
  });

  it("still resolves hex border colors (no regression)", () => {
    const result = nodes('<table><tr><td style="border: 1px solid #c2410c;">x</td></tr></table>');
    const table = result[0] as TableNode;
    expect(table.rows[0].cells[0].border?.top?.color).toBe("#c2410c");
  });

  it("drops the border when the color word isn't a known keyword", () => {
    const result = nodes('<table><tr><td style="border: 1px solid notacolor;">x</td></tr></table>');
    const table = result[0] as TableNode;
    expect(table.rows[0].cells[0].border).toBeUndefined();
  });
});

// § becomes <br data-one-br="1"> upstream (preprocess.ts) before fromDom ever sees it.
describe("fromDom — § marker (tightNext / tightBefore)", () => {
  it("sets tightNext when a paragraph ends with a one-br marker", () => {
    const p = firstParagraph('<p>Line one<br data-one-br="1"></p>');
    expect(p.tightNext).toBe(true);
    expect(p.tightBefore).toBeUndefined();
    expect(p.lines).toHaveLength(1); // trailing empty line trimmed
  });

  it("sets tightBefore when a paragraph starts with a one-br marker", () => {
    const p = firstParagraph('<p><br data-one-br="1">Line two</p>');
    expect(p.tightBefore).toBe(true);
    expect(p.tightNext).toBeUndefined();
    expect(p.lines).toHaveLength(1);
  });

  it("does NOT set tightNext for a plain (unmarked) trailing <br>", () => {
    const p = firstParagraph("<p>Line one<br></p>");
    expect(p.tightNext).toBeUndefined();
  });

  it("does NOT set tightBefore for a plain (unmarked) leading <br>", () => {
    const p = firstParagraph("<p><br>Line two</p>");
    expect(p.tightBefore).toBeUndefined();
  });

  it("a mid-paragraph one-br marker sets neither flag (both ends have real content)", () => {
    const p = firstParagraph('<p>Line one<br data-one-br="1">Line two</p>');
    expect(p.tightNext).toBeUndefined();
    expect(p.tightBefore).toBeUndefined();
    expect(p.lines).toHaveLength(2);
  });
});

// ── Border widths (quantized from the document, F11) ─────────────────────────

describe("fromDom — border widths from the document", () => {
  function borderTop(html: string) {
    const table = nodes(html)[0] as TableNode;
    return table.rows[0].cells[0].border?.top;
  }

  it("quantizes pt widths to whole px (1.75pt → 2px)", () => {
    const side = borderTop('<table><tr><td style="border: solid #c2410c 1.75pt;">x</td></tr></table>');
    expect(side?.widthPx).toBe(2);
  });

  it("keeps thin GDocs gridlines at the 1px minimum (0.5pt → 1px)", () => {
    const side = borderTop('<table><tr><td style="border: solid #cccccc 0.5pt;">x</td></tr></table>');
    expect(side?.widthPx).toBe(1);
  });

  it("passes px widths through rounded (3px → 3)", () => {
    const side = borderTop('<table><tr><td style="border: 3px solid #000000;">x</td></tr></table>');
    expect(side?.widthPx).toBe(3);
  });

  it("clamps oversized widths to 12px", () => {
    const side = borderTop('<table><tr><td style="border: 40px solid #000000;">x</td></tr></table>');
    expect(side?.widthPx).toBe(12);
  });

  it("leaves widthPx undefined when the source declares no width (token fallback)", () => {
    const side = borderTop('<table><tr><td style="border: solid #000000;">x</td></tr></table>');
    expect(side?.color).toBe("#000000");
    expect(side?.widthPx).toBeUndefined();
  });

  it("still drops a zero-width border entirely", () => {
    const side = borderTop('<table><tr><td style="border: 0pt solid #000000;">x</td></tr></table>');
    expect(side).toBeUndefined();
  });
});

// ── Border style (dashed/dotted) ──────────────────────────────────────────────

describe("fromDom — border style from the document", () => {
  function borderTop(html: string) {
    const table = nodes(html)[0] as TableNode;
    return table.rows[0].cells[0].border?.top;
  }

  it("captures a dashed border style", () => {
    const side = borderTop('<table><tr><td style="border: 1pt dashed #c2410c;">x</td></tr></table>');
    expect(side?.style).toBe("dashed");
  });

  it("captures a dotted border style", () => {
    const side = borderTop('<table><tr><td style="border: 1px dotted #000000;">x</td></tr></table>');
    expect(side?.style).toBe("dotted");
  });

  it("leaves style undefined for a solid border (the common case)", () => {
    const side = borderTop('<table><tr><td style="border: 1px solid #000000;">x</td></tr></table>');
    expect(side?.style).toBeUndefined();
  });
});

// ── Inline font-size is never a size signal (sizes come only from tokens) ────

describe("fromDom — inline font-size is ignored", () => {
  it("a 9pt span does NOT demote the paragraph to small", () => {
    expect(firstParagraph('<p><span style="font-size:9pt">tiny print</span></p>').size).toBe("body");
  });

  it("a large span does NOT promote the paragraph to headline", () => {
    expect(firstParagraph('<p><span style="font-size:24pt">big</span></p>').size).toBe("body");
  });

  it("heading tags still decide the role regardless of span sizes", () => {
    expect(firstParagraph('<h1><span style="font-size:9pt">x</span></h1>').size).toBe("headline");
  });
});

// ── Pairwise zero-margin signal + top-level <br> gap/tight markers ────────────

describe("fromDom — declared paragraph margins (pt)", () => {
  it("records explicit margin-top/margin-bottom values in pt", () => {
    const p = firstParagraph('<p style="margin-top:4pt;margin-bottom:1.5pt">hi</p>');
    expect(p.marginTopPt).toBe(4);
    expect(p.marginBottomPt).toBe(1.5);
  });

  it("records explicit zeros as 0 (distinct from undeclared)", () => {
    const p = firstParagraph('<p style="margin-top:0pt;margin-bottom:0pt">hi</p>');
    expect(p.marginTopPt).toBe(0);
    expect(p.marginBottomPt).toBe(0);
  });

  it("converts px margins to pt (16px → 12pt)", () => {
    const p = firstParagraph('<p style="margin-top:16px">hi</p>');
    expect(p.marginTopPt).toBe(12);
  });

  it("absence of a margin declaration stays undefined (unknown ≠ zero)", () => {
    const p = firstParagraph("<p>hi</p>");
    expect(p.marginTopPt).toBeUndefined();
    expect(p.marginBottomPt).toBeUndefined();
  });
});

describe("fromDom — top-level <br> between paragraphs", () => {
  it("marks the next paragraph with gapBefore (author-typed blank line)", () => {
    const result = nodes("<p>one</p><br /><p>two</p>");
    const [, p2] = result as Paragraph[];
    expect(p2.gapBefore).toBe(true);
    expect((result[0] as Paragraph).gapBefore).toBeUndefined();
  });

  it("a top-level <br data-one-br> (§ on its own line) marks the next paragraph tightBefore", () => {
    const result = nodes('<p>one</p><br data-one-br="1"><p>two</p>');
    const [, p2] = result as Paragraph[];
    expect(p2.tightBefore).toBe(true);
    expect(p2.gapBefore).toBeUndefined();
  });

  it("a table between the <br> and the paragraph consumes the pending gap", () => {
    const result = nodes('<p>one</p><br /><table><tr><td style="background-color:#f5f5f5">x</td></tr></table><p>two</p>');
    const last = result[result.length - 1] as Paragraph;
    expect(last.gapBefore).toBeUndefined();
  });
});
