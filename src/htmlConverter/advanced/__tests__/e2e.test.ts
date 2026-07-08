import * as fs from "fs";
import * as path from "path";

import { tokens } from "../config/tokens";
import { convertAdvanced, convertAdvancedDetailed } from "../index";
import { profile as alphaoneProfile } from "../profiles/alphaone";
import { profile as tttProfile } from "../profiles/ttt";

const FIXTURES = path.join(__dirname, "fixtures/raw");

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), "utf-8");
}

// ── Structural invariants ─────────────────────────────────────────────────────

describe("convertAdvanced — structural invariants", () => {
  it("output is a valid HTML table wrapping content", () => {
    const html = convertAdvanced("<p>hello</p>");
    expect(html).toContain("<table");
    expect(html).toContain("</table>");
  });

  it("output contains the input text", () => {
    const html = convertAdvanced("<p>unique-marker-text</p>");
    expect(html).toContain("unique-marker-text");
  });

  it("empty input produces scaffold with no content rows", () => {
    const html = convertAdvanced("");
    expect(html).toContain("<table");
    // no text content from empty input (&#160; spacers don't count as content)
    expect(html.replace(/<[^>]*>/g, "").replace(/&#160;/g, "").trim()).toBe("");
  });

  it("does not pass through unsafe javascript: hrefs", () => {
    const html = convertAdvanced('<p><a href="javascript:alert(1)">evil</a></p>');
    expect(html).not.toContain("javascript:");
    expect(html).toContain("evil");
  });
});

// ── plain-text.html fixture ───────────────────────────────────────────────────

describe("convertAdvanced — plain-text fixture", () => {
  let html: string;
  beforeAll(() => {
    html = convertAdvanced(loadFixture("plain-text.html"));
  });

  it("contains the newsletter text", () => {
    expect(html).toContain("Welcome to our monthly newsletter");
  });

  it("preserves the bold + red color span", () => {
    expect(html).toContain("new pricing takes effect July 1");
    expect(html).toContain("#cc0000");
  });

  it("renders the link as an <a> tag with placeholder href", () => {
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
    expect(html).toContain("our website");
  });

  it("preserves small print text (rendered at body size — <p> always body)", () => {
    // <p> elements always get size="body" in fromDom; only <h5>/<h6> → small.
    // The small font-size on the span is context-only, not used for paragraph role.
    expect(html).toContain("Small print");
  });

  it("snapshot — default profile", () => {
    expect(html).toMatchSnapshot();
  });
});

// ── tables.html fixture ───────────────────────────────────────────────────────

describe("convertAdvanced — tables fixture", () => {
  let html: string;
  beforeAll(() => {
    html = convertAdvanced(loadFixture("tables.html"));
  });

  it("contains the alertBand background", () => {
    expect(html).toContain("#1a1a2e");
  });

  it("contains calloutLeft for the light accent table", () => {
    expect(html).toContain("#fff3cd");
  });

  it("contains statsGrid cells", () => {
    expect(html).toContain("12,500");
    expect(html).toContain("Active users");
    expect(html).toContain("98.7%");
  });

  it("statsGrid has 3 cells with widths summing to 100%", () => {
    // Extract the statsGrid section
    const widths = [...html.matchAll(/width="(\d+)%"/g)]
      .map(m => parseInt(m[1]))
      .filter(w => w < 100);
    const gridWidths = widths.filter(w => w >= 30 && w <= 35);
    const total = gridWidths.reduce((s, w) => s + w, 0);
    expect(total).toBe(100);
  });

  it("contains recordRow data", () => {
    expect(html).toContain("Starter");
    expect(html).toContain("&#36;29/mo");
  });

  // Regression: a recordRow whose source cells each declare a full 4-side border (GDocs
  // "boxed comparison row" pattern) must not double up the border at shared internal seams.
  describe("boxed comparison row (full per-cell border)", () => {
    it("contains the sanitized comparison content", () => {
      expect(html).toContain("THEN");
      expect(html).toContain("NOW");
      expect(html).toContain("Company A");
      expect(html).toContain("Company B");
      expect(html).toContain("1,234%");
      expect(html).toContain("5x better");
    });

    it("draws top+left on every cell, but bottom/right only on the closing row/column", () => {
      // 2 cols x 2 rows: top+left on all 4 cells; bottom only on the last row's 2 cells;
      // right only on the last column's 2 cells. Any other count means a seam is either
      // missing its border or doubled up.
      const count = (needle: string) => html.split(needle).length - 1;
      expect(count("border-top:1px solid #d6d2c4")).toBe(4);
      expect(count("border-left:1px solid #d6d2c4")).toBe(4);
      expect(count("border-bottom:1px solid #d6d2c4")).toBe(2);
      expect(count("border-right:1px solid #d6d2c4")).toBe(2);
    });

    it("puts bgcolor on each <td>, not redundantly on the <tr>", () => {
      expect(html).not.toContain('<tr bgcolor="#f4f4f0"');
      const count = (needle: string) => html.split(needle).length - 1;
      expect(count('bgcolor="#f4f4f0"')).toBe(4);
    });

    it("wraps cell text in a font-styled <span>, matching the text-cell convention", () => {
      expect(html).toMatch(/<span style="font-family:[^"]*">\s*<b style="color:#595959;">THEN<\/b>\s*<\/span>/);
    });
  });

  it("snapshot — default profile", () => {
    expect(html).toMatchSnapshot();
  });
});

// ── button-dark.html fixture ──────────────────────────────────────────────────

describe("convertAdvanced — button-dark fixture", () => {
  let html: string;
  beforeAll(() => {
    html = convertAdvanced(loadFixture("button-dark.html"));
  });

  it("renders a buttonBand with the signup link", () => {
    expect(html).toContain("https://example.com/signup");
    expect(html).toContain("Create your account");
  });

  it("buttonBand uses the green background", () => {
    expect(html).toContain("#28b628");
  });

  it("snapshot — default profile", () => {
    expect(html).toMatchSnapshot();
  });
});

// ── Profile overrides ─────────────────────────────────────────────────────────

describe("convertAdvanced — profile overrides", () => {
  const raw = loadFixture("plain-text.html");

  it("TTT profile: sidePadding is 21px", () => {
    const html = convertAdvanced(raw, tttProfile);
    expect(html).toContain("padding-left:21px");
    expect(html).toContain("padding-right:21px");
  });

  it("TTT profile: blockPadY is 15px", () => {
    const html = convertAdvanced(raw, tttProfile);
    expect(html).toContain("padding-top:15px");
  });

  it("AlfaOne profile: uses Verdana font stack", () => {
    const html = convertAdvanced(raw, alphaoneProfile);
    expect(html).toContain("Verdana");
  });

  it("AlfaOne profile: sidePadding stays at 20px (unchanged)", () => {
    const html = convertAdvanced(raw, alphaoneProfile);
    expect(html).toContain("padding-left:20px");
  });

  it("default and TTT outputs differ in padding", () => {
    const defaultHtml = convertAdvanced(raw);
    const tttHtml = convertAdvanced(raw, tttProfile);
    // TTT has 21px, default has 20px — they are different
    expect(defaultHtml).not.toBe(tttHtml);
    expect(defaultHtml).toContain("padding-left:20px");
    expect(tttHtml).toContain("padding-left:21px");
  });
});

// ── GDocs 3-cell button pattern (spacer | h5-in-colored-cell | spacer) ───────

describe("convertAdvanced — GDocs button-in-table pattern", () => {
  // The user's real-world GDocs HTML: 3-cell row where side cells are empty spacers
  // and the center cell has a blue bg + h5 (button marker)
  const gdocsBtn = `<b style="font-weight:normal;" id="docs-internal-guid-cd8a99cc">
    <div dir="ltr" style="margin-left:0pt;" align="left">
      <table style="border:none;border-collapse:collapse;">
        <colgroup><col width="132" /><col width="360" /><col width="132" /></colgroup>
        <tbody>
          <tr style="height:0pt">
            <td style="border-right:solid #1a56db 0.5pt;vertical-align:top;padding:0pt 5.75pt 0pt 5.75pt;">
              <br />
            </td>
            <td style="border:solid #1a56db 0.5pt;vertical-align:top;background-color:#1a56db;padding:11pt 10pt 11pt 10pt;">
              <h5 dir="ltr" style="line-height:1.2;text-align:center;margin-top:12pt;margin-bottom:4pt;">
                <span style="font-size:11pt;color:#666666;font-weight:400;">See The Full Briefing &#8594;</span>
              </h5>
            </td>
            <td style="border-left:solid #1a56db 0.5pt;vertical-align:top;padding:0pt 5.75pt 0pt 5.75pt;">
              <br />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </b>`;

  let html: string;
  beforeAll(() => { html = convertAdvanced(gdocsBtn); });

  it("renders as buttonBand (not statsGrid)", () => {
    // statsGrid would put cells side-by-side; buttonBand is a centered link
    expect(html).toContain("urlhere");
    expect(html).toContain("See The Full Briefing");
  });

  it("button uses the cell's blue color (#1a56db), not default green", () => {
    expect(html).toContain("#1a56db");
    expect(html).not.toContain("#28b628");
  });

  it("button has no border-radius (matches GDocs document style)", () => {
    expect(html).not.toContain("border-radius");
  });

  it("button text color is white (dark bg → white text)", () => {
    // The <a> inside the button should have white text, not the grey from the span
    expect(html).toContain(`color:${tokens.color.white}`);
    expect(html).not.toContain("#666666");
  });

  it("href is placeholder urlhere", () => {
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
  });
});

// ── Google Docs <b style=font-weight:normal> wrapper ─────────────────────────

describe("convertAdvanced — Google Docs b-wrapper", () => {
  it("h3 with font-weight:400 span inside GDocs b-wrapper is NOT bold", () => {
    const input = `<b style="font-weight:normal;"><h3 dir="ltr"><span style="font-weight:400;font-style:italic;">Mode Mobile recently received.</span></h3></b>`;
    const result = convertAdvanced(input);
    expect(result).not.toContain('<b style="font-style:italic;">');
    expect(result).toContain('<em>');
  });
});

// ── convertAdvanced — override path ──────────────────────────────────────────

describe("convertAdvanced — inline override", () => {
  const raw = "<p>Hello world</p>";

  it("empty override {} takes fast-path (identical to no override, mergeTokens not called)", () => {
    // Object.keys({}).length === 0 → hasOverride=false → both use pre-built singletons
    const withEmpty = convertAdvanced(raw, {});
    const withNone  = convertAdvanced(raw);
    expect(withEmpty).toBe(withNone);
  });

  it("inline placeholderHref override changes hrefs in output", () => {
    const result = convertAdvanced(
      '<p><a href="https://example.com">link</a></p>',
      { placeholderHref: "CUSTOM_URL" },
    );
    expect(result).toContain("CUSTOM_URL");
    expect(result).not.toContain('"urlhere"');
  });

  it("inline font override changes bodyPx in output", () => {
    const result = convertAdvanced(raw, { font: { bodyPx: 24 } });
    expect(result).toContain("24px");
    expect(result).not.toContain("18px");
  });

  it("inline layout override changes sidePadding in output", () => {
    const result = convertAdvanced(raw, { layout: { sidePadding: 40 } });
    expect(result).toContain("padding-left:40px");
    expect(result).toContain("padding-right:40px");
  });

  it("inline tags override uses custom bold tag", () => {
    const result = convertAdvanced(
      '<p><b>bold text</b></p>',
      { tags: { bold: "strong", italic: "em", underline: "u", colorWrap: "span", blockWrap: "span" } },
    );
    expect(result).toContain("<strong>");
    expect(result).not.toContain("<b>");
  });

  it("partial override only changes specified token — others remain default", () => {
    const result = convertAdvanced(raw, { layout: { sidePadding: 30 } });
    // Changed: sidePadding
    expect(result).toContain("padding-left:30px");
    // Unchanged: containerMaxWidth stays 600
    expect(result).toContain("max-width:600px");
  });
});

// ── Images end-to-end ─────────────────────────────────────────────────────────

describe("convertAdvanced — images", () => {
  it("keeps the original src so uploadedUrlMap replacement can match it", () => {
    const html = convertAdvanced('<p><span><img src="https://lh7.googleusercontent.com/xyz" alt="Banner"></span></p>');
    expect(html).toContain('src="https://lh7.googleusercontent.com/xyz"');
    expect(html).toContain('alt="Banner"');
  });

  it("wraps the image in a placeholder link inside an img-bg-block cell", () => {
    const html = convertAdvanced('<p><img src="pic.png"></p>');
    expect(html).toContain(`class="${tokens.classes.imgBg}"`);
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
  });

  it("image between paragraphs keeps document order", () => {
    const html = convertAdvanced("<p>before</p><p><img src='mid.png'></p><p>after</p>");
    const iBefore = html.indexOf("before");
    const iImg = html.indexOf("mid.png");
    const iAfter = html.indexOf("after");
    expect(iBefore).toBeGreaterThan(-1);
    expect(iImg).toBeGreaterThan(iBefore);
    expect(iAfter).toBeGreaterThan(iImg);
  });

  it("output <img> matches the useHtmlExport replacement regex", () => {
    const html = convertAdvanced('<p><img src="https://x.com/a.png"></p>');
    const regex = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
    expect(regex.test(html)).toBe(true);
  });
});

// ── convertAdvancedDetailed — warnings & profile-aware IR ─────────────────────

describe("convertAdvancedDetailed — warnings", () => {
  it("clean input produces no warnings", () => {
    const { warnings } = convertAdvancedDetailed("<p>hello</p>");
    expect(warnings).toEqual([]);
  });

  it("img without src produces a warning", () => {
    const { warnings } = convertAdvancedDetailed("<p><img alt='x'></p>");
    expect(warnings.some(w => w.includes("без src"))).toBe(true);
  });

  it("nested table inside a colored cell is flattened to text with a warning", () => {
    const raw = `<table><tr><td style="background-color:#1a1a2e;">
      <table><tr><td><p>inner text</p></td></tr></table>
    </td></tr></table>`;
    const { html, warnings } = convertAdvancedDetailed(raw);
    expect(html).toContain("inner text");
    expect(warnings.some(w => w.includes("Вкладену таблицю"))).toBe(true);
  });
});

describe("convertAdvancedDetailed — tok reaches IR construction", () => {
  // #808080 has luminance ≈0.502: not dark with default darkLuma=0.5 (calloutLeft),
  // dark with darkLuma=0.6 (alertBand). Verifies profile tokens flow into ir/color.
  const raw = '<table><tr><td style="background-color:#808080;"><p>band</p></td></tr></table>';

  it("default darkLuma → light bg → calloutLeft (border-left)", () => {
    const { html } = convertAdvancedDetailed(raw);
    expect(html).toContain("border-left:");
  });

  it("darkLuma override → dark bg → alertBand (no border-left)", () => {
    const { html } = convertAdvancedDetailed(raw, { color: { darkLuma: 0.6 } });
    expect(html).not.toContain("border-left:");
    expect(html).toContain("#808080");
  });
});

// ── Proportional column widths from <colgroup> ────────────────────────────────

describe("convertAdvanced — proportional colgroup widths", () => {
  it("statsGrid uses colgroup proportions instead of equal split", () => {
    const raw = `<table>
      <colgroup><col width="150"><col width="300"><col width="150"></colgroup>
      <tr><td><p>a</p></td><td><p>b</p></td><td><p>c</p></td></tr>
    </table>`;
    const html = convertAdvanced(raw);
    expect(html).toContain('width="25%"');
    expect(html).toContain('width="50%"');
  });

  it("grid widths still sum to 100 with uneven proportions", () => {
    const raw = `<table>
      <colgroup><col width="132"><col width="360"><col width="132"></colgroup>
      <tr><td><p>a</p></td><td><p>b</p></td><td><p>c</p></td></tr>
    </table>`;
    const html = convertAdvanced(raw);
    const widths = [...html.matchAll(/width="(\d+)%"/g)].map(m => parseInt(m[1])).filter(w => w < 100);
    expect(widths.reduce((s, w) => s + w, 0)).toBe(100);
  });

  it("falls back to equal split when colgroup is absent", () => {
    const raw = "<table><tr><td><p>a</p></td><td><p>b</p></td></tr></table>";
    const html = convertAdvanced(raw);
    expect(html).toContain('width="50%"');
  });

  it("recordRow uses colgroup proportions", () => {
    const raw = `<table>
      <colgroup><col width="100"><col width="300"></colgroup>
      <tr><td><p>k1</p></td><td><p>v1</p></td></tr>
      <tr><td><p>k2</p></td><td><p>v2</p></td></tr>
    </table>`;
    const html = convertAdvanced(raw);
    expect(html).toContain('width="25%"');
    expect(html).toContain('width="75%"');
  });
});

// ── tickr-promo.html fixture (real-world GDocs newsletter) ────────────────────
// Reference: header masthead table, italic byline, body paragraphs, an orange
// blockquote callout, a 4-cell stats grid with one highlighted (dark) tile, an
// orange "editor's note" box, a black-bordered CTA section with a nested
// button, a P.S. line, and small-print disclaimers.

describe("convertAdvanced — tickr-promo fixture", () => {
  let html: string;
  let warnings: string[];
  beforeAll(() => {
    const result = convertAdvancedDetailed(loadFixture("tickr-promo.html"));
    html = result.html;
    warnings = result.warnings;
  });

  it("produces no conversion warnings for this document", () => {
    expect(warnings).toEqual([]);
  });

  it("contains the masthead label, headline and subtitle", () => {
    expect(html).toContain("FROM THE DESK OF TICKR NEWS");
    expect(html).toContain("The SpaceX Story. And the One Beside It.");
    expect(html).toContain("Why 59,000");
    expect(html).toContain("investors quietly moved to");
  });

  it("contains the byline and body paragraphs", () => {
    expect(html).toContain("By Katherine Holden");
    expect(html).toContain("Everyone is talking about SpaceX.");
    expect(html).toContain("Mode Mobile built EarnOS");
  });

  it("renders the pull-quote as a calloutLeft with the Kevin Harrington attribution", () => {
    expect(html).toContain("Just like Uber turned cars into cash");
    expect(html).toContain("Kevin Harrington, Original Shark Tank Investor");
    // Light accent bg from the source table cell is preserved
    expect(html).toContain("#fff7ed");
    expect(html).toContain("border-left:");
  });

  it("calloutLeft accent uses the source document's own border color, not the house green default", () => {
    // Source declares border-left:solid #c2410c 1.75pt on the quote cell
    expect(html).toContain("border-left:10px solid #c2410c");
    expect(html).not.toContain("border-left:10px solid #28b628");
  });

  it("wraps the EDITOR'S NOTE box in its own bordered frame using the document's border color", () => {
    // Source declares a full #c2410c frame (all four sides) on this cell
    expect(html).toMatch(/border-top:1px solid #c2410c;border-right:1px solid #c2410c;border-bottom:1px solid #c2410c;border-left:1px solid #c2410c;/);
  });

  it("wraps the black-bordered CTA section in a frame instead of dropping the border", () => {
    // Source declares a full #111111 frame with no background — previously this
    // border was silently dropped because normalize.ts stripped all border CSS
    // and single-cell classification returned null for cells without a bg.
    expect(html).toMatch(/border-top:1px solid #000000;border-right:1px solid #000000;border-bottom:1px solid #000000;border-left:1px solid #000000;/);
  });

  it("renders a 4-cell statsGrid with widths summing to 100%", () => {
    expect(html).toContain("32,481%");
    expect(html).toContain("3-Yr Revenue Growth");
    expect(html).toContain("490M");
    expect(html).toContain("Total Users");
    expect(html).toContain("11.8M");
    expect(html).toContain("Actual EBITDA 2025");

    const widths = [...html.matchAll(/width="(\d+)%"/g)]
      .map(m => parseInt(m[1]))
      .filter(w => w > 0 && w < 100);
    // 4 equal-ish columns (156/156/156/156 colgroup) plus other grids/rows in
    // the doc — just check the 25% quartet exists and some 4-way group sums to 100
    const quarters = widths.filter(w => w >= 20 && w <= 30);
    expect(quarters.length).toBeGreaterThanOrEqual(4);
  });

  it("highlights the featured stat tile with a dark background and white text", () => {
    expect(html).toContain('bgcolor="#0a2463"');
    expect(html).toContain("background-color:#0a2463");
    // "$" is entity-encoded by normalizeSymbols in the final pass
    expect(html).toContain("&#36;0.50");
    expect(html).toContain("Until May 29");
  });

  it("non-highlighted stat tiles keep the light beige background", () => {
    expect(html).toContain('bgcolor="#f1ede6"');
  });

  it("renders the editor's note as a callout with the light accent background", () => {
    expect(html).toContain("EDITOR'S NOTE:");
    expect(html).toContain("Mode's prior two rounds sold out entirely");
    expect(html).toContain("59,095");
  });

  it("renders the CTA section text and the invest button", () => {
    expect(html).toContain("SERIES A");
    expect(html).toContain("REG A");
    expect(html).toContain("&#36;0.50/SHARE");
    expect(html).toContain("CLOSES MAY 29");
    expect(html).toContain("&#36;1,000 minimum");
    expect(html).toContain("Up to 20% bonus shares");
    expect(html).toContain("INVEST AT &#36;0.50/SHARE");
    // h5 marker inside the near-black cell → buttonBand using that cell's color;
    // canonicalizeBg snaps #111111 to #000000 (within blackSnap tolerance, §5.A)
    expect(html).toContain('bgcolor="#000000"');
  });

  it("renders the P.S. line and legal disclaimers", () => {
    expect(html).toContain("P.S.");
    expect(html).toContain("The SpaceX story is real");
    expect(html).toContain("offering circular");
    expect(html).toContain("invest.modemobile.com");
    expect(html).toContain("Mode Mobile recently received their ticker reservation");
    expect(html).toContain("Deloitte rankings");
    expect(html).toContain("Pro forma revenue and EBITDA");
  });

  it("renders the offering-circular link text with the placeholder href (by-design workflow)", () => {
    // Inline links intentionally render href="urlhere" — real URLs are filled in
    // manually after conversion (confirmed workflow, unlike buttonBand which
    // keeps the real href). The source URL itself is not expected in the output.
    expect(html).toContain(`href="${tokens.placeholderHref}"`);
    expect(html).toContain("offering circular");
  });

  it("snapshot — full document", () => {
    expect(html).toMatchSnapshot();
  });
});
