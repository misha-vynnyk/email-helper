import { assembleDocument } from "../masterShell";

describe("assembleDocument", () => {
  it("substitutes the title slot and inserts content between the Content bracket comments", () => {
    const html = assembleDocument("<tr><td>CONTENT_MARKER</td></tr>", { title: "My Template" });

    expect(html).toContain("<title>My Template</title>");
    expect(html).toContain("CONTENT_MARKER");
    expect(html.indexOf("Content start")).toBeLessThan(html.indexOf("CONTENT_MARKER"));
    expect(html.indexOf("CONTENT_MARKER")).toBeLessThan(html.indexOf("Content / end"));
  });

  it("never leaves the title placeholder token in the output", () => {
    const html = assembleDocument("", { title: "Anything" });
    expect(html).not.toContain("__FIGMA_IMPORT_TITLE__");
  });
});
