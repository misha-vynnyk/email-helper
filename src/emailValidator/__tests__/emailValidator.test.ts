/**
 * Regression tests for the DOM-based email validator.
 * Each block references the bug it guards against (see src/emailValidator/fix.md).
 */
// The real logger uses import.meta (Vite) which ts-jest cannot compile.
jest.mock("../../utils/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { EmailHTMLValidator } from "../EmailHTMLValidator";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function tableDepth(doc: Document): number {
  let max = 0;
  doc.querySelectorAll("table").forEach((table) => {
    let depth = 1;
    let parent = table.parentElement;
    while (parent) {
      if (parent.tagName === "TABLE") depth++;
      parent = parent.parentElement;
    }
    max = Math.max(max, depth);
  });
  return max;
}

describe("EmailHTMLValidator (DOM-based)", () => {
  let validator: EmailHTMLValidator;

  beforeEach(() => {
    validator = new EmailHTMLValidator();
  });

  afterEach(() => {
    validator.dispose();
  });

  // Bug 1: shared cached regexes with lastIndex made results flicker N → 0 → N
  describe("validation stability", () => {
    it("returns identical results for repeated validation of the same HTML", () => {
      const html =
        '<span style="color:red" style="font-size:12px">x</span>' +
        '<img s rc="a.png" />' +
        "<span>   </span>";

      const counts = [1, 2, 3, 4].map(() => validator.validate(html).totalIssues);
      expect(new Set(counts).size).toBe(1);
      expect(counts[0]).toBeGreaterThan(0);
    });
  });

  // Bug 2: autofix regex mangled URLs with query params and "a < b" text
  describe("autofix content safety", () => {
    it("preserves URLs with query parameters through a full auto-fix", () => {
      const url = "https://shop.com/sale?utm_source=email&id=42";
      const html = `<a href="${url}">Sale</a><p>hello</p>`;

      const { html: fixedHtml, fixed } = validator.autoFix(html);

      expect(fixed.length).toBeGreaterThan(0);
      const link = parse(fixedHtml).querySelector("a");
      expect(link?.getAttribute("href")).toBe(url);
    });

    it('preserves "a < b" style text content', () => {
      const html = "<p>check that a < b holds</p>";

      const { html: fixedHtml } = validator.autoFix(html);

      const text = parse(fixedHtml).body.textContent;
      expect(text).toContain("a < b holds");
    });

    // Bug 6: "<<" in text made isValidHTMLStructure revert every fix
    it("still applies fixes when the text contains << or >>", () => {
      const html = "<p>use operator << to shift</p>";

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "paragraph-tags");

      expect(fixed).toBe(true);
      const doc = parse(fixedHtml);
      expect(doc.querySelector("p")).toBeNull();
      expect(doc.querySelector("span")?.textContent).toContain("use operator << to shift");
    });
  });

  // Bug 3: autofix wiped user-written alt texts on every run
  describe("image alt attributes", () => {
    it("never overwrites an existing non-empty alt text", () => {
      const alt = "Summer Sale — 50% off everything";
      const html = `<img src="promo/hero-banner.png" alt="${alt}" width="600" height="200" style="display:block" /><p>x</p>`;

      const { html: fixedHtml } = validator.autoFix(html);

      expect(parse(fixedHtml).querySelector("img")?.getAttribute("alt")).toBe(alt);
    });

    it("generates alt from the filename only when alt is missing or empty", () => {
      const html = '<img src="/img/hero-banner.png" width="1" height="1" style="display:block" />';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(
        html,
        "image-alt-attributes"
      );

      expect(fixed).toBe(true);
      expect(parse(fixedHtml).querySelector("img")?.getAttribute("alt")).toBe("Hero Banner");
    });

    it("reports missing alt with category and autoFixAvailable", () => {
      const report = validator.validate('<img src="a.png" width="1" height="1" />');
      const altIssue = [...report.errors, ...report.warnings].find(
        (r) => r.rule === "image-alt-attributes"
      );
      expect(altIssue).toBeDefined();
      expect(altIssue?.category).toBe("accessibility");
      expect(altIssue?.autoFixAvailable).toBe(true);
    });
  });

  // Bug 4: <p([^>]*)> regex matched <pre>/<picture> and produced <spanre>
  describe("paragraph replacement", () => {
    it("converts <p> to <span> without touching <pre>", () => {
      const html = "<pre>const x = 1;</pre><p>hello</p>";

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "paragraph-tags");

      expect(fixed).toBe(true);
      expect(fixedHtml).not.toContain("spanre");
      const doc = parse(fixedHtml);
      expect(doc.querySelector("pre")?.textContent).toBe("const x = 1;");
      expect(doc.querySelector("p")).toBeNull();
      expect(doc.querySelector("span")?.textContent).toBe("hello");
    });
  });

  // Bug 5: "Fix All" filtered rules by declared severity, not issue severity
  describe("fix all by severity", () => {
    it("fixes warning-severity issues emitted by rules declared as error", () => {
      const html = '<a href="https://example.com">click</a>';

      const report = validator.validate(html);
      const linkWarnings = report.warnings.filter((r) => r.rule === "email-safe-links");
      expect(linkWarnings.length).toBeGreaterThan(0);

      const { html: fixedHtml, fixed } = validator.autoFixAllIssues(html, "warning");

      expect(fixed).toContain("email-safe-links");
      const link = parse(fixedHtml).querySelector("a");
      expect(link?.getAttribute("target")).toBe("_blank");
    });
  });

  // Serious: display: block (with space) was re-added as a duplicate
  describe("style handling", () => {
    it('recognizes "display: block" with spaces and does not duplicate it', () => {
      const html =
        '<img src="a.png" alt="x" width="10" height="10" style="display: block" />';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "table-attributes");

      expect(fixed).toBe(false);
      const style = parse(html === fixedHtml ? html : fixedHtml)
        .querySelector("img")
        ?.getAttribute("style");
      expect((style?.match(/display/g) ?? []).length).toBe(1);
    });

    it("merges duplicate style attributes instead of dropping one", () => {
      const html = '<span style="color:red" style="font-size:12px">x</span>';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "duplicate-styles");

      expect(fixed).toBe(true);
      const style = parse(fixedHtml).querySelector("span")?.getAttribute("style") ?? "";
      expect(style).toContain("color: red");
      expect(style).toContain("font-size: 12px");
    });
  });

  // Serious: block element attributes were dumped onto the wrapper <table>
  describe("block element replacement", () => {
    it("moves div attributes to the content cell, not the table", () => {
      const html = '<div style="padding:10px" align="center">content</div>';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(
        html,
        "block-element-tags"
      );

      expect(fixed).toBe(true);
      const doc = parse(fixedHtml);
      const table = doc.querySelector("table");
      const td = doc.querySelector("td");
      expect(table?.getAttribute("cellpadding")).toBe("0");
      expect(table?.getAttribute("style")).toBeNull();
      expect(td?.getAttribute("style")).toContain("padding:10px");
      expect(td?.getAttribute("align")).toBe("center");
      expect(td?.textContent).toBe("content");
    });
  });

  // Serious: aria-*/id removal broke accessibility and anchor links
  describe("unsafe attribute cleanup", () => {
    it("removes event handlers and data-* (incl. multi-dash) but keeps id and aria-*", () => {
      const html =
        '<span id="anchor" aria-label="label" onclick="alert(1)" data-foo-bar="1" class="c">x</span>';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(
        html,
        "email-unsafe-attributes"
      );

      expect(fixed).toBe(true);
      const span = parse(fixedHtml).querySelector("span");
      expect(span?.getAttribute("id")).toBe("anchor");
      expect(span?.getAttribute("aria-label")).toBe("label");
      expect(span?.hasAttribute("onclick")).toBe(false);
      expect(span?.hasAttribute("data-foo-bar")).toBe(false);
      expect(span?.hasAttribute("class")).toBe(false);
    });
  });

  describe("table attributes", () => {
    it("adds missing attributes but never overwrites user values", () => {
      const html =
        '<table><tr><td valign="middle"><img src="a.png" alt="x" width="300" height="150" style="display:block" /></td></tr></table>';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "table-attributes");

      expect(fixed).toBe(true);
      const doc = parse(fixedHtml);
      expect(doc.querySelector("table")?.getAttribute("cellpadding")).toBe("0");
      expect(doc.querySelector("td")?.getAttribute("valign")).toBe("middle");
      const img = doc.querySelector("img");
      expect(img?.getAttribute("width")).toBe("300");
      expect(img?.getAttribute("height")).toBe("150");
    });
  });

  describe("tag formatting (br/hr/img)", () => {
    it("normalizes self-closing and wrongly closed br without doubling line breaks", () => {
      const html = "<span>line<br/>break</span><span>a<br></br>b</span>";

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, "email-safe-tags");

      expect(fixed).toBe(true);
      expect(parse(fixedHtml).querySelectorAll("br").length).toBe(2);
      expect(fixedHtml).not.toContain("</br>");
      expect(fixedHtml).not.toContain("<br/>");
    });

    it('repairs "s rc" into src', () => {
      const html = '<img s rc="a.png" alt="x" width="1" height="1" style="display:block" />';

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(
        html,
        "malformed-attributes"
      );

      expect(fixed).toBe(true);
      expect(parse(fixedHtml).querySelector("img")?.getAttribute("src")).toBe("a.png");
    });
  });

  describe("dangerous tags and headings", () => {
    it("removes script tags and replaces headings with styled spans", () => {
      const html = '<script>alert(1)</script><h1 style="color:red">Title</h1>';

      const { html: fixedHtml } = validator.autoFix(html);

      const doc = parse(fixedHtml);
      expect(doc.querySelector("script")).toBeNull();
      expect(doc.querySelector("h1")).toBeNull();
      const span = doc.querySelector("span");
      const style = span?.getAttribute("style") ?? "";
      expect(style).toContain("font-weight: bold");
      expect(style).toContain("font-size: 32px");
      expect(style).toContain("color: red");
      expect(span?.textContent).toBe("Title");
    });
  });

  describe("table nesting", () => {
    it("flags and reduces nesting beyond maxTableNesting, keeping content", () => {
      let html = "<span>deep</span>";
      for (let i = 0; i < 7; i++) {
        html = `<table><tr><td>${html}</td></tr></table>`;
      }

      const report = validator.validate(html);
      expect(report.warnings.some((r) => r.rule === "table-nesting-cleanup")).toBe(true);

      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(
        html,
        "table-nesting-cleanup"
      );

      expect(fixed).toBe(true);
      const doc = parse(fixedHtml);
      expect(tableDepth(doc)).toBeLessThanOrEqual(5);
      expect(doc.body.textContent).toContain("deep");
    });
  });

  describe("scoring and strict mode", () => {
    it("does not flatten the score to 0 for repeated issues of one rule", () => {
      const html = "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>";

      const report = validator.validate(html);

      expect(report.errors.length).toBeGreaterThanOrEqual(5);
      expect(report.score).toBeGreaterThan(0);
    });

    it("strictMode treats warnings as blocking", () => {
      const html = '<a href="https://example.com" style="color:#000">x</a>'; // warning: no target

      expect(validator.validate(html).warnings.length).toBeGreaterThan(0);
      expect(validator.validate(html).isValid).toBe(true);

      const strict = new EmailHTMLValidator({ strictMode: true });
      expect(strict.validate(html).isValid).toBe(false);
      strict.dispose();
    });
  });

  describe("no-op behavior", () => {
    it("returns the input byte-for-byte when there is nothing to fix", () => {
      const html =
        '<table cellpadding="0" cellspacing="0" border="0"><tr><td valign="top">' +
        '<img src="a.png" alt="Logo" width="100" height="40" style="display:block">' +
        '<a href="https://x.com" target="_blank" style="color:#000; text-decoration:none">hi</a>' +
        "</td></tr></table>";

      const report = validator.validate(html);
      expect(report.totalIssues).toBe(0);
      expect(report.score).toBe(100);

      const { html: fixedHtml, fixed } = validator.autoFix(html);
      expect(fixed).toEqual([]);
      expect(fixedHtml).toBe(html);
    });

    it("is idempotent: a second auto-fix changes nothing", () => {
      const html = '<div><p>text</p><a href="">x</a><img src="pic.png"></div>';

      const first = validator.autoFix(html);
      expect(first.fixed.length).toBeGreaterThan(0);

      const second = validator.autoFix(first.html);
      expect(second.fixed).toEqual([]);
      expect(second.html).toBe(first.html);
    });
  });

  // Serious: constructor started a setInterval the panel never disposed
  describe("resource management", () => {
    it("creates no timers on construction or validation", () => {
      jest.useFakeTimers();
      try {
        const v = new EmailHTMLValidator();
        v.validate("<p>x</p>");
        v.autoFix("<p>x</p>");
        expect(jest.getTimerCount()).toBe(0);
        v.dispose();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
