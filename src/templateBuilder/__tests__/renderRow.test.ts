import { renderRow } from "../render/renderRow";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultRowColumnBlock, createDefaultShellConfig, createDefaultTextBlock, type BuilderNode, type RowBlock } from "../types";
import { nodeMap } from "../testSupport/nodeMap";

const shell = createDefaultShellConfig();
const OUTER_TD_STYLE = 'style="padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;"';
const OUTER_TABLE_STYLE = 'width="600" style="width: 100%; max-width: 600px; padding: 0; margin: 0;" role="presentation"';

/** Builds a row with an explicit `widthPx` (so column math is pinned to a known number
 * regardless of `availableWidthPx`) and one column node per width in `columnWidths`. */
function makeRow(columnWidths: number[]): { row: RowBlock; nodes: Record<string, BuilderNode> } {
  const columns = columnWidths.map((widthPercent, i) => createDefaultRowColumnBlock(`col-${i}`, "row", widthPercent));
  const row: RowBlock = { ...createDefaultRowBlock("row", null), widthPx: 600, childIds: columns.map((c) => c.id) };
  return { row, nodes: nodeMap([row, ...columns]) };
}

describe("renderRow", () => {
  it("renders each column as an inline-block cell with a proportional min-width", () => {
    const { row, nodes } = makeRow([50, 50]);
    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    // 50/50 split of the row's own 600px width -> 300px min-width per column
    expect(html.match(/display: inline-block; width: 50%; max-width: 100%; min-width: 300px/g)?.length).toBe(2);
  });

  it("renders children inside the correct column, in order", () => {
    const { row, nodes } = makeRow([50, 50]);
    const text = { ...createDefaultTextBlock("t1", "col-0"), contentHtml: "Left column text" };
    const image = createDefaultImageBlock("i1", "col-1");
    nodes["col-0"] = { ...nodes["col-0"], childIds: ["t1"] } as BuilderNode;
    nodes["col-1"] = { ...nodes["col-1"], childIds: ["i1"] } as BuilderNode;
    nodes.t1 = text;
    nodes.i1 = image;

    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    expect(html.indexOf("Left column text")).toBeLessThan(html.indexOf(image.src));
  });

  it("gives an uneven 3-column split a min-width proportional to each column's own width", () => {
    const { row, nodes } = makeRow([50, 25, 25]);

    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    expect(html).toContain("width: 50%; max-width: 100%; min-width: 300px");
    expect(html.match(/width: 25%; max-width: 100%; min-width: 150px/g)?.length).toBe(2);
  });

  it("marks each column <td> as an inline-block element and mirrors its width as an HTML attribute", () => {
    const { row, nodes } = makeRow([50, 50]);
    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    expect(html.match(/<td class="i-b-e" valign="top" align="center" width="50%"/g)?.length).toBe(2);
    expect(html).not.toContain("vertical-align: top");
  });

  it("wraps the row in an outer <td>/<table> driven by the row's own padding and width", () => {
    const { row, nodes } = makeRow([50, 50]);
    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    expect(html).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(html).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
  });

  it("renders a single-column row as plain content directly inside the outer <table>, with no inline-block markup", () => {
    const { row, nodes } = makeRow([100]);
    nodes["col-0"] = { ...nodes["col-0"], childIds: ["t1"] } as BuilderNode;
    nodes.t1 = { ...createDefaultTextBlock("t1", "col-0"), contentHtml: "Solo column text" };

    const html = renderRow(row, nodes, shell, shell.contentWidthPx);

    expect(html).toContain("Solo column text");
    expect(html).not.toContain("i-b-e");
    expect(html).not.toContain("display: inline-block");
  });

  it("keeps the inline-block column markup for 2 and 4 columns alike", () => {
    const two = makeRow([50, 50]);
    const four = makeRow([25, 25, 25, 25]);

    const twoColumnHtml = renderRow(two.row, two.nodes, shell, shell.contentWidthPx);
    const fourColumnHtml = renderRow(four.row, four.nodes, shell, shell.contentWidthPx);

    expect(twoColumnHtml.match(/<td class="i-b-e"/g)?.length).toBe(2);
    expect(fourColumnHtml.match(/<td class="i-b-e"/g)?.length).toBe(4);
  });

  it("keeps the outer <td>/<table> wrapper identical whether the row has 1 or 3 columns", () => {
    const one = makeRow([100]);
    const three = makeRow([34, 33, 33]);

    const oneColumnHtml = renderRow(one.row, one.nodes, shell, shell.contentWidthPx);
    const threeColumnHtml = renderRow(three.row, three.nodes, shell, shell.contentWidthPx);

    expect(oneColumnHtml).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(threeColumnHtml).toContain(`<td align="center" ${OUTER_TD_STYLE}>`);
    expect(oneColumnHtml).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
    expect(threeColumnHtml).toContain(`<table align="center" border="0" cellspacing="0" cellpadding="0" ${OUTER_TABLE_STYLE}>`);
  });

  it("computes column min-width from the real inherited availableWidthPx when nested (widthPx undefined), not shell.contentWidthPx", () => {
    const columns = [50, 50].map((widthPercent, i) => createDefaultRowColumnBlock(`col-${i}`, "row", widthPercent));
    const nestedRow: RowBlock = { ...createDefaultRowBlock("row", "parent-column"), childIds: columns.map((c) => c.id) };
    const nodes = nodeMap([nestedRow, ...columns]);

    // ancestor only has 300px of real space to give this row — not the 600px shell content width
    const html = renderRow(nestedRow, nodes, shell, 300);

    // no own width cap on the row's outer wrapper (the "max-width: 100%;" seen elsewhere in the
    // output belongs to the column-level inline-block technique, unrelated to the row's own cap)
    expect(html).toContain('<table align="center" border="0" cellspacing="0" cellpadding="0" style="width: 100%; padding: 0; margin: 0;" role="presentation">');
    expect(html.match(/display: inline-block; width: 50%; max-width: 100%; min-width: 150px/g)?.length).toBe(2);
  });
});
