import { create } from "zustand";

interface SelectionState {
  selectedId: string | null;
  /** Independent from `selectedId` — a future multi-select UI (marquee, shift-click) toggles
   * membership here without disturbing the single-selection field SelectionToolbar/Inspector
   * key off of today. `selectBlock(null)` deliberately does not touch this. */
  selectedIds: Set<string>;
}

const selectionStore = create<SelectionState>(() => ({ selectedId: null, selectedIds: new Set() }));

export function useSelectedId() {
  return selectionStore((s) => s.selectedId);
}

/** Subscribes to whether one specific block/leaf is selected, not the raw selectedId — so a
 * selection change only re-renders the two components whose own isSelected flag actually flips,
 * instead of every canvas box in the document. */
export function useIsSelected(id: string): boolean {
  return selectionStore((s) => s.selectedId === id);
}

export function getSelectedId(): string | null {
  return selectionStore.getState().selectedId;
}

export function selectBlock(id: string | null) {
  selectionStore.setState({ selectedId: id });
}

export function useSelectedIds(): Set<string> {
  return selectionStore((s) => s.selectedIds);
}

export function useIsMultiSelected(id: string): boolean {
  return selectionStore((s) => s.selectedIds.has(id));
}

export function getSelectedIds(): Set<string> {
  return selectionStore.getState().selectedIds;
}

export function toggleBlockSelection(id: string): void {
  selectionStore.setState((s) => {
    const next = new Set(s.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  });
}

/** Used by `removeNode`/`removeColumn` (builderStore.ts) to drop deleted ids out of the
 * multi-selection — same "clear on delete" pattern already applied to `selectedId`. No-op (and
 * no re-render) if none of `ids` are currently selected. */
export function removeIdsFromSelection(ids: string[]): void {
  selectionStore.setState((s) => {
    if (ids.every((id) => !s.selectedIds.has(id))) return {};
    const next = new Set(s.selectedIds);
    ids.forEach((id) => next.delete(id));
    return { selectedIds: next };
  });
}

export function clearMultiSelection(): void {
  selectionStore.setState({ selectedIds: new Set() });
}
