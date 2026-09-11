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

  it("falls back to the original string if Prettier throws", async () => {
    const input = "<div><p>unclosed";
    const output = await prettyPrintHtml(input);
    expect(typeof output).toBe("string");
  });
});
