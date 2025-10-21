import { create } from "zustand";

type TValue = {
  document: any;

  selectedMainTab: "email" | "blocks" | "templates" | "images";
  selectedScreenSize: "desktop" | "mobile";

  samplesDrawerOpen: boolean;
};

const editorStateStore = create<TValue>(() => ({
  document: {},
  selectedMainTab: "email",
  selectedScreenSize: "desktop",

  samplesDrawerOpen: true,
}));

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue["selectedMainTab"]) {
  return editorStateStore.setState({ selectedMainTab });
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen);
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen;
  return editorStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue["selectedScreenSize"]) {
  return editorStateStore.setState({ selectedScreenSize });
}
