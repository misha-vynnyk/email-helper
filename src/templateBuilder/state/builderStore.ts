import { create } from "zustand";

import { type CanvasTree, childIdsOf, collectDescendantIds, insertNode, isDescendantOrSelf, moveNodeInTree, removeNodeFromTree } from "./canvasTree";
import { getSelectedId, selectBlock } from "./selectionStore";

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

/** Applies a pure `CanvasTree` transform to the store — every mutating action below is a thin
 * wrapper over one of these transforms, kept in `canvasTree.ts` so they stay independently
 * testable without a Zustand store in the loop. */
function mutateTree(fn: (tree: CanvasTree) => CanvasTree) {
  builderStore.setState((s) => fn({ nodes: s.nodes, rootIds: s.rootIds }));
}

export function useShellConfig() {
  return builderStore((s) => s.shell);
}

export function getShellConfig() {
  return builderStore.getState().shell;
}

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
  mutateTree((tree) => insertNode(tree, leaf, parentId, Number.MAX_SAFE_INTEGER));
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
  mutateTree((tree) => insertNode(tree, block, parentId, Number.MAX_SAFE_INTEGER));
  return id;
}

/** Spawns a new Section or Row into `parentId` (`null` = canvas root). For a Row, also spawns
 * `columnCount` `row-column` children, each getting an even `widthPercent` split. */
export function addContainer(parentId: string | null, type: "section" | "row", columnCount: 2 | 3 = 2): string {
  const id = crypto.randomUUID();

  if (type === "section") {
    const section = createDefaultSectionBlock(id, parentId);
    mutateTree((tree) => insertNode(tree, section, parentId, Number.MAX_SAFE_INTEGER));
    return id;
  }

  const row = createDefaultRowBlock(id, parentId);
  const widths = evenWidthPercents(columnCount);
  mutateTree((tree) => {
    let next = insertNode(tree, row, parentId, Number.MAX_SAFE_INTEGER);
    for (let i = 0; i < columnCount; i++) {
      const column = createDefaultRowColumnBlock(crypto.randomUUID(), id, widths[i]);
      next = insertNode(next, column, id, i);
    }
    return next;
  });
  return id;
}

function redistributeColumnWidths(tree: CanvasTree, rowId: string): CanvasTree {
  const columnIds = childIdsOf(tree, rowId);
  const widths = evenWidthPercents(columnIds.length);
  const nodes = { ...tree.nodes };
  columnIds.forEach((columnId, i) => {
    const column = nodes[columnId] as RowColumnBlock;
    nodes[columnId] = { ...column, widthPercent: widths[i] };
  });
  return { ...tree, nodes };
}

/** Appends a column to an existing row and re-splits every column's widthPercent evenly. No-op past MAX_ROW_COLUMNS. */
export function addColumn(rowId: string) {
  const row = getNode(rowId);
  if (!row || row.type !== "row" || row.childIds.length >= MAX_ROW_COLUMNS) return;

  mutateTree((tree) => {
    const column = createDefaultRowColumnBlock(crypto.randomUUID(), rowId, 0);
    const withColumn = insertNode(tree, column, rowId, row.childIds.length);
    return redistributeColumnWidths(withColumn, rowId);
  });
}

/** Removes one column (and its whole subtree) from a row and re-splits the remaining columns'
 * widthPercent evenly. No-op at MIN_ROW_COLUMNS. */
export function removeColumn(rowId: string, columnId: string) {
  const row = getNode(rowId);
  if (!row || row.type !== "row" || row.childIds.length <= MIN_ROW_COLUMNS) return;

  const removedIds = [columnId, ...collectDescendantIds(builderStore.getState().nodes, columnId)];
  mutateTree((tree) => redistributeColumnWidths(removeNodeFromTree(tree, columnId), rowId));

  const selectedId = getSelectedId();
  if (selectedId && removedIds.includes(selectedId)) selectBlock(null);
}

export function removeNode(id: string) {
  const removedIds = [id, ...collectDescendantIds(builderStore.getState().nodes, id)];
  mutateTree((tree) => removeNodeFromTree(tree, id));

  const selectedId = getSelectedId();
  if (selectedId && removedIds.includes(selectedId)) selectBlock(null);
}

/** Moves any node (leaf, or a whole Section/Row subtree) into another container — or back to
 * the canvas root when `toParentId` is `null` — or reorders it within its current container.
 * No-op if the move would drop a container into its own descendant (or itself). */
export function moveNode(id: string, toParentId: string | null, toIndex: number) {
  mutateTree((tree) => moveNodeInTree(tree, id, toParentId, toIndex));
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
  builderStore.setState((s) => {
    const node = s.nodes[id];
    if (!node || isContainerNode(node)) return {};
    return { nodes: { ...s.nodes, [id]: { ...node, ...patch } as NonContainerNode } };
  });
}

/** Sets a node's own `responsiveClassNames` — works for ANY node kind, including containers,
 * unlike `updateNodeFields` (which deliberately rejects containers so it can't be used to patch
 * container-specific typed fields onto them). `responsiveClassNames` lives on `BaseNode`, so
 * every kind — leaf, Section/Row/Row-column, ready-made — carries it; ResponsiveClassPicker is
 * shown for any selected node and needs this to actually persist for all of them, not just
 * non-containers. */
export function updateResponsiveClassNames(id: string, classNames: string[]) {
  builderStore.setState((s) => {
    const node = s.nodes[id];
    if (!node) return {};
    return { nodes: { ...s.nodes, [id]: { ...node, responsiveClassNames: classNames } } };
  });
}

export function updateSectionStyle(sectionId: string, patch: Partial<Omit<SectionBlock, "id" | "parentId" | "type" | "childIds">>) {
  builderStore.setState((s) => {
    const section = s.nodes[sectionId];
    if (!section || section.type !== "section") return {};
    return { nodes: { ...s.nodes, [sectionId]: { ...section, ...patch } } };
  });
}

export function updateRowStyle(rowId: string, patch: Partial<Pick<RowBlock, "padding" | "widthPx">>) {
  builderStore.setState((s) => {
    const row = s.nodes[rowId];
    if (!row || row.type !== "row") return {};
    return { nodes: { ...s.nodes, [rowId]: { ...row, ...patch } } };
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
}
