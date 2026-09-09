import { validateBuilderDocument } from "../validate";

function json(doc: unknown): string {
  return JSON.stringify(doc);
}

const textLeaf = { id: "t1", parentId: "s1", type: "text", contentHtml: "Hi", fontSizePx: 18, fontWeight: 400, color: "#000000", align: "left" };
const section = { id: "s1", parentId: null, type: "section", padding: { top: 0, right: 0, bottom: 0, left: 0 }, gapPx: 14, childIds: ["t1"] };

describe("validateBuilderDocument", () => {
  it("passes for a valid minimal document and returns nodes/rootIds/shell ready for loadDocument", () => {
    const result = validateBuilderDocument(json({ nodes: [section, textLeaf] }));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.rootIds).toEqual(["s1"]);
    expect(result.nodes?.["s1"]).toEqual(section);
    expect(result.nodes?.["t1"]).toEqual(textLeaf);
  });

  it("merges a partial shell over createDefaultShellConfig()'s defaults", () => {
    const result = validateBuilderDocument(json({ shell: { title: "My template" }, nodes: [] }));

    expect(result.valid).toBe(true);
    expect(result.shell?.title).toBe("My template");
    expect(result.shell?.contentWidthPx).toBe(600); // default, not overridden
  });

  it("fails with a specific message on invalid JSON", () => {
    const result = validateBuilderDocument("{not json");

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Invalid JSON");
  });

  it("fails at the zod layer for a missing required field", () => {
    const { gapPx: _gapPx, ...brokenSection } = section;
    const result = validateBuilderDocument(json({ nodes: [brokenSection] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "nodes.0.gapPx")).toBe(true);
  });

  it("rejects a duplicate node id", () => {
    const result = validateBuilderDocument(json({ nodes: [section, textLeaf, { ...textLeaf, id: "t1" }] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Duplicate node id"))).toBe(true);
  });

  it("rejects a dangling parentId (references a node that doesn't exist)", () => {
    const orphan = { ...textLeaf, id: "t2", parentId: "does-not-exist" };
    const result = validateBuilderDocument(json({ nodes: [orphan] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("does not reference any node"))).toBe(true);
  });

  it("rejects a parentId pointing at a non-container node", () => {
    const parentedOnALeaf = { ...textLeaf, id: "t2", parentId: "t1" };
    const result = validateBuilderDocument(json({ nodes: [textLeaf, parentedOnALeaf] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("not a container"))).toBe(true);
  });

  it("rejects a childIds entry that doesn't exist in the document", () => {
    const sectionWithPhantomChild = { ...section, childIds: ["does-not-exist"] };
    const result = validateBuilderDocument(json({ nodes: [sectionWithPhantomChild] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("does not exist in the document"))).toBe(true);
  });

  it("rejects a node whose parentId isn't reflected back in the parent's childIds", () => {
    const sectionWithoutTheChild = { ...section, childIds: [] };
    const result = validateBuilderDocument(json({ nodes: [sectionWithoutTheChild, textLeaf] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("does not list this node in its own childIds"))).toBe(true);
  });

  it("rejects a node whose childIds claims a child that actually points at a different parent", () => {
    const otherSection = { ...section, id: "s2", childIds: [] };
    const textPointingElsewhere = { ...textLeaf, parentId: "s2" };
    const sectionClaimingIt = { ...section, childIds: ["t1"] };
    const result = validateBuilderDocument(json({ nodes: [sectionClaimingIt, otherSection, textPointingElsewhere] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("not \"s1\""))).toBe(true);
  });

  it("rejects a parentId cycle", () => {
    const a = { ...section, id: "a", parentId: "b", childIds: [] };
    const b = { ...section, id: "b", parentId: "a", childIds: [] };
    const result = validateBuilderDocument(json({ nodes: [a, b] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("cycle"))).toBe(true);
  });

  it("rejects a row-column whose parent isn't a row", () => {
    const rowColumn = { id: "rc1", parentId: "s1", type: "row-column", widthPercent: 100, childIds: [] };
    const sectionWithColumnChild = { ...section, childIds: ["rc1"] };
    const result = validateBuilderDocument(json({ nodes: [sectionWithColumnChild, rowColumn] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('must be a "row" node'))).toBe(true);
  });

  it("rejects a row whose children aren't all row-columns", () => {
    const row = { id: "r1", parentId: null, type: "row", padding: { top: 0, right: 0, bottom: 0, left: 0 }, childIds: ["t1"] };
    const leafUnderRow = { ...textLeaf, parentId: "r1" };
    const result = validateBuilderDocument(json({ nodes: [row, leafUnderRow] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("must all be"))).toBe(true);
  });

  it("rejects a row with a column count outside [MIN_ROW_COLUMNS, MAX_ROW_COLUMNS]", () => {
    const columns = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, parentId: "r1", type: "row-column", widthPercent: 20, childIds: [] }));
    const row = { id: "r1", parentId: null, type: "row", padding: { top: 0, right: 0, bottom: 0, left: 0 }, childIds: columns.map((c) => c.id) };
    const result = validateBuilderDocument(json({ nodes: [row, ...columns] }));

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("between 1 and 4 columns"))).toBe(true);
  });
});
