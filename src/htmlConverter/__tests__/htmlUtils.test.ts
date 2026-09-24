import { SYMBOLS } from "../constants";
import { addBrAfterClosingP, addOneBr, cleanEmptyHtmlTags, isSignatureImageTag, mergeSimilarTags, removeStylesFromLists, replaceAllEmojisAndSymbolsExcludingHTML,replaceTripleBrWithSingle } from "../utils/htmlUtils";

describe("htmlConverter utils", () => {
  describe("cleanEmptyHtmlTags", () => {
    it("should remove non-breaking spaces", () => {
      const input = "Hello&nbsp;World";
      expect(cleanEmptyHtmlTags(input)).toBe("Hello World");
    });

    it("should replace whitespace-only bold tags with a space, not delete them", () => {
      const input = "Hello <b>   </b> World";
      expect(cleanEmptyHtmlTags(input)).toBe("Hello   World");
    });

    // Regression: Google Docs sometimes puts the ONLY space between two runs inside its
    // own <b>/<span style="font-weight:700"> wrapper (e.g. between a link and the word
    // right after it). Deleting that tag outright — instead of replacing it with " " —
    // silently glues the surrounding words together (e.g. "food</a>that").
    it("preserves the word gap when the tag's whitespace is the ONLY separator between two words", () => {
      const input = "food<b> </b>that";
      expect(cleanEmptyHtmlTags(input)).toBe("food that");
    });

    it("preserves the word gap for a whitespace-only <u> the same way", () => {
      const input = "food<u> </u>that";
      expect(cleanEmptyHtmlTags(input)).toBe("food that");
    });

    it("should collapse multiple <br> tags into max two", () => {
      const input = "Line 1<br><br><br><br>Line 2";
      expect(cleanEmptyHtmlTags(input)).toBe("Line 1\n<br><br>\nLine 2");
    });

    // Regression: a Google-Docs empty spacer paragraph (<p><br><br></p>) sitting between
    // two real paragraphs, once addBrAfterClosingP has already inserted its own "\n<br><br>\n"
    // after each </p>, leaves a 3+ <br> run with a "\n" already in front of it. The collapse
    // regex's own leading "\n" in its replacement used to stack on top of that pre-existing
    // one, producing a blank line right after the preceding link/text.
    it("does not produce a blank line when a pre-existing newline already precedes the 3+ br run", () => {
      const input = "</a>\n<br><br>\n<br><br>\n<br><br>\nThis ad is sent on behalf of...";
      expect(cleanEmptyHtmlTags(input)).toBe("</a>\n<br><br>\nThis ad is sent on behalf of...");
    });

    // Regression: addBrAfterClosingP only adds a newline around a <br><br> IT synthesizes
    // at a </p> boundary — a <br><br> the source document already had literally typed
    // mid-paragraph (e.g. Google Docs manual line breaks within one big <p>) never got one,
    // so some paragraph breaks in the raw output were spaced and others were glued straight
    // to the surrounding sentences depending purely on where they came from.
    it("adds a newline around a <br><br> that was already there mid-paragraph, not just synthesized ones", () => {
      const input = "First sentence.<br><br>Second sentence.<br><br>Third sentence.";
      expect(cleanEmptyHtmlTags(input)).toBe("First sentence.\n<br><br>\nSecond sentence.\n<br><br>\nThird sentence.");
    });

    // A single <br> follows a different convention than <br><br>: it stays a
    // trailing suffix on the text it ends (flush, no newline before it), while
    // the following text starts fresh on the next line — matching signature-
    // block-style content (name<br>, title<br>, company, one item per line).
    it("keeps a single <br> flush with its preceding text, but starts the next line fresh", () => {
      const input = "Name<br>Title<br>Company";
      expect(cleanEmptyHtmlTags(input)).toBe("Name<br>\nTitle<br>\nCompany");
    });

    it("does not add a newline before/after a single <br> that's part of an already-handled <br><br> pair", () => {
      const input = "text1<br>text2<br><br>text3";
      expect(cleanEmptyHtmlTags(input)).toBe("text1<br>\ntext2\n<br><br>\ntext3");
    });

    it("should remove empty list items", () => {
      const input = "<ul><li>Item 1</li><li>  </li></ul>";
      expect(cleanEmptyHtmlTags(input)).toBe("<ul><li>Item 1</li></ul>");
    });
  });

  describe("isSignatureImageTag", () => {
    it("should return true for image with signature in alt text", () => {
      const input = '<img src="sig.png" alt="My Signature">';
      expect(isSignatureImageTag(input)).toBe(true);
    });

    it("should return false for normal image", () => {
      const input = '<img src="photo.jpg" alt="A nice photo">';
      expect(isSignatureImageTag(input)).toBe(false);
    });
  });

  describe("addOneBr", () => {
    it("should replace § with a single <br>", () => {
      const input = `Line 1${SYMBOLS.ONE_BR}Line 2`;
      const result = addOneBr(input);
      expect(result).toBe("Line 1<br>\nLine 2");
    });

    it("should absorb adjacent native <br> when § is nearby", () => {
      const input = `Text${SYMBOLS.ONE_BR}<br>More`;
      const result = addOneBr(input);
      // § + native <br> should produce only one <br>
      expect(result).toBe("Text<br>\nMore");
    });

    it("should move trailing <br> from inside <b> to outside", () => {
      const input = `<b>bold text<br></b>`;
      const result = addOneBr(input);
      expect(result).toBe("<b>bold text</b><br>\n");
    });

    it("should move trailing <br> from inside <em> to outside", () => {
      const input = `<em>italic text<br></em>`;
      const result = addOneBr(input);
      expect(result).toBe("<em>italic text</em><br>\n");
    });

    it("should move trailing <br> from inside <a> to outside", () => {
      const input = `<a href="#">link text<br></a>`;
      const result = addOneBr(input);
      expect(result).toBe('<a href="#">link text</a><br>\n');
    });

    it("should absorb duplicate <br> after closing formatting tag", () => {
      // <b>text<br></b><br> → <b>text</b><br> (one break, not two)
      const input = `<b>bold text<br></b><br>`;
      const result = addOneBr(input);
      expect(result).toBe("<b>bold text</b><br>\n");
    });

    it("should handle § inside bold: <b>text…§</b><br> → <b>text…</b><br>", () => {
      // After § → <br> replacement: <b>text…<br></b><br> → <b>text…</b><br>
      const input = `<b>bold text${SYMBOLS.ONE_BR}</b><br>`;
      const result = addOneBr(input);
      expect(result).toBe("<b>bold text</b><br>\n");
    });

    it("should strip <br> adjacent to block boundaries", () => {
      const input = `<div><br>content</div>`;
      const result = addOneBr(input);
      expect(result).toBe("<div>content</div>");
    });

    it("should replace a custom symbol instead of §", () => {
      const input = `Line 1~Line 2`;
      const result = addOneBr(input, "~");
      expect(result).toBe("Line 1<br>\nLine 2");
    });

    it("should ignore § when a custom symbol is configured", () => {
      const input = `Line 1${SYMBOLS.ONE_BR}~Line 2`;
      const result = addOneBr(input, "~");
      expect(result).toBe(`Line 1${SYMBOLS.ONE_BR}<br>\nLine 2`);
    });

    it("should fall back to § when given an empty symbol", () => {
      const input = `Line 1${SYMBOLS.ONE_BR}Line 2`;
      const result = addOneBr(input, "");
      expect(result).toBe("Line 1<br>\nLine 2");
    });
  });

  describe("replaceTripleBrWithSingle", () => {
    it("should replace triple breaks with double break", () => {
      const input = "Text<br><br><br>More Text";
      const expected = "Text<br><br>\nMore Text";
      expect(replaceTripleBrWithSingle(input)).toBe(expected);
    });

    it("should handle mixed closing tags and breaks", () => {
      const input = "<div></div><br></div></div>";
      const result = replaceTripleBrWithSingle(input);
      // Only one <br> in input, so the {3,} regex doesn't match — output is unchanged
      expect(result).toBe("<div></div><br></div></div>");
    });
  });

  describe("addBrAfterClosingP", () => {
    it("should add double break after closing p tag", () => {
      const input = "<p>Paragraph 1</p><p>Paragraph 2</p>";
      // We check for the presence of the break sequence
      const result = addBrAfterClosingP(input);
      // The function removes <p> tags and adds <br><br>
      expect(result).toContain("Paragraph 1\n<br><br>\n");
      expect(result).not.toContain("</p>");
    });

    it("should NOT add break inside list items", () => {
      const input = "<li><p>List Item</p></li>";
      const result = addBrAfterClosingP(input);
      expect(result).toBe("<li>List Item</li>"); // Should strip p tags inside li
    });

    it("should strip Google-Docs <br> between </p> and <p>", () => {
      const input = "<p>First</p><br><p>Second</p>";
      const result = addBrAfterClosingP(input);
      // Should have exactly one <br><br> between paragraphs, not triple
      expect(result).toContain("First\n<br><br>\n");
      expect(result).not.toMatch(/<br>\s*<br>\s*<br>/);
    });

    it("should strip Google-Docs <br> between </p> and <ul>", () => {
      const input = "<p>Intro</p><br><ul><li>item</li></ul>";
      const result = addBrAfterClosingP(input);
      // Should NOT have extra <br> between text and list
      expect(result).not.toMatch(/<br>\s*<br>\s*<br>/);
    });

    it("should strip Google-Docs <br><br> between </ul> and <p>", () => {
      const input = "<ul><li>item</li></ul><br><br><p>After list</p>";
      const result = addBrAfterClosingP(input);
      // Should NOT produce triple+ breaks
      expect(result).not.toMatch(/<br>\s*<br>\s*<br>/);
    });
  });

  describe("removeStylesFromLists", () => {
    it("should remove style attributes from ol, ul, and li tags", () => {
      const input = '<ol style="list-style: none;"><li style="color: red;">Item</li></ol>';
      const result = removeStylesFromLists(input);
      expect(result).toContain("<ol>");
      expect(result).not.toContain('style="');
      expect(result).toContain("<li>");
    });
  });

  describe("mergeSimilarTags", () => {
    it("should merge adjacent h1 tags with separator", () => {
      const input = "<h1>Title 1</h1><h1>Title 2</h1>";
      const result = mergeSimilarTags(input);
      expect(result).toContain("[[BR_SEP]]");
    });

    // GDocs pastes an image paragraph and the paragraph right after it with the exact same
    // <p style="..."> when both share the same alignment/margins — e.g. a centered image
    // followed by a centered link. Merging them would splice htmlTemplates.wrapImg's
    // "close current row / open new one" markup mid-block, stranding the trailing paragraph
    // outside its own align wrapper (see formatter.ts's block-wrapper stage).
    it("should NOT merge a <p> containing an <img> with the next identical <p>", () => {
      const input =
        '<p style="text-align: center;"><img src="a.png"/></p><br /><p style="text-align: center;">Link text</p>';
      const result = mergeSimilarTags(input);
      expect(result).not.toContain("[[BR_SEP]]");
      expect(result).toBe(input);
    });

    it("should still merge two identical <p> tags when neither contains an <img>", () => {
      const input = '<p style="text-align: center;">A</p><br /><p style="text-align: center;">B</p>';
      const result = mergeSimilarTags(input);
      expect(result).toContain("[[BR_SEP]]");
    });

    // GDocs footers put every line in its own <tr><td>...</td></tr> row, so the gap between
    // </h6> and the next <h6> is table-row plumbing, not bare whitespace/<br>. mergeSimilarTags
    // runs before processStyles() strips table tags, so it must tolerate that plumbing itself.
    it("should merge footer h6 lines separated by table-row markup", () => {
      const input =
        '<tr><td><h6 style="line-height:1.7;text-align:center;margin-top:12pt;margin-bottom:4pt;">' +
        '<span style="font-size:11pt;">This is an advertisement</span></h6></td></tr>\n' +
        '<tr><td><h6 style="line-height:1.7;text-align:center;margin-top:12pt;margin-bottom:4pt;">' +
        "<span style=\"font-size:9pt;\">America's Gold Company</span></h6></td></tr>\n" +
        '<tr><td><h6 style="line-height:1.7;text-align:center;margin-top:12pt;margin-bottom:4pt;">' +
        '<span style="font-size:9pt;">601 Heritage Drive, Suite 211, Jupiter, FL 33458</span></h6></td></tr>';
      const result = mergeSimilarTags(input);
      expect((result.match(/\[\[BR_SEP\]\]/g) || []).length).toBe(2);
      expect((result.match(/<h6/gi) || []).length).toBe(1);
      expect(result).toContain("This is an advertisement</span>[[BR_SEP]]");
      expect(result).toContain("601 Heritage Drive, Suite 211, Jupiter, FL 33458</span></h6>");
    });

    it("should skip a blank spacer row between two mergeable footer h6 lines", () => {
      const input =
        '<tr><td><h6 style="text-align:center;">Line A</h6></td></tr>\n' +
        "<tr><td><br /></td></tr>\n" +
        '<tr><td><h6 style="text-align:center;">Line B</h6></td></tr>';
      const result = mergeSimilarTags(input);
      expect((result.match(/\[\[BR_SEP\]\]/g) || []).length).toBe(1);
      expect((result.match(/<h6/gi) || []).length).toBe(1);
      expect(result).not.toContain("<br />");
    });

    it("should NOT merge through two consecutive spacer rows (only exactly one is tolerated)", () => {
      const input =
        '<tr><td><h6 style="text-align:center;">Line A</h6></td></tr>\n' +
        "<tr><td><br /></td></tr>\n" +
        "<tr><td><br /></td></tr>\n" +
        '<tr><td><h6 style="text-align:center;">Line B</h6></td></tr>';
      const result = mergeSimilarTags(input);
      expect(result).not.toContain("[[BR_SEP]]");
    });

    it("should NOT merge h6 rows separated by a row with real, non-blank content", () => {
      const input =
        '<tr><td><h6 style="text-align:center;">First footer line</h6></td></tr>\n' +
        '<tr><td><p style="text-align:center;">Some unrelated paragraph in between</p></td></tr>\n' +
        '<tr><td><h6 style="text-align:center;">Unrelated later h6</h6></td></tr>';
      const result = mergeSimilarTags(input);
      expect(result).not.toContain("[[BR_SEP]]");
      expect(result).toBe(input);
    });

    // Regression: GDocs gives consecutive same-alignment p/h1 blocks slightly different
    // margin/padding (its "space before/after" model), which previously required a
    // byte-identical opening tag to merge and so never matched real Docs paste.
    it("should merge a link paragraph with the next plain-text paragraph despite differing margin/padding", () => {
      const input =
        '<p style="text-align: center;margin-top:0pt;margin-bottom:0pt;padding:0pt 0pt 6pt 0pt;">' +
        '<a href="https://example.com"><span>Request Your FREE Guide</span></a></p>' +
        '<p style="text-align: center;margin-top:0pt;margin-bottom:12pt;">' +
        "<span>Free, with no obligation attached.</span></p>";
      const result = mergeSimilarTags(input);
      expect((result.match(/\[\[BR_SEP\]\]/g) || []).length).toBe(1);
      expect((result.match(/<p/gi) || []).length).toBe(1);
    });

    it("should merge adjacent h1 headline lines despite differing margin-top", () => {
      const input =
        '<h1 style="margin-top:0pt;margin-bottom:0pt;"><span>America Just Crossed $40 Trillion in Debt</span></h1>' +
        '<h1 style="margin-top:3pt;margin-bottom:0pt;"><span>(And the Interest Bill Just Passed Medicare)</span></h1>';
      const result = mergeSimilarTags(input);
      expect((result.match(/\[\[BR_SEP\]\]/g) || []).length).toBe(1);
      expect((result.match(/<h1/gi) || []).length).toBe(1);
    });

    // Regression: Mail.app/Safari-style paste sometimes centers a block with the legacy
    // `align="center"` HTML attribute instead of a `text-align:center` style. normalizeAlignAttribute
    // (formatter.ts) folds that into a style, but only inside processStyles(), which runs AFTER
    // mergeSimilarTags — so without recognizing the bare attribute here too, a `align="center"`
    // paragraph and a `style="text-align:center"` paragraph would look mismatched and fail to merge.
    it("should merge a legacy align=\"center\" attribute paragraph with a text-align:center style paragraph", () => {
      const input =
        '<p align="center"><a href="https://example.com">Link text</a></p>' +
        '<p style="text-align:center;">Plain text</p>';
      const result = mergeSimilarTags(input);
      expect((result.match(/\[\[BR_SEP\]\]/g) || []).length).toBe(1);
      expect((result.match(/<p/gi) || []).length).toBe(1);
    });

    it("should NOT merge an align=\"left\" paragraph with a text-align:right paragraph", () => {
      const input = '<p align="left">Left text</p><p style="text-align:right;">Right text</p>';
      const result = mergeSimilarTags(input);
      expect(result).not.toContain("[[BR_SEP]]");
      expect(result).toBe(input);
    });

    // Bug fix: the merge kept only the FIRST block's attrs, silently discarding the second
    // block's own color/font-size whenever alignment happened to match — safe for GDocs'
    // margin/padding-only splitting noise, but not when color/font-size are meaningfully
    // different and declared directly on the block tag (e.g. Mail.app/Safari paste, which
    // sometimes skips the inner <span> — see the bare <b style="color:..."> case in
    // simple/formatter.ts). Two same-align blocks with conflicting color/font-size must NOT
    // merge — merging would repaint the second block's text in the first block's style.
    it("should NOT merge two same-align blocks that declare conflicting color/font-size directly on the tag", () => {
      const input =
        '<p style="text-align:center;color:#ff0000;font-size:24px;">Red Headline</p>' +
        '<p style="text-align:center;color:#000000;font-size:14px;">Black body text</p>';
      const result = mergeSimilarTags(input);
      expect(result).not.toContain("[[BR_SEP]]");
      expect(result).toBe(input);
    });

    it("still merges two same-align blocks that share the same color/font-size (or declare neither)", () => {
      const input =
        '<p style="text-align:center;color:#ff0000;font-size:24px;">Line one</p>' +
        '<p style="text-align:center;color:#ff0000;font-size:24px;">Line two</p>';
      const result = mergeSimilarTags(input);
      expect(result).toContain("[[BR_SEP]]");
    });
  });

  describe("replaceAllEmojisAndSymbolsExcludingHTML", () => {
    it("should encode emojis to HTML entities", () => {
      const input = "Hello 🚀 World";
      const result = replaceAllEmojisAndSymbolsExcludingHTML(input);
      expect(result).not.toContain("🚀");
      expect(result).toContain("&#128640;"); // Rocket code point
    });

    it("should NOT encode HTML symbols", () => {
      const input = "<div>Code</div>";
      const result = replaceAllEmojisAndSymbolsExcludingHTML(input);
      expect(result).toBe("<div>Code</div>");
    });
  });
});
