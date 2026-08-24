import { sanitizeRichText } from "../render/sanitizeRichText";

describe("sanitizeRichText", () => {
  it("keeps inline formatting tags", () => {
    expect(sanitizeRichText("<b>bold</b> <a href=\"https://example.com\">link</a>")).toBe(
      '<b>bold</b> <a href="https://example.com">link</a>'
    );
  });

  it("keeps font color and span style", () => {
    expect(sanitizeRichText('<font color="#ff0000">red</font>')).toBe('<font color="#ff0000">red</font>');
    expect(sanitizeRichText('<span style="color:#ff0000">red</span>')).toBe('<span style="color:#ff0000">red</span>');
  });

  it("strips disallowed tags and script content", () => {
    expect(sanitizeRichText('<script>alert(1)</script>hello')).toBe("hello");
    expect(sanitizeRichText("<table><tr><td>x</td></tr></table>")).toBe("x");
    expect(sanitizeRichText('<img src="x.png" onerror="alert(1)">')).toBe("");
  });
});
