import { formatHtml } from "../formatter";

describe("HTML Converter - Edge Cases & Regression", () => {
  describe("Invisible Characters & ZWS", () => {
    it("should treat paragraphs with only Zero Width Space as empty and collapse them", () => {
      // Input: P(Content) -> P(ZWS) -> P(Content)
      // Should result in standard spacing, not double gaps.
      const input = `
            <p>Start</p>
            <p>\u200B</p>
            <p>End</p>
            `;
      const output = formatHtml(input);

      // Should NOT have double <br><br> blocks
      expect(output).not.toMatch(/<br><br>\s*<br><br>/);
      // Should have at least one break or be clean
      expect(output).toContain("Start");
      expect(output).toContain("End");
    });

    it("should remove ZWS from within text content", () => {
      const input = `<p>H\u200Be\u200Bllo</p>`;
      const output = formatHtml(input);
      expect(output).toContain("Hello");
      expect(output).not.toContain("\u200B");
    });
  });

  describe("Empty Paragraph Handling", () => {
    it("should collapse multiple empty paragraphs into a single separator", () => {
      // Input: P(A) -> Empty -> Empty -> Empty -> P(B)
      const input = `
            <p>A</p>
            <p></p>
            <p><br></p>
            <p><span></span></p>
            <p>B</p>
            `;
      const output = formatHtml(input);

      // Expect A... <br><br> ...B (single separator block)
      // The exact regex depends on how cleanEmptyHtmlTags works, but definitely no double blocks
      expect(output).not.toMatch(/<br><br>\s*<br><br>/);
    });

    it("should handle single empty paragraph as a standard break", () => {
      const input = `
            <p>A</p>
            <p>&nbsp;</p>
            <p>B</p>
            `;
      const output = formatHtml(input);
      expect(output).not.toMatch(/<br><br>\s*<br><br>/);
    });
  });

  describe("List Handling", () => {
    it("should not add breaks inside lists", () => {
      const input = `
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
            `;
      const output = formatHtml(input);
      // Should not have <br> inside <li> or between </li><li>
      expect(output).not.toMatch(/<li>\s*<br>/);
      expect(output).not.toMatch(/<\/li>\s*<br>/);
    });
  });
});
