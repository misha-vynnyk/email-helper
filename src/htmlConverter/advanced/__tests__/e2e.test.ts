import * as fs from "fs";
import * as path from "path";
import { convertAdvanced } from "../index";
import { profile as tttProfile } from "../profiles/ttt";
import { profile as alphaoneProfile } from "../profiles/alphaone";

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
    // no text content from empty input
    expect(html.replace(/<[^>]*>/g, "").trim()).toBe("");
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

  it("renders the link as an <a> tag", () => {
    expect(html).toContain('href="https://example.com"');
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
    expect(html).toContain("$29/mo");
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
