import { formatHtml } from "../formatter";

describe("formatter text gluing bug test", () => {
  it("should preserve spaces between table cells and newlines between rows", () => {
    const inputHtml = `<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>`;
    const formatted = formatHtml(inputHtml);
    expect(formatted).toContain("Cell 1 Cell 2"); // Space between cells
    expect(formatted).toContain("Cell 2<br>"); // Br between rows (or formatted into blocks)
    expect(formatted).not.toContain("Cell 1Cell 2");
  });

  it("should preserve newlines from divs by converting them to paragraphs", () => {
    const inputHtml = `<div>First line</div><div>Second line</div><div>Third line</div>`;
    const formatted = formatHtml(inputHtml);
    // Should have paragraph breaks or double breaks between them, but definitely not glued.
    expect(formatted).not.toContain("First lineSecond line");
    expect(formatted).not.toContain("lineThird line");
  });
});
