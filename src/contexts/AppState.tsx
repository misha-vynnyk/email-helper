/**
 * Application Global State
 * Manages UI state using Zustand
 */

import { create } from "zustand";

type AppState = {
  document: any;
  selectedMainTab: "email" | "blocks" | "templates" | "images" | "converter";
  samplesDrawerOpen: boolean;
};

// Load initial tab from localStorage
const loadSelectedTab = (): AppState["selectedMainTab"] => {
  try {
    const saved = localStorage.getItem("app-selected-main-tab");
    if (saved && ["email", "blocks", "templates", "images", "converter"].includes(saved)) {
      return saved as AppState["selectedMainTab"];
    }
  } catch {
    // Ignore errors
  }
  return "email";
};

const appStateStore = create<AppState>(() => ({
  document: {},
  selectedMainTab: loadSelectedTab(),
  samplesDrawerOpen: false,
}));

export function useDocument() {
  return appStateStore((s) => s.document);
}

export function useSelectedMainTab() {
  return appStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: AppState["selectedMainTab"]) {
  // Save to localStorage
  try {
    localStorage.setItem("app-selected-main-tab", selectedMainTab);
  } catch {
    // Ignore errors
  }
  return appStateStore.setState({ selectedMainTab });
}

export function useSamplesDrawerOpen() {
  return appStateStore((s) => s.samplesDrawerOpen);
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !appStateStore.getState().samplesDrawerOpen;
  return appStateStore.setState({ samplesDrawerOpen });
}
