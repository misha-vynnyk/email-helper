// Tests for the optional DOMPurify pass (sanitize.ts).
// Key invariant: sanitizing convertAdvanced output must not break the email markup.

import { convertAdvanced, convertAdvancedDetailed } from "../index";
import { sanitize } from "../sanitize";

describe("sanitize — strips dangerous content", () => {
  it("removes <script> tags", () => {
    const out = sanitize('<table><tr><td><script>alert(1)</script>text</td></tr></table>');
    expect(out).not.toContain("<script");
    expect(out).toContain("text");
  });

  it("removes event handler attributes", () => {
    const out = sanitize('<table><tr><td onclick="evil()">text</td></tr></table>');
    expect(out).not.toContain("onclick");
  });

  it("removes javascript: hrefs", () => {
    const out = sanitize('<a href="javascript:alert(1)">link</a>');
    expect(out).not.toContain("javascript:");
    expect(out).toContain("link");
  });

  it("removes onerror from img", () => {
    const out = sanitize('<img src="x.png" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
    expect(out).toContain('src="x.png"');
  });

  it("removes disallowed tags (iframe, form) but keeps their safe text", () => {
    const out = sanitize("<iframe src='x'></iframe><form><p>keep</p></form>");
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<form");
    expect(out).toContain("keep");
  });
});

describe("sanitize — preserves email markup", () => {
  it("keeps inline styles, bgcolor, width and class attributes", () => {
    const input = '<table class="content-table" width="100%" bgcolor="#ffffff"><tr><td style="color:#000000;padding-top:14px;">x</td></tr></table>';
    const out = sanitize(input);
    expect(out).toContain('class="content-table"');
    expect(out).toContain('bgcolor="#ffffff"');
    expect(out).toContain("color:#000000");
  });

  it("keeps the placeholder href (relative URL)", () => {
    const out = sanitize('<a href="urlhere" target="_blank">link</a>');
    expect(out).toContain('href="urlhere"');
    expect(out).toContain('target="_blank"');
  });

  it("does NOT wrap a fragment in <html>/<body>", () => {
    const out = sanitize("<table><tr><td>x</td></tr></table>");
    expect(out).not.toContain("<html");
    expect(out).not.toContain("<body");
  });

  it("keeps document structure for full-document input", () => {
    const input = "<html><head><title>t</title></head><body><p>x</p></body></html>";
    const out = sanitize(input);
    expect(out).toContain("<html");
    expect(out).toContain("<title>t</title>");
  });
});

describe("sanitize — round-trip on convertAdvanced output", () => {
  const RAW = `
    <h1 style="text-align:center;">Title</h1>
    <p>Body with <b>bold</b>, <em>italic</em> and <a href="https://x.com">a link</a>.</p>
    <p><span><img src="https://lh7.googleusercontent.com/abc" alt="Pic"></span></p>
    <h5>Button label</h5>
    <table><tr><td style="background-color:#000000;"><p>alert text</p></td></tr></table>
  `;

  it("preserves all content markers of the pipeline output", () => {
    const html = convertAdvanced(RAW);
    const out = sanitize(html);
    for (const marker of [
      "Title", "Body with", "bold", "italic", "a link",
      "https://lh7.googleusercontent.com/abc", 'alt="Pic"',
      "Button label", "alert text",
    ]) {
      expect(out).toContain(marker);
    }
  });

  it("preserves structural attributes (styles, classes, bgcolor, role)", () => {
    const html = convertAdvanced(RAW);
    const out = sanitize(html);
    expect(out).toContain('role="presentation"');
    expect(out).toContain("font-family:");
    expect(out).toContain("bgcolor=");
    expect(out).toContain('class="primary-table-limit content-table"');
  });

  it("does not add a document wrapper around the fragment", () => {
    const out = sanitize(convertAdvanced("<p>x</p>"));
    expect(out).not.toContain("<html");
    expect(out).not.toContain("<body");
  });
});

// ── Wired into the pipeline via the { sanitize } option ───────────────────────

describe("convertAdvancedDetailed — sanitize option", () => {
  it("is off by default: output is not reserialized (no <tbody> injected)", () => {
    const { html } = convertAdvancedDetailed("<p>hello</p>");
    expect(html).not.toContain("<tbody");
  });

  it("runs the DOMPurify pass when { sanitize: true }", () => {
    const { html } = convertAdvancedDetailed("<p>hello</p>", {}, undefined, { sanitize: true });
    // DOMPurify reserialization injects <tbody> — a reliable marker the pass ran
    expect(html).toContain("<tbody");
    expect(html).toContain("hello");
  });

  it("convertAdvanced forwards the sanitize option", () => {
    expect(convertAdvanced("<p>x</p>", {}, { sanitize: true })).toContain("<tbody");
    expect(convertAdvanced("<p>x</p>")).not.toContain("<tbody");
  });
});
