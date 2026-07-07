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
