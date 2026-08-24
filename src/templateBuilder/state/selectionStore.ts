import { create } from "zustand";

interface SelectionState {
  selectedId: string | null;
}

const selectionStore = create<SelectionState>(() => ({ selectedId: null }));

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
