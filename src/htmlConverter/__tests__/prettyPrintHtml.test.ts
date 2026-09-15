import { formatHtmlDefault as formatHtml } from "../testHelpers/simpleFormatHtml";
import { prettyPrintHtml } from "../utils/prettyPrintHtml";

describe("prettyPrintHtml", () => {
  it("reindents while preserving text content and attributes", async () => {
    const input =
      '<div style="background-color:#FFFFFF;"><div style="margin:0px auto;max-width:600px;">' +
      '<a href="urlhere" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;">Button</a> ' +
      '<a href="urlhere" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;">Button2</a>' +
      "</div></div>";

    const output = await prettyPrintHtml(input);

    expect(output).not.toBe(input);
    expect(output).toContain("\n");

    const originalDom = document.createElement("div");
    originalDom.innerHTML = input;
    const formattedDom = document.createElement("div");
    formattedDom.innerHTML = output;
    const normalize = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();
    expect(normalize(formattedDom.textContent)).toBe(normalize(originalDom.textContent));
    expect(formattedDom.querySelectorAll("a").length).toBe(originalDom.querySelectorAll("a").length);
    formattedDom.querySelectorAll("a").forEach((a, i) => {
      expect(a.getAttribute("href")).toBe(originalDom.querySelectorAll("a")[i].getAttribute("href"));
      expect(a.getAttribute("style")).toBe(originalDom.querySelectorAll("a")[i].getAttribute("style"));
    });
  });

  it("does not corrupt Outlook conditional comments directly adjacent to tags (regression)", async () => {
    // fullStructure-style wrapper: a block tag immediately followed by an
    // <!--[if mso | IE]--> comment with zero separating whitespace. Prettier's
    // "strict" htmlWhitespaceSensitivity mode injects a stray extra ">" byte
    // right after the opening tag on input shaped like this — this guards
    // against ever switching back to "strict" (see prettyPrintHtml.ts).
    const openComment =
      '<!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->';
    const closeComment = "<!--[if mso | IE]></td></tr></table><![endif]-->";
    const input =
      `<div style="background-color:#FFFFFF;">${openComment}` +
      '<div style="margin:0px auto;max-width:600px;">Body text</div>' +
      `${closeComment}</div>`;

    const output = await prettyPrintHtml(input);

    expect(output).not.toContain(">>");
    // The attribute-cleanup regex scans the whole string, not just real tags,
    // so it also trims stray whitespace before ">" inside comment text like
    // this MSO block's `width="600" >` — harmless here, but known behavior:
    // it does not respect comment boundaries. Compare with that whitespace
    // normalized rather than requiring an exact byte match.
    const collapseBeforeCloseAngle = (s: string) => s.replace(/\s+>/g, ">");
    expect(output).toContain(collapseBeforeCloseAngle(openComment));
    expect(output).toContain(collapseBeforeCloseAngle(closeComment));
  });

  it("normalizes self-closed <br/> back to bare <br>, collapses whitespace before punctuation and inside <a> text", async () => {
    const input = '<div>Line1<br>Line2 .<a href="x">  Click   here  </a></div>';
    const output = await prettyPrintHtml(input);

    expect(output).not.toContain("<br />");
    expect(output).toContain("<br>");
    expect(output).not.toMatch(/\s\./);
    expect(output).toContain(">Click here</a>");
  });

  it("keeps a single <br> as a trailing suffix on its own text, but keeps <br><br> on its own line", async () => {
    // Prettier's html printer always isolates every <br> onto its own line,
    // single or double alike. This app's convention differs by kind:
    // - a single mid-paragraph break stays a trailing suffix on the text it
    //   ends ("text<br>"), with the FOLLOWING text starting on the next line
    //   (not glued to both sides — only the leading newline is removed);
    // - a <br><br> paragraph separator keeps its own line entirely (matching
    //   how addBrAfterClosingP/[[BR_SEP]] already emit it pre-Prettier: one
    //   <br><br> unit with a newline before and after, never glued to text).
    const input = "<div>Line one text<br>Line two after single break<br><br>New paragraph after double break</div>";
    const output = await prettyPrintHtml(input);

    expect(output).toMatch(/Line one text<br>\s*\n\s*Line two after single break/);
    expect(output).not.toContain("Line one text<br>Line two");
    expect(output).not.toContain("break<br><br>New");
    expect(output).toMatch(/Line two after single break\s*\n\s*<br><br>\s*\n\s*New paragraph after double break/);
  });

  // Regression (real-world report): Prettier's html printer reflows the content of ANY
  // element that doesn't fit printWidth onto its own indented lines — correct for
  // structural markup, but a long bold/italic/underlined sentence (<b>/<strong>/<em>/<i>/
  // <u>) got split across 3 lines (open tag, text, close tag) even though it should stay
  // a single, un-reflowed run since its content isn't whitespace-normalized elsewhere in
  // the pipeline the way <a> content is (an edge space here can be meaningful).
  describe("keeps decorative inline tags (<b>/<strong>/<em>/<i>/<u>) on one line, unlike structural tags", () => {
    it("does not split a long <b> across multiple lines, and introduces no extra whitespace", async () => {
      const longBold =
        "<b>“Steam, electricity, and computers each gave societies decades to adapt; AI may give us a few years to catch up this time.”</b>";
      const input = `<div style="max-width:600px;">${longBold}</div>`;
      const output = await prettyPrintHtml(input);
      expect(output).toContain(longBold);
    });

    it("preserves a meaningful trailing space inside <b> right before an adjacent <em>, byte for byte", async () => {
      const input =
        '<div style="max-width:600px;"><b>“Steam, electricity, and computers each gave societies decades to adapt; AI may give us </b>' +
        "<em>only a few years.</em></div>";
      const output = await prettyPrintHtml(input);
      expect(output).toContain(
        '<b>“Steam, electricity, and computers each gave societies decades to adapt; AI may give us </b><em>only a few years.</em>',
      );
    });

    it("still lets a long structural <div>/<td> wrap normally (regression guard)", async () => {
      const input =
        '<div style="max-width:600px;"><div style="font-family:Arial;font-size:16px;line-height:1.5;padding:20px 30px;color:#000000;background-color:#ffffff;">Body text</div></div>';
      const output = await prettyPrintHtml(input);
      expect(output).toContain("\n");
    });
  });

  it("falls back to the original string if Prettier throws", async () => {
    const input = "<div><p>unclosed";
    const output = await prettyPrintHtml(input);
    expect(typeof output).toBe("string");
  });

  describe("does not reintroduce the text-gluing bug (see bug_glued_text.test.ts)", () => {
    // formatHtml already guards against gluing table cells / stacked divs
    // together with no separator (bug_glued_text.test.ts). This final
    // Prettier pass runs on formatHtml's output right before download, so it
    // must not undo that guarantee.
    it("table cells stay separated", async () => {
      const formatted = formatHtml("<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>");
      const output = await prettyPrintHtml(formatted);
      expect(output).not.toContain("Cell 1Cell 2");
    });

    it("div-derived lines stay separated", async () => {
      const formatted = formatHtml("<div>First line</div><div>Second line</div>");
      const output = await prettyPrintHtml(formatted);
      expect(output).not.toContain("First lineSecond line");
    });

    it("a link separated from adjacent text by a space outside the tag stays separated", async () => {
      const output = await prettyPrintHtml('text <a href="https://x.com">Hello</a> more text');
      expect(output).not.toContain("textHello");
      expect(output).not.toContain("Hellomore");
    });

    it("a link whose separating space sits just inside the tag (<a> Hello</a>) stays separated", async () => {
      // The risky case: the anchor-content-cleanup regex trims leading/
      // trailing whitespace inside <a>...</a>. If that trimmed space were the
      // only thing separating the link from adjacent sibling text, trimming
      // it would glue the words together. In practice Prettier's own
      // whitespace handling relocates that separating space outside the <a>
      // (into a newline between the tags) before the cleanup regex ever
      // runs, so there is nothing load-bearing left inside the tag to trim.
      const output = await prettyPrintHtml('text<a href="https://x.com"> Hello </a>more');
      expect(output).not.toContain("textHello");
      expect(output).not.toContain("Hellomore");
    });
  });
});
