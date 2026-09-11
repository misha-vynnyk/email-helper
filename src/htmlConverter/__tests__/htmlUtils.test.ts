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
