import { profile as alphaoneProfile } from "../profiles/alphaone";
import { profile as defaultProfile } from "../profiles/default";
import { profile as redProfile } from "../profiles/red";
import { profile as tttProfile } from "../profiles/ttt";
import { buildSimpleTemplates } from "../config/templates";
import { mergeSimpleTokens, tokens } from "../config/tokens";
import { formatHtml, formatMjml } from "../formatter";

const PROFILES = [
  { name: "default", tok: mergeSimpleTokens(tokens, defaultProfile) },
  { name: "ttt", tok: mergeSimpleTokens(tokens, tttProfile) },
  { name: "alphaone", tok: mergeSimpleTokens(tokens, alphaoneProfile) },
  { name: "red", tok: mergeSimpleTokens(tokens, redProfile) },
].map((p) => ({ ...p, tmpl: buildSimpleTemplates(p.tok) }));

describe("simple converter unified formatter", () => {
  describe.each(PROFILES)("$name profile", ({ tok, tmpl }) => {
    describe("formatHtml", () => {
      it("transforms h1 into a headline block using this profile's tag/fontSize", () => {
        const result = formatHtml("<h1>Welcome to Newsletter</h1>", tok, tmpl);
        expect(result).toContain("Welcome to Newsletter");
        expect(result).toContain(`font-size:${tok.headlineFontSize}`);
        expect(result).toContain(`<${tok.headlineWrapTag}`);
      });

      it("transforms h5 into a button using this profile's color/class", () => {
        const result = formatHtml("<h5>Click Me</h5>", tok, tmpl);
        expect(result).toContain("Click Me");
        expect(result).toContain(`background-color: ${tok.color.button}`);
        expect(result).toContain(`class="${tok.button.className}"`);
      });

      it("centers text (centerText template)", () => {
        const result = formatHtml('<p style="text-align: center">Centered Text</p>', tok, tmpl);
        expect(result).toContain("Centered Text");
        expect(result).toContain("text-align:center");
      });

      it("handles small text (smallText template)", () => {
        const result = formatHtml("<h6>Small Print</h6>", tok, tmpl);
        expect(result).toContain("Small Print");
        expect(result).toContain("font-size:12px");
      });

      it("handles quotes with shared 20px padding (not profile-specific)", () => {
        const result = formatHtml("<h4>Inspirational Quote</h4>", tok, tmpl);
        expect(result).toContain("Inspirational Quote");
        expect(result).toContain("padding-left: 20px");
      });

      it("handles right side image using this profile's storageUrl", () => {
        const result = formatHtml("i-r-sImage Texti-r-s-e", tok, tmpl);
        expect(result).toContain("Image Text");
        expect(result).toContain('align="right"');
        expect(result).toContain("float: right");
        expect(result).toContain(`src="${tok.storageUrl}"`);
      });

      it("handles footer block using this profile's footerPaddingTopHtml", () => {
        const result = formatHtml("ftr-sFooter Contentftr-e", tok, tmpl);
        expect(result).toContain("Footer Content");
        expect(result).toContain(`padding-top: ${tok.footerPaddingTopHtml}`);
        expect(result).toContain("font-size:12px");
      });

      it("transforms signature placeholders using this profile's width/className", () => {
        const result = formatHtml("sign-iMy Signaturesign-i-e", tok, tmpl);
        expect(result).toContain('alt="Signature"');
        expect(result).toContain(`width="${tok.signature.widthHtml}"`);
        expect(result).toContain(`class="${tok.signature.className}"`);
      });

      it("wraps images in this profile's structure, using storageUrl", () => {
        const result = formatHtml('<img src="image.jpg" alt="test">', tok, tmpl);
        expect(result).toContain(`src="${tok.storageUrl}"`);
      });

      it("handles mixed content", () => {
        const result = formatHtml("<h1>Title</h1><p>Text</p><h5>Button</h5>", tok, tmpl);
        expect(result).toContain("Title");
        expect(result).toContain("Text");
        expect(result).toContain("Button");
      });

      it("converts blue text to a link even when background-color appears later in style", () => {
        const result = formatHtml('<p><span style="color: rgb(17,85,204); background-color: rgb(255,255,255);">Blue Link Text</span></p>', tok, tmpl);
        expect(result).toContain("Blue Link Text");
        expect(result).toContain(`href="${tok.placeholderHref}"`);
        expect(result).toContain(`color: ${tok.color.link}`);
      });

      it("does not convert text when only background-color is blue but text color is not", () => {
        const result = formatHtml('<p><span style="color: rgb(34,34,34); background-color: rgb(17,85,204);">Not A Link</span></p>', tok, tmpl);
        expect(result).toContain("Not A Link");
        expect(result).not.toContain(`href="${tok.placeholderHref}"`);
      });

      it("produces a single <br> when § is at the end of bold text followed by a native <br>", () => {
        const input =
          '<span style="font-weight:700">bank accounts frozen overnight…§</span><span style="font-weight:700"><br /></span><span style="font-weight:700">foreign reserves seized…§</span><span style="font-weight:700"><br /></span><span>normal text</span>';
        const result = formatHtml(input, tok, tmpl);
        expect(result).not.toMatch(/<br>\s*<\/b>\s*<br>/i);
        expect(result).toContain("<b>bank accounts frozen overnight…</b>");
        expect(result).toContain("<b>foreign reserves seized…</b>");
      });
    });

    describe("formatMjml", () => {
      it("transforms h1 into a headline block", () => {
        const result = formatMjml("<h1>Welcome to Newsletter</h1>", tok, tmpl);
        expect(result).toContain("Welcome to Newsletter");
        expect(result).toContain(`font-size:${tok.headlineFontSize}`);
      });

      it("transforms h5 into a button using this profile's color", () => {
        const result = formatMjml("<h5>Click Me</h5>", tok, tmpl);
        expect(result).toContain("Click Me");
        expect(result).toContain(`background-color: ${tok.color.button}`);
      });

      it("wraps images using storageUrl", () => {
        const result = formatMjml('<img src="image.jpg" alt="test">', tok, tmpl);
        expect(result).toContain(`src="${tok.storageUrl}"`);
      });
    });
  });

  describe("detectItalicNativeLinks — only the default profile wraps native italic <a> links in <em>", () => {
    const defaultCase = PROFILES.find((p) => p.name === "default")!;
    const tttCase = PROFILES.find((p) => p.name === "ttt")!;
    const alphaoneCase = PROFILES.find((p) => p.name === "alphaone")!;
    const redCase = PROFILES.find((p) => p.name === "red")!;
    const input = '<a href="https://example.com"><span style="font-style: italic;">italic link</span></a>';

    it("default wraps the native link text in <em>", () => {
      const result = formatHtml(input, defaultCase.tok, defaultCase.tmpl);
      expect(result).toContain("<em>italic link</em>");
    });

    it("ttt does NOT wrap the native link text in <em>", () => {
      const result = formatHtml(input, tttCase.tok, tttCase.tmpl);
      expect(result).toContain(">italic link<");
      expect(result).not.toContain("<em>italic link</em>");
    });

    it("alphaone does NOT wrap the native link text in <em>", () => {
      const result = formatHtml(input, alphaoneCase.tok, alphaoneCase.tmpl);
      expect(result).toContain(">italic link<");
      expect(result).not.toContain("<em>italic link</em>");
    });

    it("red does NOT wrap the native link text in <em>", () => {
      const result = formatHtml(input, redCase.tok, redCase.tmpl);
      expect(result).toContain(">italic link<");
      expect(result).not.toContain("<em>italic link</em>");
    });
  });

  describe("blockWrapTag — span for default/red, div for ttt/alphaone", () => {
    it.each(PROFILES)("$name wraps body content in the expected tag", ({ name, tok, tmpl }) => {
      const result = formatHtml("<p>Body text</p>", tok, tmpl);
      const expectedTag = name === "default" || name === "red" ? "span" : "div";
      expect(tok.blockWrapTag).toBe(expectedTag);
      expect(result).toContain(`<${expectedTag}`);
    });
  });
});
