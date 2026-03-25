/**
 * Image Converter Settings Hook
 * Manages conversion settings with localStorage persistence.
 * Pattern: mirrors useHtmlConverterSettings from htmlConverter.
 */

import { useState, useEffect } from "react";

import {
  DEFAULT_AUTO_CONVERT,
  DEFAULT_AUTO_QUALITY,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COMPRESSION_MODE,
  DEFAULT_FORMAT,
  DEFAULT_PRESERVE_EXIF,
  DEFAULT_PRESERVE_FORMAT,
  DEFAULT_PROCESSING_MODE,
  DEFAULT_QUALITY,
} from "../constants";
import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../utils/storageKeys";
import { ConversionSettings } from "../types";

const DEFAULT_SETTINGS: ConversionSettings = {
  format: DEFAULT_FORMAT,
  quality: DEFAULT_QUALITY,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  resize: {
    mode: "original",
    preserveAspectRatio: true,
    allowUpscale: false,
  },
  processingMode: DEFAULT_PROCESSING_MODE,
  compressionMode: DEFAULT_COMPRESSION_MODE,
  autoConvert: DEFAULT_AUTO_CONVERT,
  preserveFormat: DEFAULT_PRESERVE_FORMAT,
  autoQuality: DEFAULT_AUTO_QUALITY,
  preserveExif: DEFAULT_PRESERVE_EXIF,
};

function loadSettings(): ConversionSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_CONVERTER_SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        resize: parsed.resize || DEFAULT_SETTINGS.resize,
      };
    }
  } catch (error) {
    logger.error("ImageConverter", "Failed to load settings", error);
  }
  return DEFAULT_SETTINGS;
}

export function useImageConverterSettings() {
  const [settings, setSettings] = useState<ConversionSettings>(() => loadSettings());

  // Persist settings on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_CONVERTER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      logger.error("ImageConverter", "Failed to save settings", error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<ConversionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
}
