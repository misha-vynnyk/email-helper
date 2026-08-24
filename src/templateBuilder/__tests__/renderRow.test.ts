import { renderRow } from "../render/renderRow";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultTextBlock } from "../types";

describe("renderRow", () => {
  it("renders each column as an inline-block cell with a proportional min-width", () => {
    const row = createDefaultRowBlock("r1", ["col-a", "col-b"], 2);
    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    // 50/50 split of a 600px available width -> 300px min-width per column
    expect(html.match(/display: inline-block; width: 50%; max-width: 100%; min-width: 300px/g)?.length).toBe(2);
  });

  it("renders children inside the correct column, in order", () => {
    const row = createDefaultRowBlock("r2", ["col-a", "col-b"], 2);
    const text = createDefaultTextBlock("t1");
    text.contentHtml = "Left column text";
    const image = createDefaultImageBlock("i1");
    row.columns[0].children = [text];
    row.columns[1].children = [image];

    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(html.indexOf("Left column text")).toBeLessThan(html.indexOf(image.src));
  });

  it("gives an uneven 3-column split a min-width proportional to each column's own width", () => {
    const row = createDefaultRowBlock("r3", ["col-a", "col-b", "col-c"], 3);
    row.columns[0].widthPercent = 50;
    row.columns[1].widthPercent = 25;
    row.columns[2].widthPercent = 25;

    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(html).toContain("width: 50%; max-width: 100%; min-width: 300px");
    expect(html.match(/width: 25%; max-width: 100%; min-width: 150px/g)?.length).toBe(2);
  });
});
