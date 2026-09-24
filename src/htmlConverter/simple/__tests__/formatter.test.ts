import { buildSimpleTemplates } from "../config/templates";
import { mergeSimpleTokens, tokens } from "../config/tokens";
import { formatHtml, formatMjml } from "../formatter";
import { profile as alphaoneProfile } from "../profiles/alphaone";
import { profile as defaultProfile } from "../profiles/default";
import { profile as redProfile } from "../profiles/red";
import { profile as tttProfile } from "../profiles/ttt";

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

      describe("preserveTextColors (experimental)", () => {
        it("maps a bright red span to the fixed red token when the flag is on", () => {
          const result = formatHtml('<p><span style="color: #FF0000;">Red Text</span></p>', tok, tmpl, undefined, true);
          expect(result).toContain("Red Text");
          expect(result).toContain(`color:${tok.color.red}`);
          expect(result).not.toContain("#FF0000");
        });

        it("maps a muted/dark green span to the fixed green token when the flag is on", () => {
          const result = formatHtml('<p><span style="color: #2F4F2F;">Green Text</span></p>', tok, tmpl, undefined, true);
          expect(result).toContain("Green Text");
          expect(result).toContain(`color:${tok.color.green}`);
          expect(result).not.toContain("#2F4F2F");
        });

        it("carries the bucket color onto bold/italic/underline spans too", () => {
          const result = formatHtml('<p><span style="color: #CC0000; font-weight: 700;">Bold Red</span></p>', tok, tmpl, undefined, true);
          expect(result).toContain("Bold Red");
          expect(result).toContain("<b");
          expect(result).toContain(`color:${tok.color.red}`);
        });

        it("leaves grayscale/black text untouched even when the flag is on", () => {
          const withFlag = formatHtml('<p><span style="color: #333333;">Gray Text</span></p>', tok, tmpl, undefined, true);
          const withoutFlag = formatHtml('<p><span style="color: #333333;">Gray Text</span></p>', tok, tmpl);
          expect(withFlag).toBe(withoutFlag);
        });

        it("leaves colors outside the red/green buckets untouched even when the flag is on", () => {
          const withFlag = formatHtml('<p><span style="color: #FFA500;">Orange Text</span></p>', tok, tmpl, undefined, true);
          const withoutFlag = formatHtml('<p><span style="color: #FFA500;">Orange Text</span></p>', tok, tmpl);
          expect(withFlag).toBe(withoutFlag);
        });

        it("still converts blue text to a link (not a colored span) when the flag is on", () => {
          const result = formatHtml('<p><span style="color: rgb(17,85,204);">Blue Link Text</span></p>', tok, tmpl, undefined, true);
          expect(result).toContain("Blue Link Text");
          expect(result).toContain(`href="${tok.placeholderHref}"`);
          expect(result).not.toContain(`color:${tok.color.red}`);
          expect(result).not.toContain(`color:${tok.color.green}`);
        });

        it("is a no-op (identical to today's output) when the flag is left off", () => {
          const withoutArg = formatHtml('<p><span style="color: #FF0000;">Red Text</span></p>', tok, tmpl);
          const explicitlyOff = formatHtml('<p><span style="color: #FF0000;">Red Text</span></p>', tok, tmpl, undefined, false);
          expect(withoutArg).toBe(explicitlyOff);
          expect(withoutArg).not.toContain(tok.color.red);
        });

        // Bug fix: a bare <b style="color:..."> (Mail.app/Safari paste sometimes uses the
        // <b> tag itself as the ONLY carrier of its own style, no inner <span> to fall
        // back on — see the case (b) comment on this same regex in formatter.ts) never
        // resolved its color, unlike the visually-equivalent <span style="font-weight:700;
        // color:...">, which correctly does via resolveBucketColor.
        it("resolves the bucket color on a bare <b style=\"color:...\"> with no wrapping span", () => {
          const result = formatHtml('<p><b style="color: #CC0000;">Warning</b></p>', tok, tmpl, undefined, true);
          expect(result).toContain("Warning");
          expect(result).toContain("<b");
          expect(result).toContain(`color:${tok.color.red}`);
        });
      });

      // Regression (real-world report): the native-link regex used to require an
      // http(s):// href specifically. The captured href VALUE is never actually used
      // below — every link's real destination is discarded in favor of
      // tok.placeholderHref regardless of what it was — so that restriction only ever
      // served to silently drop a common real-world pattern: an author's own
      // placeholder marker (e.g. `href="[insert link]"`) standing in for a link whose
      // real URL hasn't been generated yet. Since nothing captured it into savedLinks,
      // the unconditional `<a>`-tag strip a few lines below removed the tag entirely,
      // leaving plain unlinked text with no href, no styling, and no way to tell a
      // link was ever there.
      describe("native <a href> links whose href is not an http(s) URL", () => {
        it("still converts a link whose href is an author placeholder marker (e.g. [insert link])", () => {
          const result = formatHtml('<p>Something strange lurks in <a href="[insert link]">financial disclosures</a>.</p>', tok, tmpl);
          expect(result).toContain(`href="${tok.placeholderHref}"`);
          expect(result).toContain("financial disclosures");
          expect(result).not.toContain("[insert link]");
        });

        it("still converts a mailto: link", () => {
          const result = formatHtml('<p><a href="mailto:someone@example.com">email us</a></p>', tok, tmpl);
          expect(result).toContain(`href="${tok.placeholderHref}"`);
          expect(result).toContain("email us");
        });

        it("does not create a link for a bare bookmark anchor with no href at all", () => {
          const result = formatHtml('<p><a name="section1">Section One</a></p>', tok, tmpl);
          expect(result).not.toContain(`href="${tok.placeholderHref}"`);
          expect(result).toContain("Section One");
        });
      });

      it("produces a single <br> when § is at the end of bold text followed by a native <br>", () => {
        const input =
          '<span style="font-weight:700">bank accounts frozen overnight…§</span><span style="font-weight:700"><br /></span><span style="font-weight:700">foreign reserves seized…§</span><span style="font-weight:700"><br /></span><span>normal text</span>';
        const result = formatHtml(input, tok, tmpl);
        expect(result).not.toMatch(/<br>\s*<\/b>\s*<br>/i);
        expect(result).toContain("<b>bank accounts frozen overnight…</b>");
        expect(result).toContain("<b>foreign reserves seized…</b>");
      });

      // Regression: Google Docs wraps a standalone image in its OWN styled <span> (e.g.
      // text-decoration:underline carried over from an adjacent link run). processStyles
      // used to convert that into <u><img/></u> BEFORE wrapTextInBlock replaces the <img>
      // with its whole multi-row table block — splitting <u>/</u> across table row
      // boundaries and rendering as a stray empty block.
      it("does not leave a stray <u>/<b>/<em> tag when a styled span's only content is an image", () => {
        const underlineOnly = formatHtml('<p><span style="text-decoration:underline;">' + '<img src="photo.jpg" width="400" height="300"></span></p>', tok, tmpl);
        expect(underlineOnly).not.toMatch(/<u>/i);
        expect(underlineOnly).not.toMatch(/<\/u>/i);

        const boldOnly = formatHtml('<p><span style="font-weight:700;">' + '<img src="photo.jpg" width="400" height="300"></span></p>', tok, tmpl);
        expect(boldOnly).not.toMatch(/<b>/i);
        expect(boldOnly).not.toMatch(/<\/b>/i);
      });

      // Regression: Google Docs sometimes encodes the ONLY space between a link and the
      // word right after it as its own bold, non-underlined <span> (e.g. "...common food"
      // </link><span style="font-weight:700"> </span>"that most certainly..."). The
      // whitespace-only-tag cleanup used to delete that span's tag AND its space, gluing
      // "food" and "that" together with no separator at all.
      it("preserves the word gap when a link is immediately followed by a whitespace-only bold span", () => {
        const input =
          '<p><span style="color: rgb(17,85,204);">a common food</span>' +
          '<span style="font-weight:700;"> </span>' +
          "<span>that follows</span></p>";
        const result = formatHtml(input, tok, tmpl);
        expect(result).toMatch(/food<\/a>\s+that follows/);
        expect(result).not.toContain("food</a>that");
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

    // italicTag — "em" everywhere except Red ("i"), confirmed against the original
    // pre-unification forks' git history (default/ttt always used <em>) and the user
    // confirming Red's ported standalone script needs <i> specifically.
    it("wraps italic content in this profile's italicTag", () => {
      const result = formatHtml('<span style="font-style: italic;">italic text</span>', tok, tmpl);
      expect(result).toContain(`<${tok.italicTag}>italic text</${tok.italicTag}>`);
      if (tok.italicTag !== "em") {
        expect(result).not.toMatch(/<\/?em[\s>]/i);
      }
    });

    // Regression: content pasted from a plain web page / Mail.app (not Google Docs) uses
    // raw semantic tags — <strong>, <center>, <blockquote> — that Google Docs paste never
    // emits. Nothing in processStyles used to handle them, so they leaked through
    // unprocessed, and <center>/<blockquote> in particular broke the output table's
    // <tr>/<td> nesting since their open/close tags landed on opposite sides of templates
    // applied in between.
    describe("raw HTML paste (non-GDocs) handling", () => {
      it("converts <strong> to this pipeline's own <b> instead of leaking it through raw", () => {
        const result = formatHtml("<p><strong>bold</strong> text</p>", tok, tmpl);
        expect(result).not.toMatch(/<\/?strong/i);
        expect(result).toContain("<b>bold</b>");
      });

      // Regression (real-world report): Mail.app/Safari-style paste uses a bare <b> as the
      // SOLE carrier of the bold semantic — its own style attribute never declares
      // font-weight, and there's no accompanying font-weight:700 span for the span-style
      // parser to regenerate a <b> from. processStyles used to strip every <b> tag
      // unconditionally (an assumption valid only for genuine Google Docs paste, which
      // always backs a raw <b> with an inner font-weight:700 span), silently dropping the
      // bold text from the final document.
      it("keeps a bare <b> as bold when it is the only carrier of the bold semantic (Mail.app/Safari paste)", () => {
        const input =
          '<b style="color: rgb(0, 0, 0); font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; white-space: normal;">P.S.</b>' +
          '<span style="color: rgb(0, 0, 0); font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; font-weight: 400; display: inline !important;"> Larry has only two trading rules:</span>';
        const result = formatHtml(input, tok, tmpl);
        expect(result).toContain("<b>P.S.</b>");
        expect(result).toContain("Larry has only two trading rules:");
        expect(result).not.toContain("<b>Larry has only two trading rules");
      });

      it("still strips a raw <b> that merely wraps a font-weight:700 span (redundant GDocs nesting, regression guard)", () => {
        const result = formatHtml('<b><span style="font-weight:700;">bold</span></b>', tok, tmpl);
        expect(result).toContain("<b>bold</b>");
        expect(result).not.toMatch(/<b>\s*<b>/i);
      });

      // Regression (real-world report, same Mail.app/Safari-style document as above): two
      // SEPARATE bare <b> runs sitting in the same paragraph, with plain text between them —
      // guards the non-greedy pairing in the fix above against accidentally spanning from the
      // first <b>'s opening tag all the way to the SECOND <b>'s closing tag.
      it("keeps multiple separate bare <b> runs bold within the same paragraph (real-world report)", () => {
        const result = formatHtml(
          '<p>It goes on to warn of <b>an unprecedented transformation of our economy</b> with <b>large-scale job displacement.</b></p>',
          tok,
          tmpl,
        );
        expect(result).toContain("<b>an unprecedented transformation of our economy</b>");
        expect(result).toContain("<b>large-scale job displacement.</b>");
        expect(result).toContain("with");
      });

      it("carries italic/underline from a bare <b>'s own style when it is the sole carrier of bold (Mail.app/Safari paste)", () => {
        const result = formatHtml('<b style="font-style: italic;">bold italic</b>', tok, tmpl);
        expect(result).toContain(`<b style="font-style: italic;">bold italic</b>`);
      });

      it("unwraps <center> around an image without breaking the image's own block template", () => {
        const result = formatHtml('<center><a href="https://example.com/x"><img src="photo.jpg" width="300" height="250"></a></center>', tok, tmpl);
        expect(result).not.toMatch(/<\/?center/i);
        expect(result).toContain(`src="${tok.storageUrl}"`);
        // No <tr> should ever end up nested inside a <span> — the corruption this guards against.
        expect(result).not.toMatch(/<span[^>]*>(?:(?!<\/span>)[\s\S])*<tr/i);
      });

      it("converts <center> around plain text into the existing text-align:center convention", () => {
        const result = formatHtml("<center>Centered Text</center>", tok, tmpl);
        expect(result).not.toMatch(/<\/?center/i);
        expect(result).toContain("Centered Text");
        expect(result).toContain("text-align:center");
      });

      it("unwraps <blockquote>, leaving its own text-align:center paragraph to be picked up normally", () => {
        const result = formatHtml('<blockquote><p style="text-align: center;"><em>A quote</em></p></blockquote>', tok, tmpl);
        expect(result).not.toMatch(/<\/?blockquote/i);
        expect(result).toContain(`<${tok.italicTag}>A quote</${tok.italicTag}>`);
        expect(result).toContain("text-align:center");
      });

      // Regression (real-world report): Mail.app/Safari-style paste sometimes marks a
      // centered paragraph with the legacy HTML `align="center"` attribute instead of a
      // `text-align:center` style declaration — e.g. `<p align="center" style="...(no
      // text-align at all)...">`. Every centering check in this pipeline only ever looked
      // inside the style attribute, so the align attribute was silently ignored and the
      // paragraph rendered left-aligned.
      describe("align=\"center\" attribute (non-GDocs, no text-align in style)", () => {
        it("centers a <p align=\"center\"> whose style never declares text-align", () => {
          const result = formatHtml('<p align="center" style="color: rgb(0,0,0); font-family: Times;"><b>“Steam, electricity, and computers…”</b></p>', tok, tmpl);
          expect(result).toContain("text-align:center");
          expect(result).toContain("Steam, electricity, and computers");
        });

        it("centers a <p align='center'> with no style attribute at all", () => {
          const result = formatHtml("<p align='center'>Centered Text</p>", tok, tmpl);
          expect(result).toContain("text-align:center");
          expect(result).toContain("Centered Text");
        });

        it("lets an explicit conflicting text-align in style win over a stray align attribute", () => {
          const result = formatHtml('<p align="center" style="text-align:left;">Left after all</p>', tok, tmpl);
          expect(result).not.toContain("text-align:center");
        });

        it("does not center a paragraph with no align attribute (regression guard)", () => {
          const result = formatHtml('<p style="text-align:start;">Not centered</p>', tok, tmpl);
          expect(result).not.toContain("text-align:center");
        });
      });

      it("handles a mixed raw-HTML paste (paragraph + centered image + blockquote) end to end without leaking source tags", () => {
        const input =
          '<p style="color: rgb(0,0,0);"><strong>Intro:</strong> Some opening text.</p>' +
          '<center><a href="https://example.com/link"><img src="picture.png" width="300" height="250"></a></center>' +
          '<blockquote><p style="text-align: center;"><em>Some quoted text</em></p></blockquote>' +
          '<p>More body text with a <strong>bold</strong> word.</p>';
        const result = formatHtml(input, tok, tmpl);
        expect(result).not.toMatch(/<\/?strong/i);
        expect(result).not.toMatch(/<\/?center/i);
        expect(result).not.toMatch(/<\/?blockquote/i);
        expect(result).toContain("Intro:");
        expect(result).toContain("Some quoted text");
        expect(result).toContain(`src="${tok.storageUrl}"`);
      });
    });

    // A <p style="padding-left:...">-indented paragraph from raw paste is this pipeline's
    // existing "Відступ" (H4/quote) convention in disguise — route it through the exact
    // same template rather than inventing a new one.
    describe("padding-left paragraph reuses the <h4> quote template", () => {
      it("renders identically to the equivalent <h4> markup once the indent meets the threshold", () => {
        const viaPaddingLeft = formatHtml('<p style="padding-left: 30px;">Quoted text</p>', tok, tmpl);
        const viaH4 = formatHtml("<h4>Quoted text</h4>", tok, tmpl);
        expect(viaPaddingLeft).toBe(viaH4);
      });

      it("does not convert a small, incidental padding-left below the threshold", () => {
        const result = formatHtml('<p style="padding-left: 5px;">Not a quote</p>', tok, tmpl);
        expect(result).not.toMatch(/<\/?h4/i);
        expect(result).toContain("Not a quote");
      });

      it("leaves an ordinary paragraph with no padding untouched", () => {
        const result = formatHtml("<p>Regular text, no padding</p>", tok, tmpl);
        expect(result).not.toMatch(/<\/?h4/i);
        expect(result).toContain("Regular text, no padding");
      });

      it("still centers when the indented paragraph is also text-align:center", () => {
        const result = formatHtml('<p style="padding-left: 30px; text-align: center;">Centered quote</p>', tok, tmpl);
        expect(result).toContain("text-align:center");
        expect(result).toContain("Centered quote");
      });
    });

    // Google Docs paste never nests raw <em>/<strong>/<b>/<i>/<u> tags — it always emits
    // ONE flat <span style="..."> per run — so genuine nesting only shows up in content
    // pasted from elsewhere (a plain web page, Mail.app). flattenNestedFormatting merges
    // it into the same <span style="..."> convention the existing span parser already
    // understands, rather than leaking raw nested tags or duplicating that parser's logic.
    describe("nested inline formatting merge", () => {
      it("merges <em><strong> nesting into one combined bold+italic tag", () => {
        const result = formatHtml("<p><em><strong>bold italic</strong></em></p>", tok, tmpl);
        expect(result).not.toMatch(/<\/?strong/i);
        expect(result).not.toMatch(/<em>\s*<b/i);
        expect(result).toContain(`<b style="font-style: italic;">bold italic</b>`);
      });

      it("propagates ambient italic from an ancestor onto a native link's text", () => {
        const result = formatHtml('<p><em><strong>Note: </strong>text <strong><a href="https://example.com/x">Click here</a></strong></em></p>', tok, tmpl);
        expect(result).toContain(`<b style="font-style: italic;">Note: </b>`);
        expect(result).toContain(`<${tok.italicTag}>text </${tok.italicTag}>`);
        expect(result).toContain(`<${tok.italicTag}>Click here</${tok.italicTag}>`);
        expect(result).not.toMatch(/<\/?strong/i);
      });

      it("does not italicize an entire link merely because it wraps an <em> around part of its text (reverse nesting)", () => {
        const result = formatHtml('<p><a href="https://example.com/y"><strong><u>quoted <em>emphasis</em> text</u></strong></a></p>', tok, tmpl);
        expect(result).toContain(`<a href="${tok.placeholderHref}" style="font-family:${tok.fontFamily};text-decoration: underline;font-weight: 700; color: ${tok.color.link};">quoted emphasis text</a>`);
      });

      it("still italicizes the whole link when the ambient <em> covers its entire text (reverse nesting)", () => {
        const result = formatHtml('<p><a href="https://example.com/y"><strong><u><em>quoted emphasis text</em></u></strong></a></p>', tok, tmpl);
        expect(result).toContain(`<a href="${tok.placeholderHref}" style="font-family:${tok.fontFamily};text-decoration: underline;font-weight: 700; color: ${tok.color.link};"><${tok.italicTag}>quoted emphasis text</${tok.italicTag}></a>`);
      });

      // Real-world report: a bold link ("But here is a move you <em>can</em> make...")
      // where only one word inside the link is <em>. The link as a whole should not
      // become italic — italic isn't visually distinct on an already bold+underlined
      // link, so a partial nested <em> is dropped rather than propagated to the whole link.
      it("does not italicize an entire link when a formatting tag wraps it and only part of its text is <em> (real-world report)", () => {
        const result = formatHtml(
          '<p><strong><a href="https://example.com/z">But here is a move you <em>can</em> make to reduce your risk.</a></strong></p>',
          tok,
          tmpl,
        );
        expect(result).toContain(
          `<a href="${tok.placeholderHref}" style="font-family:${tok.fontFamily};text-decoration: underline;font-weight: 700; color: ${tok.color.link};">But here is a move you can make to reduce your risk.</a>`,
        );
        expect(result).not.toMatch(/<a[^>]*>\s*<(?:em|i)\b/i);
      });

      it("leaves a bare, non-nested <em> completely untouched (regression guard)", () => {
        const result = formatHtml("<p>Some <em>plain italic</em> text, no nesting.</p>", tok, tmpl);
        expect(result).toContain(`<${tok.italicTag}>plain italic</${tok.italicTag}>`);
      });

      it("does not affect the existing single-span bold+italic case (regression guard)", () => {
        const result = formatHtml('<p><span style="font-weight:700;font-style:italic;">bold italic</span></p>', tok, tmpl);
        expect(result).toContain(`<b style="font-style: italic;">bold italic</b>`);
      });

      it("does not wrap an image in inline formatting when nested inside a formatting tag with a link sibling", () => {
        const result = formatHtml('<p><em><strong><img src="photo.jpg" width="300" height="250"></strong><a href="https://example.com/z">link text</a></em></p>', tok, tmpl);
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

    // Non-GDocs sources (Mail.app, a plain web page) often style an italic link directly
    // on the <a> tag itself instead of adding a redundant nested <span> — the check above
    // only looked at the link's inner content, missing this shape entirely.
    it("default also wraps the link when italic is declared on the <a> tag's own style, not a nested span", () => {
      const result = formatHtml('<a href="https://example.com" style="font-style: italic;">italic link</a>', defaultCase.tok, defaultCase.tmpl);
      expect(result).toContain("<em>italic link</em>");
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
