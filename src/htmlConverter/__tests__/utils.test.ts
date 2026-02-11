import { cleanEmptyHtmlTags, isSignatureImageTag, addOneBr, replaceTripleBrWithSingle, addBrAfterClosingP, removeStylesFromLists, mergeSimilarTags, replaceAllEmojisAndSymbolsExcludingHTML } from "../utils";
import { SYMBOLS } from "../constants";

describe("htmlConverter utils", () => {
  describe("cleanEmptyHtmlTags", () => {
    it("should remove non-breaking spaces", () => {
      const input = "Hello&nbsp;World";
      expect(cleanEmptyHtmlTags(input)).toBe("Hello World");
    });

    it("should remove empty bold tags", () => {
      const input = "Hello <b>   </b> World";
      expect(cleanEmptyHtmlTags(input)).toBe("Hello  World");
    });

    it("should collapse multiple <br> tags into max two", () => {
      const input = "Line 1<br><br><br><br>Line 2";
      expect(cleanEmptyHtmlTags(input)).toBe("Line 1<br><br>Line 2");
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
    it("should add a break after the specified symbol", () => {
      const input = `Line 1${SYMBOLS.ONE_BR}Line 2`;
      const result = addOneBr(input);
      expect(result).toContain("<br>");
      // Verify it splits lines or adds indentation as per function logic
      // Function finds symbol and replaces with newline + indent + <br> + indent
    });
  });

  describe("replaceTripleBrWithSingle", () => {
    it("should replace triple breaks with single break", () => {
      const input = "Text<br><br><br>More Text";
      const expected = "Text<br>\nMore Text";
      expect(replaceTripleBrWithSingle(input)).toBe(expected);
    });

    it("should handle mixed closing tags and breaks", () => {
      const input = "<div></div><br></div></div>";
      const result = replaceTripleBrWithSingle(input);
      // Based on implementation: <br></div> -> </div><br>
      // So <div></div><br></div></div> -> <div></div></div><br></div>
      expect(result).toBe("<div></div></div><br></div>");
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
