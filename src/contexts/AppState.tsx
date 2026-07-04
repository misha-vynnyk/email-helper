/**
 * Application Global State
 * Manages UI state using Zustand
 */

import { create } from "zustand";

import { BLOCK_LIBRARY_ENABLED } from "../config/featureFlags";

type AppState = {
  selectedMainTab: "email" | "blocks" | "templates" | "images" | "converter";
  samplesDrawerOpen: boolean;
};

// Load initial tab from localStorage
const loadSelectedTab = (): AppState["selectedMainTab"] => {
  try {
    const saved = localStorage.getItem("app-selected-main-tab");
    if (saved && ["email", "blocks", "templates", "images", "converter"].includes(saved)) {
      // A previously saved tab may point to a feature that is now hidden.
      if (saved === "blocks" && !BLOCK_LIBRARY_ENABLED) {
        return "email";
      }
      return saved as AppState["selectedMainTab"];
    }
  } catch {
    // Ignore errors
  }
  return "email";
};

const appStateStore = create<AppState>(() => ({
  selectedMainTab: loadSelectedTab(),
  samplesDrawerOpen: false,
}));

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
