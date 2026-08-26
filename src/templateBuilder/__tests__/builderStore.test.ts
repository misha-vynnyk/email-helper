import { addColumn, addContainer, addLeaf, addReadyMade, findBlockOrLeaf, getNode, getRootIds, moveNode, removeColumn, removeNode, resetBuilderState, updateNodeFields, updateResponsiveClassNames, updateRowStyle, updateSectionStyle } from "../state/builderStore";
import { getSelectedId, selectBlock } from "../state/selectionStore";
import { createDefaultButtonBlock, createDefaultDividerBlock, createDefaultSpacerBlock, MAX_ROW_COLUMNS, type ButtonBlock, type DividerBlock, type ReadyMadeBlock, type RowBlock, type RowColumnBlock, type SectionBlock, type SpacerBlock } from "../types";

describe("builderStore", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("adds sections and rows to the canvas in order", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);

    expect(getRootIds()).toEqual([sectionId, rowId]);
    expect(getNode(sectionId)?.type).toBe("section");
    expect(getNode(rowId)?.type).toBe("row");
    expect((getNode(rowId) as RowBlock).childIds).toHaveLength(2);
  });

  it("adds a leaf into a section and into a specific row column", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);
    const columnId = (getNode(rowId) as RowBlock).childIds[0];

    const textId = addLeaf(sectionId, "text");
    const imageId = addLeaf(columnId, "image");

    expect((getNode(sectionId) as SectionBlock).childIds).toEqual([textId]);
    expect((getNode(columnId) as RowBlock).childIds).toEqual([imageId]);
  });

  it("spawns a nested container inside an existing section", () => {
    const sectionId = addContainer(null, "section");

    const rowId = addContainer(sectionId, "row", 2);

    expect((getNode(sectionId) as SectionBlock).childIds).toEqual([rowId]);
    const row = getNode(rowId) as RowBlock;
    expect(row.parentId).toBe(sectionId);
    // nested defaults: no real padding/width cap, ancestor already constrains layout
    expect(row.widthPx).toBeUndefined();
    expect(row.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("updates a leaf's own fields regardless of which container it lives in", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(sectionId, "text");

    updateNodeFields(textId, { color: "#ff0000" });

    const lookup = findBlockOrLeaf(textId);
    expect(lookup?.kind).toBe("leaf");
    expect((lookup as { block: { color: string } }).block.color).toBe("#ff0000");
  });

  it("removes a leaf from wherever it lives", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(sectionId, "text");

    removeNode(textId);

    expect(findBlockOrLeaf(textId)).toBeUndefined();
  });

  it("moves a leaf from a section into a row column", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);
    const columnId = (getNode(rowId) as RowBlock).childIds[0];
    const textId = addLeaf(sectionId, "text");

    moveNode(textId, columnId, 0);

    expect((getNode(sectionId) as SectionBlock).childIds).toEqual([]);
    expect((getNode(columnId) as RowBlock).childIds).toEqual([textId]);
  });

  it("moves an existing top-level section, with its children, into another section", () => {
    const outerId = addContainer(null, "section");
    const innerId = addContainer(null, "section");
    const textId = addLeaf(innerId, "text");

    moveNode(innerId, outerId, 0);

    expect(getRootIds()).toEqual([outerId]);
    expect((getNode(outerId) as SectionBlock).childIds).toEqual([innerId]);
    expect((getNode(innerId) as SectionBlock).childIds).toEqual([textId]); // subtree moved intact
    expect(getNode(innerId)?.parentId).toBe(outerId);
  });

  it("promotes a nested block back to the canvas root", () => {
    const outerId = addContainer(null, "section");
    const innerId = addContainer(outerId, "section");

    moveNode(innerId, null, 1);

    expect(getRootIds()).toEqual([outerId, innerId]);
    expect(getNode(innerId)?.parentId).toBeNull();
    expect((getNode(outerId) as SectionBlock).childIds).toEqual([]);
  });

  it("rejects moving a container into its own descendant", () => {
    const outerId = addContainer(null, "section");
    const innerId = addContainer(outerId, "section");

    moveNode(outerId, innerId, 0);

    expect(getRootIds()).toEqual([outerId]); // unchanged
    expect((getNode(outerId) as SectionBlock).childIds).toEqual([innerId]);
  });

  it("removes a top-level canvas block by id", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);

    removeNode(sectionId);

    expect(getRootIds()).toEqual([rowId]);
  });

  it("reorders top-level canvas blocks via moveNode", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);

    moveNode(sectionId, null, 1);

    expect(getRootIds()).toEqual([rowId, sectionId]);
  });

  it("updates a section's own style fields", () => {
    const sectionId = addContainer(null, "section");

    updateSectionStyle(sectionId, { widthPx: 400 });

    expect((getNode(sectionId) as SectionBlock).widthPx).toBe(400);
  });

  it("gives a new top-level row the same padding/width defaults as a top-level section", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);

    const section = getNode(sectionId) as SectionBlock;
    const row = getNode(rowId) as RowBlock;
    expect(row.widthPx).toBe(section.widthPx);
    expect(row.padding).toEqual(section.padding);
  });

  it("updates a row's own style fields", () => {
    const rowId = addContainer(null, "row", 2);
    const otherRowId = addContainer(null, "row", 2);

    updateRowStyle(rowId, { widthPx: 400 });

    expect((getNode(rowId) as RowBlock).widthPx).toBe(400);
    expect((getNode(otherRowId) as RowBlock).widthPx).not.toBe(400);
  });

  it("adds a column to a row and redistributes widthPercent evenly", () => {
    const rowId = addContainer(null, "row", 2);

    addColumn(rowId);

    const row = getNode(rowId) as RowBlock;
    expect(row.childIds).toHaveLength(3);
    const widths = row.childIds.map((id) => (getNode(id) as RowColumnBlock).widthPercent);
    expect(widths.reduce((a, b) => a + b)).toBe(100);
    expect(widths[0]).toBe(33);
    expect(widths[2]).toBe(34);
  });

  it("preserves existing columns' children and the row's own style when adding a column", () => {
    const rowId = addContainer(null, "row", 2);
    const columnId = (getNode(rowId) as RowBlock).childIds[0];
    const textId = addLeaf(columnId, "text");

    addColumn(rowId);

    expect((getNode(columnId) as RowBlock).childIds).toEqual([textId]);
    expect((getNode(rowId) as RowBlock).widthPx).toBe(552);
  });

  it("does not add a column past MAX_ROW_COLUMNS", () => {
    const rowId = addContainer(null, "row", 2);
    for (let i = 0; i < 5; i++) addColumn(rowId);

    expect((getNode(rowId) as RowBlock).childIds).toHaveLength(MAX_ROW_COLUMNS);
  });

  it("removeNode on a column detaches it (and its subtree) from the row, without redistributing widths", () => {
    const rowId = addContainer(null, "row", 3);
    const columnId = (getNode(rowId) as RowBlock).childIds[0];

    removeNode(columnId);

    expect((getNode(rowId) as RowBlock).childIds).toHaveLength(2);
  });

  it("removeColumn redistributes widthPercent evenly and preserves remaining children", () => {
    const rowId = addContainer(null, "row", 3);
    const columnIds = (getNode(rowId) as RowBlock).childIds;
    const textId = addLeaf(columnIds[1], "text");

    removeColumn(rowId, columnIds[0]);

    const row = getNode(rowId) as RowBlock;
    expect(row.childIds).toEqual([columnIds[1], columnIds[2]]);
    expect((getNode(columnIds[1]) as RowBlock).childIds).toEqual([textId]);
    expect(row.widthPx).toBe(552);
  });

  it("clears the selection when a leaf inside a removed column was selected", () => {
    const rowId = addContainer(null, "row", 2);
    const columnId = (getNode(rowId) as RowBlock).childIds[0];
    const textId = addLeaf(columnId, "text");
    selectBlock(textId);

    removeNode(columnId);

    expect(getSelectedId()).toBeNull();
  });

  it("adds a button, divider, and spacer leaf matching their default factories", () => {
    const sectionId = addContainer(null, "section");

    const buttonId = addLeaf(sectionId, "button");
    const dividerId = addLeaf(sectionId, "divider");
    const spacerId = addLeaf(sectionId, "spacer");

    const section = getNode(sectionId) as SectionBlock;
    const [button, divider, spacer] = section.childIds.map((id) => getNode(id));
    expect(button).toEqual(createDefaultButtonBlock(buttonId, sectionId));
    expect(divider).toEqual(createDefaultDividerBlock(dividerId, sectionId));
    expect(spacer).toEqual(createDefaultSpacerBlock(spacerId, sectionId));
  });

  it("updates button, divider, and spacer leaves' own fields", () => {
    const sectionId = addContainer(null, "section");
    const buttonId = addLeaf(sectionId, "button");
    const dividerId = addLeaf(sectionId, "divider");
    const spacerId = addLeaf(sectionId, "spacer");

    updateNodeFields(buttonId, { label: "Buy now", bgColor: undefined });
    updateNodeFields(dividerId, { thicknessPx: 4 });
    updateNodeFields(spacerId, { heightPx: 48 });

    const button = getNode(buttonId) as ButtonBlock;
    const divider = getNode(dividerId) as DividerBlock;
    const spacer = getNode(spacerId) as SpacerBlock;
    expect(button.label).toBe("Buy now");
    expect(button.bgColor).toBeUndefined();
    expect(divider.thicknessPx).toBe(4);
    expect(spacer.heightPx).toBe(48);
  });

  it("clears the selection when the selected section is removed", () => {
    const sectionId = addContainer(null, "section");
    selectBlock(sectionId);

    removeNode(sectionId);

    expect(getSelectedId()).toBeNull();
  });

  it("clears the selection when a leaf nested inside a removed section was selected", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(sectionId, "text");
    selectBlock(textId);

    removeNode(sectionId);

    expect(getSelectedId()).toBeNull();
  });

  it("clears the selection when the selected leaf is removed directly", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(sectionId, "text");
    selectBlock(textId);

    removeNode(textId);

    expect(getSelectedId()).toBeNull();
  });

  it("does not clear an unrelated selection when a different block is removed", () => {
    const keptSectionId = addContainer(null, "section");
    const removedSectionId = addContainer(null, "section");
    selectBlock(keptSectionId);

    removeNode(removedSectionId);

    expect(getSelectedId()).toBe(keptSectionId);
  });

  it("clears the selection on resetBuilderState", () => {
    const sectionId = addContainer(null, "section");
    selectBlock(sectionId);

    resetBuilderState();

    expect(getSelectedId()).toBeNull();
  });

  it("spawns a ready-made block seeded with its definition's own slot defaults", () => {
    const sectionId = addContainer(null, "section");

    const headerId = addReadyMade(sectionId, "header-adaptive");

    const header = getNode(headerId) as ReadyMadeBlock;
    expect(header.type).toBe("ready-made");
    expect(header.definitionId).toBe("header-adaptive");
    expect(header.values).toEqual({ desktopSrc: expect.any(String), mobileSrc: expect.any(String), href: "urlhere" });
    expect((getNode(sectionId) as SectionBlock).childIds).toEqual([headerId]);
  });

  it("updates a ready-made block's slot values via updateNodeFields, findable back through findBlockOrLeaf", () => {
    const sectionId = addContainer(null, "section");
    const headerId = addReadyMade(sectionId, "header-simple");

    updateNodeFields(headerId, { values: { src: "https://cdn.example.com/logo.png", href: "https://example.com" } });

    const lookup = findBlockOrLeaf(headerId);
    expect(lookup?.kind).toBe("ready-made");
    expect((lookup as { block: ReadyMadeBlock }).block.values.href).toBe("https://example.com");
  });

  it("is a no-op for an unknown ready-made definitionId", () => {
    const sectionId = addContainer(null, "section");

    const id = addReadyMade(sectionId, "does-not-exist");

    expect(id).toBe("");
    expect((getNode(sectionId) as SectionBlock).childIds).toEqual([]);
  });

  it("updateResponsiveClassNames persists on a Section/Row — the exact case updateNodeFields silently rejects (containers)", () => {
    const sectionId = addContainer(null, "section");
    const rowId = addContainer(null, "row", 2);

    updateResponsiveClassNames(sectionId, ["sm-hidden"]);
    updateResponsiveClassNames(rowId, ["xs-text-center"]);

    expect((getNode(sectionId) as SectionBlock).responsiveClassNames).toEqual(["sm-hidden"]);
    expect((getNode(rowId) as RowBlock).responsiveClassNames).toEqual(["xs-text-center"]);
  });

  it("updateResponsiveClassNames also works on leaves and ready-made blocks", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(sectionId, "text");
    const headerId = addReadyMade(sectionId, "header-simple");

    updateResponsiveClassNames(textId, ["pt-8"]);
    updateResponsiveClassNames(headerId, ["xs-hidden"]);

    expect(getNode(textId)?.responsiveClassNames).toEqual(["pt-8"]);
    expect(getNode(headerId)?.responsiveClassNames).toEqual(["xs-hidden"]);
  });

  it("updateResponsiveClassNames is a no-op for a nonexistent id", () => {
    expect(() => updateResponsiveClassNames("does-not-exist", ["sm-hidden"])).not.toThrow();
  });

  it("addLeaf(null, ...) spawns a leaf directly at the canvas root, no wrapping Section required", () => {
    const textId = addLeaf(null, "text");

    expect(getRootIds()).toEqual([textId]);
    expect(getNode(textId)?.parentId).toBeNull();
  });

  it("addReadyMade(null, ...) spawns a ready-made block directly at the canvas root", () => {
    const headerId = addReadyMade(null, "header-simple");

    expect(getRootIds()).toEqual([headerId]);
    expect(getNode(headerId)?.parentId).toBeNull();
  });

  it("a root-level leaf sits alongside Sections/Rows in rootIds, in drop order", () => {
    const sectionId = addContainer(null, "section");
    const textId = addLeaf(null, "text");
    const rowId = addContainer(null, "row", 2);

    expect(getRootIds()).toEqual([sectionId, textId, rowId]);
  });
});
