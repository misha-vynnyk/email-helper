import { create } from "zustand";

import { type CanvasTree, childIdsOf, cloneSubtree, collectDescendantIds, insertNode, isDescendantOrSelf, moveNodeInTree, removeNodeFromTree } from "./canvasTree";
import { pushHistorySnapshot, redoToSnapshot, resetHistory, undoToSnapshot } from "./historyStore";
import { clearMultiSelection, getSelectedId, getSelectedIds, removeIdsFromSelection, selectBlock } from "./selectionStore";

import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import type { BuilderLeafBlock, BuilderNode, NonContainerNode, ReadyMadeBlock, RowBlock, RowColumnBlock, SectionBlock, ShellConfig } from "../types";
import {
  createDefaultButtonBlock,
  createDefaultDividerBlock,
  createDefaultImageBlock,
  createDefaultRowBlock,
  createDefaultRowColumnBlock,
  createDefaultSectionBlock,
  createDefaultShellConfig,
  createDefaultSpacerBlock,
  createDefaultTextBlock,
  evenWidthPercents,
  isContainerNode,
  MAX_ROW_COLUMNS,
  MIN_ROW_COLUMNS,
} from "../types";

interface BuilderState {
  shell: ShellConfig;
  rootIds: string[];
  nodes: Record<string, BuilderNode>;
}

const builderStore = create<BuilderState>(() => ({
  shell: createDefaultShellConfig(),
  rootIds: [],
  nodes: {},
}));

function getTree(): CanvasTree {
  const s = builderStore.getState();
  return { nodes: s.nodes, rootIds: s.rootIds };
}

/** The single choke-point for every tree-shape mutation below — pushes the pre-mutation tree
 * onto the undo history (coalescing fast bursts, e.g. Inspector keystrokes, into one step — see
 * historyStore.ts), then applies `updater`. Skips both the history push and the state write when
 * `updater` reports "no change" by returning the same `tree` reference back — the convention
 * every canvasTree.ts transform (and every mutator here) already follows for a no-op, so a
 * no-op call (e.g. updateNodeFields on an unknown id) can't pollute undo history or trigger a
 * redundant re-render. Scoped to `CanvasTree` (nodes/rootIds), not the whole `BuilderState` —
 * `updateShellConfig` intentionally stays outside undo history, see its own comment below. */
function commit(updater: (tree: CanvasTree) => CanvasTree, now: number = Date.now()): void {
  const before = getTree();
  const after = updater(before);
  if (after === before) return;
  pushHistorySnapshot({ rootIds: before.rootIds, nodes: before.nodes }, now);
  builderStore.setState({ nodes: after.nodes, rootIds: after.rootIds });
}

function pruneStaleSelection(nodes: Record<string, BuilderNode>): void {
  const selectedId = getSelectedId();
  if (selectedId && !nodes[selectedId]) selectBlock(null);
  const staleIds = [...getSelectedIds()].filter((id) => !nodes[id]);
  if (staleIds.length > 0) removeIdsFromSelection(staleIds);
}

/** Reverts to the tree state before the most recent undo step, pushing the current state onto
 * the redo stack first. No-op when there's nothing left to undo. Bypasses `commit()`
 * deliberately — applying an undo through `commit()` would itself push a new history entry,
 * breaking the redo chain. Also drops the current selection (single and multi) if it points at a
 * node the restored snapshot no longer has. */
export function undo(): void {
  const before = getTree();
  const snapshot = undoToSnapshot({ rootIds: before.rootIds, nodes: before.nodes });
  if (!snapshot) return;
  builderStore.setState(snapshot);
  pruneStaleSelection(snapshot.nodes);
}

/** Symmetric counterpart to `undo`. */
export function redo(): void {
  const before = getTree();
  const snapshot = redoToSnapshot({ rootIds: before.rootIds, nodes: before.nodes });
  if (!snapshot) return;
  builderStore.setState(snapshot);
  pruneStaleSelection(snapshot.nodes);
}

export function useShellConfig() {
  return builderStore((s) => s.shell);
}

export function getShellConfig() {
  return builderStore.getState().shell;
}

/** Deliberately outside undo history: `commit()` is scoped to `CanvasTree` (nodes/rootIds), and
 * `shell` (title/fonts/background colors) isn't part of that tree — folding it in would mean
 * every mutator's snapshot also carries shell state it never touches. Document-level settings
 * like this are a smaller, separate concern from canvas content edits, which is what undo/redo
 * is meant to cover here (mirrors Figma/Canva, where global doc settings aren't on the undo
 * stack the same way individual element edits are). */
export function updateShellConfig(patch: Partial<ShellConfig>) {
  builderStore.setState((s) => ({ shell: { ...s.shell, ...patch } }));
}

export function useRootIds() {
  return builderStore((s) => s.rootIds);
}

export function getRootIds() {
  return builderStore.getState().rootIds;
}

/** O(1) lookup by id — every canvas component subscribes to its own node this way instead of
 * receiving the whole object as a prop, so a change to one node only re-renders that node's
 * component (same pattern as `useIsSelected` in `selectionStore.ts`). */
export function useBuilderNode(id: string) {
  return builderStore((s) => s.nodes[id]);
}

export function getNode(id: string): BuilderNode | undefined {
  return builderStore.getState().nodes[id];
}

/** Whole map, for the render pipeline (`buildDocumentHtml`) which needs to resolve arbitrary
 * descendant ids while walking the tree — not for canvas components (use `useBuilderNode`). */
export function useNodesMap() {
  return builderStore((s) => s.nodes);
}

export function getNodesMap(): Record<string, BuilderNode> {
  return builderStore.getState().nodes;
}

/** Ordered child ids of a container, or `rootIds` when `parentId` is `null` — used by drag/drop
 * to compute the drop index within a target container. */
export function getChildIds(parentId: string | null): string[] {
  return childIdsOf(getTree(), parentId);
}

/** `parentId: null` spawns the leaf directly at the canvas root — a Section/Row is no longer
 * required to hold it. The render pipeline already produced a bare `<tr>` fragment for every
 * leaf, which is exactly what the shell's own content table expects as a direct child, so this
 * needed no render-side change — only lifting the drag/drop-level restriction (BuilderCanvas.tsx). */
export function addLeaf(parentId: string | null, type: BuilderLeafBlock["type"]): string {
  const id = crypto.randomUUID();
  const factory = {
    text: createDefaultTextBlock,
    image: createDefaultImageBlock,
    button: createDefaultButtonBlock,
    divider: createDefaultDividerBlock,
    spacer: createDefaultSpacerBlock,
  }[type];
  const leaf = factory(id, parentId);
  commit((tree) => insertNode(tree, leaf, parentId, Number.MAX_SAFE_INTEGER));
  return id;
}

/** Spawns a ready-made block (readyMadeCatalog.ts) into `parentId` (`null` = canvas root),
 * seeding its `values` from the definition's own slot defaults. Unknown `definitionId` is a
 * no-op (returns "" — shouldn't happen, the palette only ever offers catalog entries). */
export function addReadyMade(parentId: string | null, definitionId: string): string {
  const definition = READY_MADE_BY_ID.get(definitionId);
  if (!definition) return "";

  const id = crypto.randomUUID();
  const block: ReadyMadeBlock = {
    id,
    parentId,
    type: "ready-made",
    definitionId,
    values: Object.fromEntries(definition.slots.map((slot) => [slot.key, slot.defaultValue])),
  };
  commit((tree) => insertNode(tree, block, parentId, Number.MAX_SAFE_INTEGER));
  return id;
}

/** Spawns a new Section or Row into `parentId` (`null` = canvas root). For a Row, also spawns
 * `columnCount` `row-column` children, each getting an even `widthPercent` split. */
export function addContainer(parentId: string | null, type: "section" | "row", columnCount: 2 | 3 = 2): string {
  const id = crypto.randomUUID();

  if (type === "section") {
    const section = createDefaultSectionBlock(id, parentId);
    commit((tree) => insertNode(tree, section, parentId, Number.MAX_SAFE_INTEGER));
    return id;
  }

  const row = createDefaultRowBlock(id, parentId);
  const widths = evenWidthPercents(columnCount);
  commit((tree) => {
    let next = insertNode(tree, row, parentId, Number.MAX_SAFE_INTEGER);
    for (let i = 0; i < columnCount; i++) {
      const column = createDefaultRowColumnBlock(crypto.randomUUID(), id, widths[i]);
      next = insertNode(next, column, id, i);
    }
    return next;
  });
  return id;
}

/** Pure tree-transform shared by `updateColumnWidths` (the public, general write path — divider
 * drag and any future UI) and `addColumn`/`removeColumn` (which need the redistribution folded
 * into their OWN single `commit()`, not a second one, so "add a column" stays one undo step
 * instead of splitting into two). No-op — same `tree` reference back — when `percents.length`
 * doesn't match the row's actual column count, protecting against a caller acting on stale data
 * (e.g. the column count changed mid-drag). */
function applyColumnWidthPercents(tree: CanvasTree, rowId: string, percents: number[]): CanvasTree {
  const columnIds = childIdsOf(tree, rowId);
  if (columnIds.length !== percents.length) return tree;
  const nodes = { ...tree.nodes };
  columnIds.forEach((columnId, i) => {
    nodes[columnId] = { ...(nodes[columnId] as RowColumnBlock), widthPercent: percents[i] };
  });
  return { ...tree, nodes };
}

/** Public, general write path for a row's column widths — what the column-divider drag
 * (CanvasColumnDivider.tsx) and any future UI call. `percents.length` must equal the row's
 * current column count or the call is a silent no-op. */
export function updateColumnWidths(rowId: string, percents: number[]): void {
  commit((tree) => applyColumnWidthPercents(tree, rowId, percents));
}

/** Appends a column to an existing row and re-splits every column's widthPercent evenly. No-op past MAX_ROW_COLUMNS. */
export function addColumn(rowId: string) {
  const row = getNode(rowId);
  if (!row || row.type !== "row" || row.childIds.length >= MAX_ROW_COLUMNS) return;

  commit((tree) => {
    const column = createDefaultRowColumnBlock(crypto.randomUUID(), rowId, 0);
    const withColumn = insertNode(tree, column, rowId, row.childIds.length);
    return applyColumnWidthPercents(withColumn, rowId, evenWidthPercents(row.childIds.length + 1));
  });
}

/** Removes one column (and its whole subtree) from a row and re-splits the remaining columns'
 * widthPercent evenly. No-op at MIN_ROW_COLUMNS. */
export function removeColumn(rowId: string, columnId: string) {
  const row = getNode(rowId);
  if (!row || row.type !== "row" || row.childIds.length <= MIN_ROW_COLUMNS) return;

  const removedIds = [columnId, ...collectDescendantIds(builderStore.getState().nodes, columnId)];
  commit((tree) => applyColumnWidthPercents(removeNodeFromTree(tree, columnId), rowId, evenWidthPercents(row.childIds.length - 1)));

  const selectedId = getSelectedId();
  if (selectedId && removedIds.includes(selectedId)) selectBlock(null);
  removeIdsFromSelection(removedIds);
}

export function removeNode(id: string) {
  const removedIds = [id, ...collectDescendantIds(builderStore.getState().nodes, id)];
  commit((tree) => removeNodeFromTree(tree, id));

  const selectedId = getSelectedId();
  if (selectedId && removedIds.includes(selectedId)) selectBlock(null);
  removeIdsFromSelection(removedIds);
}

/** Moves any node (leaf, or a whole Section/Row subtree) into another container — or back to
 * the canvas root when `toParentId` is `null` — or reorders it within its current container.
 * No-op if the move would drop a container into its own descendant (or itself). */
export function moveNode(id: string, toParentId: string | null, toIndex: number) {
  commit((tree) => moveNodeInTree(tree, id, toParentId, toIndex));
}

/** Deep-clones `id`'s whole subtree (a leaf, or a Section/Row with everything nested inside),
 * inserts the clone immediately after the original in the same parent, and selects the clone.
 * Returns the clone's new root id, or `""` (no-op, no commit) if `id` doesn't exist.
 *
 * `cloneSubtree` only produces the cloned node records — it doesn't know about sibling lists, so
 * the clone's descendants are merged into the tree's `nodes` map here BEFORE `insertNode` runs;
 * `insertNode` itself only ever writes one node record (its own root), so calling it against the
 * ORIGINAL tree (rather than this merged one) would silently drop every cloned descendant for
 * any container with children. */
export function duplicateNode(id: string): string {
  const node = getNode(id);
  if (!node) return "";
  let newId = "";
  commit((tree) => {
    const clone = cloneSubtree(tree, id);
    newId = clone.rootId;
    const merged: CanvasTree = { ...tree, nodes: { ...tree.nodes, ...clone.nodes } };
    const insertIndex = childIdsOf(tree, node.parentId).indexOf(id) + 1;
    return insertNode(merged, merged.nodes[newId], node.parentId, insertIndex);
  });
  selectBlock(newId);
  return newId;
}

/** Whether `containerId` is (or lies inside) the subtree rooted at `nodeId` — used by drag/drop
 * to reject an invalid drop target before calling `moveNode`. */
export function wouldCreateCycle(nodeId: string, containerId: string | null): boolean {
  if (containerId === null) return false;
  return isDescendantOrSelf(builderStore.getState().nodes, nodeId, containerId);
}

/** Patches a non-container node's own flat fields — any leaf today, a Phase-B ready-made block
 * tomorrow, and (via the shared `responsiveClassNames` on BaseNode) usable for either regardless
 * of type. Renamed from `updateLeaf`: the guard was already "any non-container node", the old
 * name just hadn't caught up yet. */
export function updateNodeFields(id: string, patch: Partial<NonContainerNode>) {
  commit((tree) => {
    const node = tree.nodes[id];
    if (!node || isContainerNode(node)) return tree;
    return { ...tree, nodes: { ...tree.nodes, [id]: { ...node, ...patch } as NonContainerNode } };
  });
}

/** Sets a node's own `responsiveClassNames` — works for ANY node kind, including containers,
 * unlike `updateNodeFields` (which deliberately rejects containers so it can't be used to patch
 * container-specific typed fields onto them). `responsiveClassNames` lives on `BaseNode`, so
 * every kind — leaf, Section/Row/Row-column, ready-made — carries it; ResponsiveClassPicker is
 * shown for any selected node and needs this to actually persist for all of them, not just
 * non-containers. */
export function updateResponsiveClassNames(id: string, classNames: string[]) {
  commit((tree) => {
    const node = tree.nodes[id];
    if (!node) return tree;
    return { ...tree, nodes: { ...tree.nodes, [id]: { ...node, responsiveClassNames: classNames } } };
  });
}

export function updateSectionStyle(sectionId: string, patch: Partial<Omit<SectionBlock, "id" | "parentId" | "type" | "childIds">>) {
  commit((tree) => {
    const section = tree.nodes[sectionId];
    if (!section || section.type !== "section") return tree;
    return { ...tree, nodes: { ...tree.nodes, [sectionId]: { ...section, ...patch } } };
  });
}

export function updateRowStyle(rowId: string, patch: Partial<Pick<RowBlock, "padding" | "widthPx">>) {
  commit((tree) => {
    const row = tree.nodes[rowId];
    if (!row || row.type !== "row") return tree;
    return { ...tree, nodes: { ...tree.nodes, [rowId]: { ...row, ...patch } } };
  });
}

export type BlockLookup =
  | { kind: "section"; block: SectionBlock }
  | { kind: "row"; block: RowBlock }
  | { kind: "leaf"; block: BuilderLeafBlock }
  | { kind: "ready-made"; block: ReadyMadeBlock };

export function findBlockOrLeaf(id: string): BlockLookup | undefined {
  const node = getNode(id);
  if (!node) return undefined;
  if (node.type === "section") return { kind: "section", block: node };
  if (node.type === "row") return { kind: "row", block: node };
  if (node.type === "row-column") return undefined;
  if (node.type === "ready-made") return { kind: "ready-made", block: node };
  return { kind: "leaf", block: node };
}

export function resetBuilderState() {
  builderStore.setState({ shell: createDefaultShellConfig(), rootIds: [], nodes: {} });
  selectBlock(null);
  clearMultiSelection();
  resetHistory();
}
