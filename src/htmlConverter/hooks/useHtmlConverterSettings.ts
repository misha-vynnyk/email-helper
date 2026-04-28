import { useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "../constants";
import type { ImageAnalysisSettings } from "../types";

export type UiSettings = {
  showLogsPanel: boolean;
  showInputHtml: boolean;
  showUploadHistory: boolean;
  rememberUiLayout: boolean;
  compactMode: boolean;
  stickyActions: boolean;
  showAdvancedOcrSettings: boolean;
  showApproveNeeded: boolean;
  approveNeededValue: boolean;
  ocrSimpleMode: "custom" | "fast" | "balanced" | "banner" | "max";
  autoCloseUploadDialog: boolean;
  warningFileSizeKB: number;
  showAiTerminal: boolean;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  showLogsPanel: true,
  showInputHtml: true,
  showUploadHistory: true,
  rememberUiLayout: true,
  compactMode: false,
  stickyActions: false,
  showAdvancedOcrSettings: false,
  showApproveNeeded: true,
  approveNeededValue: false,
  ocrSimpleMode: "custom",
  autoCloseUploadDialog: true,
  warningFileSizeKB: 1024,
  showAiTerminal: false,
};

export const DEFAULT_IMAGE_ANALYSIS_SETTINGS: ImageAnalysisSettings = {
  enabled: false,
  engine: "ocr",
  runMode: "manual",
  autoApplyAlt: "off",
  autoApplyFilename: "off",
  smartPrecheck: true,
  textLikelihoodThreshold: 0.075,
  precheckEdgeThreshold: 70,
  preprocess: true,
  preprocessContrast: 1.8,
  preprocessBrightness: 1.1,
  preprocessThreshold: 160,
  preprocessUseThreshold: true,
  preprocessBlur: false,
  preprocessBlurRadius: 1,
  preprocessSharpen: false,
  ocrScaleFactor: 2,
  ocrPsm: "11",
  ocrWhitelist: "",
  spellCorrectionBanner: true,
  roiEnabled: false,
  roiPreset: "full",
  roiX: 0,
  roiY: 0,
  roiW: 1,
  roiH: 1,
  ocrMinWidth: 1000,
  ocrMaxWidth: 1200,
  useAiBackend: false,
  aiProvider: "gemma3",
  autoAnalyzeMaxFiles: 0,
};

const loadUiSettings = (): UiSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UI_SETTINGS);
    if (!raw) return DEFAULT_UI_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_SETTINGS, ...(parsed || {}) };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
};

const loadImageAnalysisSettings = (): ImageAnalysisSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IMAGE_ANALYSIS_SETTINGS);
    if (!raw) return DEFAULT_IMAGE_ANALYSIS_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_IMAGE_ANALYSIS_SETTINGS, ...(parsed || {}) };
  } catch {
    return DEFAULT_IMAGE_ANALYSIS_SETTINGS;
  }
};

export function useHtmlConverterSettings() {
  const [ui, setUi] = useState<UiSettings>(() => loadUiSettings());
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisSettings>(() => loadImageAnalysisSettings());
  const [aiBackendStatus, setAiBackendStatus] = useState<"checking" | "online" | "offline" | "ollama_offline">("offline");
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI Backend Health Check
  useEffect(() => {
    if (!imageAnalysis.useAiBackend) {
      setAiBackendStatus("offline");
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await fetch("/ai-api/health", {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          // If User picked gemma3 but ollama is down, state is ollama_offline
          if (data.ollama_running === false && imageAnalysis.aiProvider === "gemma3") {
            setAiBackendStatus("ollama_offline");
          } else {
            setAiBackendStatus("online");
          }
        } else {
          setAiBackendStatus("offline");
        }
      } catch {
        setAiBackendStatus("offline");
      }
    };

    setAiBackendStatus("checking");
    checkHealth();

    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }
    healthCheckRef.current = setInterval(checkHealth, 30000);

    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
    };
  }, [imageAnalysis.useAiBackend, imageAnalysis.aiProvider]);

  // Persist UI Settings
  useEffect(() => {
    try {
      if (!ui.rememberUiLayout) {
        localStorage.removeItem(STORAGE_KEYS.UI_SETTINGS);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, JSON.stringify(ui));
    } catch {
      // ignore
    }
  }, [ui]);

  // Persist Image Analysis Settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_ANALYSIS_SETTINGS, JSON.stringify(imageAnalysis));
    } catch {
      // ignore
    }
  }, [imageAnalysis]);

  return {
    ui,
    setUi,
    imageAnalysis,
    setImageAnalysis,
    aiBackendStatus,
  };
}
