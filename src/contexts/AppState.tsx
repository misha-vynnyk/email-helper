/**
 * Application Global State
 * Manages UI state using Zustand
 */

import { create } from "zustand";

type AppState = {
  document: any;

  selectedMainTab: "email" | "blocks" | "templates" | "images";
  selectedScreenSize: "desktop" | "mobile";

  samplesDrawerOpen: boolean;
};

const appStateStore = create<AppState>(() => ({
  document: {},
  selectedMainTab: "email",
  selectedScreenSize: "desktop",

  samplesDrawerOpen: false, // Hidden by default
}));

export function useDocument() {
  return appStateStore((s) => s.document);
}

export function useSelectedScreenSize() {
  return appStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return appStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: AppState["selectedMainTab"]) {
  return appStateStore.setState({ selectedMainTab });
}

export function useSamplesDrawerOpen() {
  return appStateStore((s) => s.samplesDrawerOpen);
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !appStateStore.getState().samplesDrawerOpen;
  return appStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: AppState["selectedScreenSize"]) {
  return appStateStore.setState({ selectedScreenSize });
}
