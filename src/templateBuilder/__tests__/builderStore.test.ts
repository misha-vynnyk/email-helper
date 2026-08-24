import {
  addLeaf,
  addRow,
  addSection,
  columnContainerId,
  findBlockOrLeaf,
  getCanvas,
  moveLeaf,
  removeCanvasBlock,
  removeLeaf,
  reorderCanvasBlocks,
  resetBuilderState,
  sectionContainerId,
  updateLeaf,
  updateSectionStyle,
} from "../state/builderStore";
import { getSelectedId, selectBlock } from "../state/selectionStore";
import type { RowBlock, SectionBlock } from "../types";

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
