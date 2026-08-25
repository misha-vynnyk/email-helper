import { renderRow } from "../render/renderRow";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultTextBlock, type RowBlock } from "../types";

const OUTER_TD_STYLE = 'style="padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;"';
const OUTER_TABLE_STYLE = 'width="552" style="width: 100%; max-width: 552px; padding: 0; margin: 0;" role="presentation"';

function makeRow(columnWidths: number[]): RowBlock {
  return {
    id: "row",
    type: "row",
    padding: { top: 32, right: 20, bottom: 24, left: 20 },
    widthPx: 552,
    columns: columnWidths.map((widthPercent, i) => ({ id: `col-${i}`, widthPercent, children: [] })),
  };
}

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

  it("marks each column <td> as an inline-block element and mirrors its width as an HTML attribute", () => {
    const row = createDefaultRowBlock("r5", ["col-a", "col-b"], 2);
    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(html.match(/<td class="i-b-e" valign="top" align="center" width="50%"/g)?.length).toBe(2);
    expect(html).not.toContain("vertical-align: top");
  });

  it("wraps the row in an outer <td>/<table> driven by the row's own padding and width", () => {
    const row = createDefaultRowBlock("r4", ["col-a", "col-b"], 2);
    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(html).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(html).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
  });

  it("renders a single-column row as plain content directly inside the outer <table>, with no inline-block markup", () => {
    const row = makeRow([100]);
    const text = createDefaultTextBlock("t1");
    text.contentHtml = "Solo column text";
    row.columns[0].children = [text];

    const html = renderRow(row, "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(html).toContain("Solo column text");
    expect(html).not.toContain("i-b-e");
    expect(html).not.toContain("display: inline-block");
  });

  it("keeps the inline-block column markup for 2 and 4 columns alike", () => {
    const twoColumnHtml = renderRow(makeRow([50, 50]), "'Roboto', Arial, Helvetica, sans-serif", 600);
    const fourColumnHtml = renderRow(makeRow([25, 25, 25, 25]), "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(twoColumnHtml.match(/<td class="i-b-e"/g)?.length).toBe(2);
    expect(fourColumnHtml.match(/<td class="i-b-e"/g)?.length).toBe(4);
  });

  it("keeps the outer <td>/<table> wrapper identical whether the row has 1 or 3 columns", () => {
    const oneColumnHtml = renderRow(makeRow([100]), "'Roboto', Arial, Helvetica, sans-serif", 600);
    const threeColumnHtml = renderRow(makeRow([34, 33, 33]), "'Roboto', Arial, Helvetica, sans-serif", 600);

    expect(oneColumnHtml).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(threeColumnHtml).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(oneColumnHtml).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
    expect(threeColumnHtml).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
  });
});
