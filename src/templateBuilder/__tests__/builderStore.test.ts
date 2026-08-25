import {
  addColumn,
  addLeaf,
  addRow,
  addSection,
  columnContainerId,
  findBlockOrLeaf,
  getCanvas,
  moveLeaf,
  removeCanvasBlock,
  removeColumn,
  removeLeaf,
  reorderCanvasBlocks,
  resetBuilderState,
  sectionContainerId,
  updateLeaf,
  updateRowStyle,
  updateSectionStyle,
} from "../state/builderStore";
import { getSelectedId, selectBlock } from "../state/selectionStore";
import { MAX_ROW_COLUMNS, type RowBlock, type SectionBlock } from "../types";

describe("builderStore", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("adds sections and rows to the canvas in order", () => {
    const sectionId = addSection();
    const rowId = addRow(2);

    const canvas = getCanvas();
    expect(canvas.map((b) => b.id)).toEqual([sectionId, rowId]);
    expect(canvas[0].type).toBe("section");
    expect(canvas[1].type).toBe("row");
    expect((canvas[1] as RowBlock).columns).toHaveLength(2);
  });

  it("adds a leaf into a section and into a specific row column", () => {
    const sectionId = addSection();
    const rowId = addRow(2);
    const columnId = (getCanvas()[1] as RowBlock).columns[0].id;

    const textId = addLeaf(sectionContainerId(sectionId), "text");
    const imageId = addLeaf(columnContainerId(rowId, columnId), "image");

    const canvas = getCanvas();
    const section = canvas[0] as SectionBlock;
    const row = canvas[1] as RowBlock;
    expect(section.children.map((c) => c.id)).toEqual([textId]);
    expect(row.columns[0].children.map((c) => c.id)).toEqual([imageId]);
    expect(row.columns[1].children).toEqual([]);
  });

  it("updates a leaf's own fields regardless of which container it lives in", () => {
    const sectionId = addSection();
    const textId = addLeaf(sectionContainerId(sectionId), "text");

    updateLeaf(textId, { color: "#ff0000" });

    const lookup = findBlockOrLeaf(getCanvas(), textId);
    expect(lookup?.kind).toBe("leaf");
    expect((lookup as { block: { color: string } }).block.color).toBe("#ff0000");
  });

  it("removes a leaf from wherever it lives", () => {
    const sectionId = addSection();
    const textId = addLeaf(sectionContainerId(sectionId), "text");

    removeLeaf(textId);

    expect(findBlockOrLeaf(getCanvas(), textId)).toBeUndefined();
  });

  it("moves a leaf from a section into a row column", () => {
    const sectionId = addSection();
    const rowId = addRow(2);
    const columnId = (getCanvas()[1] as RowBlock).columns[0].id;
    const textId = addLeaf(sectionContainerId(sectionId), "text");

    moveLeaf(textId, columnContainerId(rowId, columnId), 0);

    const canvas = getCanvas();
    const section = canvas[0] as SectionBlock;
    const row = canvas[1] as RowBlock;
    expect(section.children).toEqual([]);
    expect(row.columns[0].children.map((c) => c.id)).toEqual([textId]);
  });

  it("removes a top-level canvas block by id", () => {
    const sectionId = addSection();
    const rowId = addRow(2);

    removeCanvasBlock(sectionId);

    expect(getCanvas().map((b) => b.id)).toEqual([rowId]);
  });

  it("reorders top-level canvas blocks", () => {
    const sectionId = addSection();
    const rowId = addRow(2);

    reorderCanvasBlocks(0, 1);

    expect(getCanvas().map((b) => b.id)).toEqual([rowId, sectionId]);
  });

  it("updates a section's own style fields", () => {
    const sectionId = addSection();

    updateSectionStyle(sectionId, { widthPx: 400 });

    const section = getCanvas()[0] as SectionBlock;
    expect(section.widthPx).toBe(400);
  });

  it("gives a new row the same top-level padding/width defaults as a section", () => {
    addSection();
    addRow(2);

    const section = getCanvas()[0] as SectionBlock;
    const row = getCanvas()[1] as RowBlock;
    expect(row.widthPx).toBe(section.widthPx);
    expect(row.padding).toEqual(section.padding);
  });

  it("updates a row's own style fields", () => {
    const rowId = addRow(2);
    addRow(2);

    updateRowStyle(rowId, { widthPx: 400 });

    const [firstRow, secondRow] = getCanvas() as RowBlock[];
    expect(firstRow.widthPx).toBe(400);
    expect(secondRow.widthPx).not.toBe(400);
  });

  it("adds a column to a row and redistributes widthPercent evenly", () => {
    const rowId = addRow(2);

    addColumn(rowId);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns).toHaveLength(3);
    expect(row.columns.map((c) => c.widthPercent).reduce((a, b) => a + b)).toBe(100);
    expect(row.columns[0].widthPercent).toBe(33);
    expect(row.columns[2].widthPercent).toBe(34);
  });

  it("preserves existing columns' children and the row's own style when adding a column", () => {
    const rowId = addRow(2);
    const columnId = (getCanvas()[0] as RowBlock).columns[0].id;
    const textId = addLeaf(columnContainerId(rowId, columnId), "text");

    addColumn(rowId);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns[0].children.map((c) => c.id)).toEqual([textId]);
    expect(row.widthPx).toBe(552);
  });

  it("does not add a column past MAX_ROW_COLUMNS", () => {
    const rowId = addRow(2);
    for (let i = 0; i < 5; i++) addColumn(rowId);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns).toHaveLength(MAX_ROW_COLUMNS);
  });

  it("removes a column from a row and redistributes widthPercent evenly", () => {
    const rowId = addRow(3);
    const columnId = (getCanvas()[0] as RowBlock).columns[0].id;

    removeColumn(rowId, columnId);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns).toHaveLength(2);
    expect(row.columns.every((c) => c.widthPercent === 50)).toBe(true);
  });

  it("preserves remaining columns' children and the row's own style when removing a column", () => {
    const rowId = addRow(3);
    const columns = (getCanvas()[0] as RowBlock).columns;
    const textId = addLeaf(columnContainerId(rowId, columns[1].id), "text");

    removeColumn(rowId, columns[0].id);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns.map((c) => c.id)).toEqual([columns[1].id, columns[2].id]);
    expect(row.columns[0].children.map((c) => c.id)).toEqual([textId]);
    expect(row.widthPx).toBe(552);
  });

  it("does not remove a column once the row is down to MIN_ROW_COLUMNS", () => {
    const rowId = addRow(2);
    const columns = (getCanvas()[0] as RowBlock).columns;

    removeColumn(rowId, columns[0].id);
    removeColumn(rowId, columns[1].id);

    const row = getCanvas()[0] as RowBlock;
    expect(row.columns).toHaveLength(1);
  });

  it("clears the selection when a leaf inside a removed column was selected", () => {
    const rowId = addRow(2);
    const columnId = (getCanvas()[0] as RowBlock).columns[0].id;
    const textId = addLeaf(columnContainerId(rowId, columnId), "text");
    selectBlock(textId);

    removeColumn(rowId, columnId);

    expect(getSelectedId()).toBeNull();
  });

  it("clears the selection when the selected section is removed", () => {
    const sectionId = addSection();
    selectBlock(sectionId);

    removeCanvasBlock(sectionId);

    expect(getSelectedId()).toBeNull();
  });

  it("clears the selection when a leaf nested inside a removed section was selected", () => {
    const sectionId = addSection();
    const textId = addLeaf(sectionContainerId(sectionId), "text");
    selectBlock(textId);

    removeCanvasBlock(sectionId);

    expect(getSelectedId()).toBeNull();
  });

  it("clears the selection when the selected leaf is removed directly", () => {
    const sectionId = addSection();
    const textId = addLeaf(sectionContainerId(sectionId), "text");
    selectBlock(textId);

    removeLeaf(textId);

    expect(getSelectedId()).toBeNull();
  });

  it("does not clear an unrelated selection when a different block is removed", () => {
    const keptSectionId = addSection();
    const removedSectionId = addSection();
    selectBlock(keptSectionId);

    removeCanvasBlock(removedSectionId);

    expect(getSelectedId()).toBe(keptSectionId);
  });

  it("clears the selection on resetBuilderState", () => {
    const sectionId = addSection();
    selectBlock(sectionId);

    resetBuilderState();

    expect(getSelectedId()).toBeNull();
  });
});
