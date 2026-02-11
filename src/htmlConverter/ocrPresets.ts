/**
 * OCR preset configurations for image analysis
 * Extracted from SettingsPopover to reduce duplication
 */

import type { ImageAnalysisSettings } from "./types";

type OcrPreset = Partial<ImageAnalysisSettings>;

const BASE_PRESET: OcrPreset = {
  enabled: true,
  engine: "ocr",
  runMode: "manual",
  preprocess: true,
  roiX: 0,
  roiY: 0,
  roiW: 1,
  roiH: 1,
  spellCorrectionBanner: true,
};

export const OCR_PRESETS: Record<string, OcrPreset> = {
  fast: {
    ...BASE_PRESET,
    ocrScaleFactor: 1,
    ocrPsm: "11",
    ocrWhitelist: "",
    preprocessUseThreshold: false,
    preprocessBrightness: 1.0,
    preprocessBlur: false,
    preprocessSharpen: false,
    preprocessContrast: 1.6,
    smartPrecheck: true,
    roiEnabled: false,
    roiPreset: "full",
    ocrMinWidth: 800,
    ocrMaxWidth: 1100,
  },

  balanced: {
    ...BASE_PRESET,
    ocrScaleFactor: 2,
    ocrPsm: "11",
    ocrWhitelist: "",
    preprocessUseThreshold: true,
    preprocessThreshold: 160,
    preprocessBrightness: 1.1,
    preprocessBlur: false,
    preprocessSharpen: false,
    preprocessContrast: 1.8,
    smartPrecheck: true,
    roiEnabled: false,
    roiPreset: "full",
    ocrMinWidth: 1000,
    ocrMaxWidth: 1200,
  },

  banner: {
    ...BASE_PRESET,
    ocrScaleFactor: 2,
    ocrPsm: "6",
    ocrWhitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.'\"- ",
    preprocessUseThreshold: true,
    preprocessThreshold: 150,
    preprocessBrightness: 1.1,
    preprocessBlur: true,
    preprocessBlurRadius: 2,
    preprocessSharpen: true,
    preprocessContrast: 2.2,
    smartPrecheck: true,
    roiEnabled: true,
    roiPreset: "auto",
    ocrMinWidth: 1200,
    ocrMaxWidth: 1400,
  },

  max: {
    ...BASE_PRESET,
    ocrScaleFactor: 3,
    ocrPsm: "6",
    ocrWhitelist: "",
    preprocessUseThreshold: true,
    preprocessThreshold: 150,
    preprocessBrightness: 1.15,
    preprocessBlur: true,
    preprocessBlurRadius: 2,
    preprocessSharpen: true,
    preprocessContrast: 2.3,
    smartPrecheck: false,
    roiEnabled: true,
    roiPreset: "auto",
    ocrMinWidth: 1400,
    ocrMaxWidth: 1600,
  },
};
