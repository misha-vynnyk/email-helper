import { childIdsOf, cloneSubtree, collectDescendantIds, insertNode, isDescendantOrSelf, moveNodeInTree, removeNodeFromTree, type CanvasTree } from "../state/canvasTree";
import { createDefaultRowBlock, createDefaultRowColumnBlock, createDefaultSectionBlock, createDefaultTextBlock, type BuilderNode, type RowBlock } from "../types";

/** sA (root section) -> rB (row) -> colC (row-column) -> sE (nested section) -> tF (text) */
function buildFixture(): CanvasTree {
  const sA = { ...createDefaultSectionBlock("sA", null), childIds: ["rB"] };
  const rB = { ...createDefaultRowBlock("rB", "sA"), childIds: ["colC"] };
  const colC = { ...createDefaultRowColumnBlock("colC", "rB", 100), childIds: ["sE"] };
  const sE = { ...createDefaultSectionBlock("sE", "colC"), childIds: ["tF"] };
  const tF = createDefaultTextBlock("tF", "sE");

  const nodes: Record<string, BuilderNode> = { sA, rB, colC, sE, tF };
  return { nodes, rootIds: ["sA"] };
}

describe("canvasTree", () => {
  it("childIdsOf reads root ids when parentId is null, and a container's childIds otherwise", () => {
    const tree = buildFixture();
    expect(childIdsOf(tree, null)).toEqual(["sA"]);
    expect(childIdsOf(tree, "sE")).toEqual(["tF"]);
  });

  it("insertNode adds a node into a deeply nested container and updates only that container", () => {
    const tree = buildFixture();
    const newLeaf = createDefaultTextBlock("tG", "sE");

    const next = insertNode(tree, newLeaf, "sE", 1);

    expect(childIdsOf(next, "sE")).toEqual(["tF", "tG"]);
    expect(next.nodes.tG).toEqual({ ...newLeaf, parentId: "sE" });
    // unrelated branches keep their object identity (memoization contract)
    expect(next.nodes.rB).toBe(tree.nodes.rB);
    expect(next.nodes.colC).toBe(tree.nodes.colC);
  });

  it("insertNode adds a top-level node into rootIds when parentId is null", () => {
    const tree = buildFixture();
    const newSection = createDefaultSectionBlock("sH", null);

    const next = insertNode(tree, newSection, null, 1);

    expect(next.rootIds).toEqual(["sA", "sH"]);
  });

  it("collectDescendantIds walks the whole subtree, depth 3+", () => {
    const tree = buildFixture();
    expect(collectDescendantIds(tree.nodes, "rB").sort()).toEqual(["colC", "sE", "tF"].sort());
  });

  it("removeNodeFromTree cascades to every descendant and detaches from the parent", () => {
    const tree = buildFixture();
    const next = removeNodeFromTree(tree, "rB");

    expect(next.nodes.rB).toBeUndefined();
    expect(next.nodes.colC).toBeUndefined();
    expect(next.nodes.sE).toBeUndefined();
    expect(next.nodes.tF).toBeUndefined();
    expect(childIdsOf(next, "sA")).toEqual([]);
  });

  it("isDescendantOrSelf is true for self and for a descendant at any depth, false otherwise", () => {
    const tree = buildFixture();
    expect(isDescendantOrSelf(tree.nodes, "rB", "rB")).toBe(true);
    expect(isDescendantOrSelf(tree.nodes, "rB", "tF")).toBe(true); // rB -> colC -> sE -> tF
    expect(isDescendantOrSelf(tree.nodes, "sE", "rB")).toBe(false); // wrong direction
    expect(isDescendantOrSelf(tree.nodes, "rB", "sA")).toBe(false); // unrelated ancestor
  });

  it("moveNodeInTree moves a whole subtree into another, unrelated container, keeping its children intact", () => {
    const tree = buildFixture();
    const sZ = createDefaultSectionBlock("sZ", null);
    const withSz = insertNode(tree, sZ, null, 1); // rootIds: [sA, sZ]

    const next = moveNodeInTree(withSz, "rB", "sZ", 0);

    expect(childIdsOf(next, "sA")).toEqual([]);
    expect(childIdsOf(next, "sZ")).toEqual(["rB"]);
    expect(next.nodes.rB.parentId).toBe("sZ");
    // rB's own subtree (colC -> sE -> tF) travels with it, untouched
    expect(childIdsOf(next, "colC")).toEqual(["sE"]);
    expect(childIdsOf(next, "sE")).toEqual(["tF"]);
  });

  it("moveNodeInTree promotes a nested node back to the canvas root", () => {
    const tree = buildFixture();

    const next = moveNodeInTree(tree, "sE", null, 1);

    expect(next.rootIds).toEqual(["sA", "sE"]);
    expect(next.nodes.sE.parentId).toBeNull();
    expect(childIdsOf(next, "colC")).toEqual([]);
  });

  it("moveNodeInTree reorders within the same container", () => {
    const tree = buildFixture();
    const withSibling = insertNode(tree, createDefaultTextBlock("tG", "sE"), "sE", 1); // sE: [tF, tG]

    const next = moveNodeInTree(withSibling, "tG", "sE", 0);

    expect(childIdsOf(next, "sE")).toEqual(["tG", "tF"]);
  });

  it("moveNodeInTree rejects dropping a container into its own descendant (cycle guard)", () => {
    const tree = buildFixture();

    const next = moveNodeInTree(tree, "rB", "sE", 0); // sE is under rB itself

    expect(next).toBe(tree); // no-op: unchanged reference
  });

  it("moveNodeInTree rejects dropping a container into itself", () => {
    const tree = buildFixture();

    const next = moveNodeInTree(tree, "sE", "sE", 0);

    expect(next).toBe(tree);
  });

  it("cloneSubtree on a leaf returns a single cloned node with a new id, same field values", () => {
    const tree = buildFixture();

    const clone = cloneSubtree(tree, "tF", () => "clone-tF");

    expect(clone.rootId).toBe("clone-tF");
    expect(Object.keys(clone.nodes)).toEqual(["clone-tF"]);
    expect(clone.nodes["clone-tF"]).toEqual({ ...tree.nodes.tF, id: "clone-tF" });
  });

  it("cloneSubtree mints a new id for every node in the subtree and remaps childIds to match", () => {
    const tree = buildFixture();
    let n = 0;
    const clone = cloneSubtree(tree, "rB", () => `c${n++}`); // pre-order: rB, colC, sE, tF

    expect(clone.rootId).toBe("c0");
    expect(Object.keys(clone.nodes).sort()).toEqual(["c0", "c1", "c2", "c3"]);
    expect(clone.nodes.c0).toMatchObject({ id: "c0", type: "row", childIds: ["c1"], parentId: "sA" });
    expect(clone.nodes.c1).toMatchObject({ id: "c1", type: "row-column", childIds: ["c2"], parentId: "c0" });
    expect(clone.nodes.c2).toMatchObject({ id: "c2", type: "section", childIds: ["c3"], parentId: "c1" });
    expect(clone.nodes.c3).toMatchObject({ id: "c3", type: "text", parentId: "c2" });
  });

  it("cloneSubtree defaults to crypto.randomUUID when nextId is omitted", () => {
    const tree = buildFixture();

    const clone = cloneSubtree(tree, "tF");

    expect(clone.rootId).not.toBe("tF");
    expect(clone.rootId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("cloneSubtree does not mutate the original tree", () => {
    const tree = buildFixture();
    const rBBefore = tree.nodes.rB;
    const colCBefore = tree.nodes.colC;

    cloneSubtree(tree, "rB");

    expect(tree.nodes.rB).toBe(rBBefore);
    expect(tree.nodes.colC).toBe(colCBefore);
    expect((tree.nodes.rB as RowBlock).childIds).toEqual(["colC"]);
  });
});
