import { create } from "zustand";

import type { BuilderLeafBlock, CanvasBlock, ImageBlock, RowBlock, SectionBlock, ShellConfig, TextBlock } from "../types";
import { createDefaultImageBlock, createDefaultRowBlock, createDefaultSectionBlock, createDefaultShellConfig, createDefaultTextBlock } from "../types";
import { getSelectedId, selectBlock } from "./selectionStore";

interface BuilderState {
  shell: ShellConfig;
  canvas: CanvasBlock[];
}

const builderStore = create<BuilderState>(() => ({
  shell: createDefaultShellConfig(),
  canvas: [],
}));

export const SECTION_CONTAINER_PREFIX = "section:";
export const COLUMN_CONTAINER_PREFIX = "column:";

export function sectionContainerId(sectionId: string): string {
  return `${SECTION_CONTAINER_PREFIX}${sectionId}`;
}

export function columnContainerId(rowId: string, columnId: string): string {
  return `${COLUMN_CONTAINER_PREFIX}${rowId}:${columnId}`;
}

/**
 * The one place that knows "a container is either a section's own children, or one column's
 * children" — every other function reaches a container through this pair (or through
 * getContainerChildren for read-only access) instead of re-branching section-vs-row itself.
 * Blocks that don't match containerId keep their original reference, so unrelated
 * sections/rows/columns don't get a new object identity (and don't force a re-render of
 * React.memo'd canvas components) when only one container actually changed.
 */
function withContainerChildren(canvas: CanvasBlock[], containerId: string, updateChildren: (children: BuilderLeafBlock[]) => BuilderLeafBlock[]): CanvasBlock[] {
  if (containerId.startsWith(SECTION_CONTAINER_PREFIX)) {
    const sectionId = containerId.slice(SECTION_CONTAINER_PREFIX.length);
    return canvas.map((block) => (block.type === "section" && block.id === sectionId ? { ...block, children: updateChildren(block.children) } : block));
  }
  const [rowId, columnId] = containerId.slice(COLUMN_CONTAINER_PREFIX.length).split(":");
  return canvas.map((block) => {
    if (block.type !== "row" || block.id !== rowId) return block;
    return { ...block, columns: block.columns.map((col) => (col.id === columnId ? { ...col, children: updateChildren(col.children) } : col)) };
  });
}

function insertLeafIntoContainer(canvas: CanvasBlock[], containerId: string, leaf: BuilderLeafBlock, index: number): CanvasBlock[] {
  return withContainerChildren(canvas, containerId, (children) => {
    const next = [...children];
    next.splice(index, 0, leaf);
    return next;
  });
}

export function useShellConfig() {
  return builderStore((s) => s.shell);
}

export function useCanvas() {
  return builderStore((s) => s.canvas);
}

export function getCanvas() {
  return builderStore.getState().canvas;
}

export function getShellConfig() {
  return builderStore.getState().shell;
}

/** Читає поточних дітей контейнера (секції чи колонки ряду) за його containerId — для розрахунку індексу drop. */
export function getContainerChildren(canvas: CanvasBlock[], containerId: string): BuilderLeafBlock[] {
  if (containerId.startsWith(SECTION_CONTAINER_PREFIX)) {
    const sectionId = containerId.slice(SECTION_CONTAINER_PREFIX.length);
    return (canvas.find((b) => b.type === "section" && b.id === sectionId) as SectionBlock | undefined)?.children ?? [];
  }
  const [rowId, columnId] = containerId.slice(COLUMN_CONTAINER_PREFIX.length).split(":");
  const row = canvas.find((b) => b.type === "row" && b.id === rowId) as RowBlock | undefined;
  return row?.columns.find((c) => c.id === columnId)?.children ?? [];
}

export function updateShellConfig(patch: Partial<ShellConfig>) {
  builderStore.setState((s) => ({ shell: { ...s.shell, ...patch } }));
}

export function addSection(): string {
  const section = createDefaultSectionBlock(crypto.randomUUID());
  builderStore.setState((s) => ({ canvas: [...s.canvas, section] }));
  return section.id;
}

export function addRow(columnCount: 2 | 3): string {
  const columnIds = Array.from({ length: columnCount }, () => crypto.randomUUID());
  const row = createDefaultRowBlock(crypto.randomUUID(), columnIds, columnCount);
  builderStore.setState((s) => ({ canvas: [...s.canvas, row] }));
  return row.id;
}

/** All ids "under" a top-level canvas block (itself plus any nested leaves) — used to invalidate
 * a dangling selection when the block (or a leaf inside it) is removed. */
function collectBlockAndLeafIds(block: CanvasBlock): string[] {
  if (block.type === "section") return [block.id, ...block.children.map((c) => c.id)];
  return [block.id, ...block.columns.flatMap((col) => col.children.map((c) => c.id))];
}

export function removeCanvasBlock(id: string) {
  const removedBlock = builderStore.getState().canvas.find((b) => b.id === id);
  builderStore.setState((s) => ({ canvas: s.canvas.filter((b) => b.id !== id) }));

  const selectedId = getSelectedId();
  if (selectedId && removedBlock && collectBlockAndLeafIds(removedBlock).includes(selectedId)) selectBlock(null);
}

export function reorderCanvasBlocks(fromIndex: number, toIndex: number) {
  builderStore.setState((s) => {
    const canvas = [...s.canvas];
    const [moved] = canvas.splice(fromIndex, 1);
    canvas.splice(toIndex, 0, moved);
    return { canvas };
  });
}

export function updateSectionStyle(sectionId: string, patch: Partial<Omit<SectionBlock, "id" | "type" | "children">>) {
  builderStore.setState((s) => ({
    canvas: s.canvas.map((b) => (b.type === "section" && b.id === sectionId ? { ...b, ...patch } : b)),
  }));
}

export function addLeaf(containerId: string, type: "text" | "image"): string {
  const leaf = type === "text" ? createDefaultTextBlock(crypto.randomUUID()) : createDefaultImageBlock(crypto.randomUUID());
  builderStore.setState((s) => ({ canvas: insertLeafIntoContainer(s.canvas, containerId, leaf, Number.MAX_SAFE_INTEGER) }));
  return leaf.id;
}

export function updateLeaf(leafId: string, patch: Partial<TextBlock> | Partial<ImageBlock>) {
  builderStore.setState((s) => {
    const lookup = findBlockOrLeaf(s.canvas, leafId);
    if (lookup?.kind !== "leaf") return {};
    // Only the one container holding this leaf gets a new reference — every other
    // section/row keeps its identity, so unrelated canvas boxes skip re-rendering on each keystroke.
    return { canvas: withContainerChildren(s.canvas, lookup.containerId, (children) => children.map((c) => (c.id === leafId ? ({ ...c, ...patch } as BuilderLeafBlock) : c))) };
  });
}

export function removeLeaf(leafId: string) {
  builderStore.setState((s) => {
    const lookup = findBlockOrLeaf(s.canvas, leafId);
    if (lookup?.kind !== "leaf") return {};
    return { canvas: withContainerChildren(s.canvas, lookup.containerId, (children) => children.filter((c) => c.id !== leafId)) };
  });

  if (getSelectedId() === leafId) selectBlock(null);
}

/** Переміщує лист (text/image) в інший контейнер (секцію чи колонку ряду), або переставляє в тому самому. */
export function moveLeaf(leafId: string, toContainerId: string, toIndex: number) {
  builderStore.setState((s) => {
    const lookup = findBlockOrLeaf(s.canvas, leafId);
    if (lookup?.kind !== "leaf") return {};
    const withoutLeaf = withContainerChildren(s.canvas, lookup.containerId, (children) => children.filter((c) => c.id !== leafId));
    return { canvas: insertLeafIntoContainer(withoutLeaf, toContainerId, lookup.block, toIndex) };
  });
}

export type BlockLookup = { kind: "section"; block: SectionBlock } | { kind: "row"; block: RowBlock } | { kind: "leaf"; block: BuilderLeafBlock; containerId: string };

export function findBlockOrLeaf(canvas: CanvasBlock[], id: string): BlockLookup | undefined {
  for (const block of canvas) {
    if (block.id === id) return block.type === "section" ? { kind: "section", block } : { kind: "row", block };
    if (block.type === "section") {
      const leaf = block.children.find((c) => c.id === id);
      if (leaf) return { kind: "leaf", block: leaf, containerId: sectionContainerId(block.id) };
    } else {
      for (const col of block.columns) {
        const leaf = col.children.find((c) => c.id === id);
        if (leaf) return { kind: "leaf", block: leaf, containerId: columnContainerId(block.id, col.id) };
      }
    }
  }
  return undefined;
}

export function resetBuilderState() {
  builderStore.setState({ shell: createDefaultShellConfig(), canvas: [] });
  selectBlock(null);
}
