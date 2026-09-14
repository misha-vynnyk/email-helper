import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../utils/storageKeys";

export interface PreviewConfig {
  cardWidth: number;
  cardHeight: number;
  containerHeight: number;
  dialogMaxWidth: "xs" | "sm" | "md" | "lg" | "xl";
  saveScrollPosition: boolean;
  hiddenSections: string[];
}

export const DEFAULT_CONFIG: PreviewConfig = {
  cardWidth: 600,
  cardHeight: 2000,
  containerHeight: 300,
  dialogMaxWidth: "lg",
  saveScrollPosition: true,
  hiddenSections: [],
};

export function loadPreviewConfig(): PreviewConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    logger.error("PreviewSettings", "Failed to load preview config", error);
  }
  return DEFAULT_CONFIG;
}

export function savePreviewConfig(config: PreviewConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG, JSON.stringify(config));
  } catch (error) {
    logger.error("PreviewSettings", "Failed to save preview config", error);
  }
}
