import { useCallback, useEffect, useRef, useState } from "react";
import { getElectronAPI } from "../../hooks/useElectronAPI";
import { IMAGE_DEFAULTS, STORAGE_KEYS } from "../constants";
import { useAppDiagnostics } from "./internal/useAppDiagnostics";
import { useEditorSync } from "./internal/useEditorSync";
import { useHtmlExport } from "./internal/useHtmlExport";
import { useUploadHistory } from "./internal/useUploadHistory";
import { useHtmlConverterSettings } from "./useHtmlConverterSettings";

export type StorageProfile = "default" | "alphaone" | "ttt";
export type ExportType = "html" | "mjml" | "both";
export type UploadMode = "playwright" | "electron";
export type ConverterMode = "simple" | "advanced";

interface UseHtmlConverterLogicProps {
  editorRef: React.RefObject<HTMLDivElement>;
  outputHtmlRef: React.RefObject<HTMLTextAreaElement>;
  outputMjmlRef: React.RefObject<HTMLTextAreaElement>;
}

export function useHtmlConverterLogic({ editorRef, outputHtmlRef, outputMjmlRef }: UseHtmlConverterLogicProps) {
  // 1. Settings Hook
  const settings = useHtmlConverterSettings();
  const { ui } = settings;

  // 2. Local State
  const rawPastedHtmlRef = useRef<string | null>(null);

  const [converterMode, setConverterMode] = useState<ConverterMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERTER_MODE);
      if (stored === "simple" || stored === "advanced") return stored as ConverterMode;
    } catch {
      // Fallback
    }
    return "simple";
  });

  const [fileName, setFileName] = useState("promo-1");
  const [storageProfile, setStorageProfile] = useState<StorageProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STORAGE_PROFILE);
      if (stored === "alphaone" || stored === "ttt" || stored === "default") {
        return stored as StorageProfile;
      }
    } catch {
      // Fallback
    }
    return "default";
  });

  const [exportType, setExportType] = useState<ExportType>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPORT_TYPE);
      if (stored === "html" || stored === "mjml" || stored === "both") {
        return stored as ExportType;
      }
    } catch {
      // Fallback
    }
    return "both";
  });

  // Electron and browser mode use separate localStorage keys so that an old
  // "playwright" value from the browser era never overrides Electron's default.
  const isElectron = !!getElectronAPI();
  const uploadModeKey = isElectron ? STORAGE_KEYS.UPLOAD_MODE_ELECTRON : STORAGE_KEYS.UPLOAD_MODE;

  const [uploadMode, setUploadMode] = useState<UploadMode>(() => {
    try {
      const stored = localStorage.getItem(uploadModeKey);
      if (stored === "playwright" || stored === "electron") return stored as UploadMode;
    } catch {
      // Fallback
    }
    return isElectron ? "electron" : "playwright";
  });

  // Persist settings when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORAGE_PROFILE, storageProfile);
  }, [storageProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPORT_TYPE, exportType);
  }, [exportType]);

  useEffect(() => {
    localStorage.setItem(uploadModeKey, uploadMode);
  }, [uploadMode, uploadModeKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERTER_MODE, converterMode);
  }, [converterMode]);

  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [triggerExtract, setTriggerExtract] = useState(0);
  const [uploadedUrlMap, setUploadedUrlMap] = useState<Record<string, string>>({});
  const [uploadedAltMap, setUploadedAltMap] = useState<Record<string, string>>({});
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [hasOutput, setHasOutput] = useState(false);

  const [autoProcess, setAutoProcess] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.autoProcess ?? IMAGE_DEFAULTS.AUTO_PROCESS;
      }
    } catch {
      // Fallback
    }
    return IMAGE_DEFAULTS.AUTO_PROCESS;
  });

  // 3. Setup Internal Hooks
  const { log, unseenLogCount, addLog, clearLogs } = useAppDiagnostics(ui.showLogsPanel);
  const { uploadHistory, handleAddToHistory, handleClearHistory, updateSessionAlts } = useUploadHistory();

  const handleAltsUpdate = useCallback(
    (altMap: Record<string, string>) => {
      setUploadedAltMap((prev) => ({ ...prev, ...altMap }));
      updateSessionAlts(altMap);
      addLog(`💾 Збережено ${Object.keys(altMap).length} оновлених Alt-текстів в історію`);
    },
    [addLog, updateSessionAlts]
  );

  const showImageProcessorRef = useRef(false);
  showImageProcessorRef.current = showImageProcessor;

  // Sync Logic (Editor -> HTML + triggers)
  const { inputHtml, clearInputHtml } = useEditorSync({
    editorRef,
    rawPastedHtmlRef,
    showImageProcessorRef,
    setShowImageProcessor,
    setTriggerExtract,
    clearMemory: () => {
      setUploadedUrlMap({});
      setUploadedAltMap({});
    },
  });

  // Export Logic
  const { handleResetReplacement, triggerResetReplacement, handleReplaceUrls, handleExportHTML, handleExportMJML, downloadFile, previewHtml, clearPreviewHtml } = useHtmlExport({
    editorRef,
    outputHtmlRef,
    outputMjmlRef,
    uploadedUrlMap,
    uploadedAltMap,
    addLog,
    setHasOutput,
    storageProfile,
    converterMode,
    rawPastedHtmlRef,
    downloadFolder: ui.downloadFolder,
    setDownloadFolder: (folder) => settings.setUi((prev) => ({ ...prev, downloadFolder: folder })),
  });

  const handleDownloadHTML = useCallback(async () => {
    if (outputHtmlRef.current) await downloadFile(outputHtmlRef.current.value, "html", fileName, ui.approveNeededValue);
  }, [downloadFile, outputHtmlRef, fileName, ui.approveNeededValue]);

  const handleDownloadMJML = useCallback(async () => {
    if (outputMjmlRef.current) await downloadFile(outputMjmlRef.current.value, "mjml", fileName, ui.approveNeededValue);
  }, [downloadFile, outputMjmlRef, fileName, ui.approveNeededValue]);

  // Combined Operations
  const handleAutoExportAll = useCallback(async () => {
    if (!editorRef.current) return;
    const editorContent = editorRef.current.innerHTML;
    if (!editorContent.trim()) {
      addLog("⚠️ Редактор порожній, нічого експортувати");
      return;
    }

    try {
      setIsAutoExporting(true);
      handleExportHTML();
      if (converterMode !== "advanced") handleExportMJML();

      if (Object.keys(uploadedUrlMap).length > 0) {
        handleReplaceUrls(uploadedUrlMap);
      } else {
        addLog("ℹ️ Немає завантажених URLs для підстановки — пропускаю replace");
      }

      if (exportType === "both" || exportType === "html") {
        await handleDownloadHTML();
      }
      if ((exportType === "both" || exportType === "mjml") && converterMode !== "advanced") {
        await handleDownloadMJML();
      }
    } finally {
      setIsAutoExporting(false);
    }
  }, [addLog, editorRef, handleExportHTML, handleExportMJML, handleReplaceUrls, uploadedUrlMap, handleDownloadHTML, handleDownloadMJML, exportType, converterMode]);

  const handleClear = useCallback(() => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    if (outputHtmlRef.current) outputHtmlRef.current.value = "";
    if (outputMjmlRef.current) outputMjmlRef.current.value = "";
    rawPastedHtmlRef.current = null;

    clearLogs();
    clearInputHtml();
    clearPreviewHtml();
    setShowImageProcessor(false);
    setTriggerExtract(0);
    setHasOutput(false);
    setUploadedUrlMap({});
    setUploadedAltMap({});

    triggerResetReplacement();
    addLog("🧹 Очищено");
  }, [addLog, editorRef, outputHtmlRef, outputMjmlRef, clearLogs, clearInputHtml, clearPreviewHtml, triggerResetReplacement]);

  const handleCopy = useCallback(
    async (content: string, type: string) => {
      try {
        await navigator.clipboard.writeText(content);
        addLog(`✅ ${type} скопійовано в буфер`);
      } catch (err) {
        addLog("❌ Помилка копіювання");
      }
    },
    [addLog]
  );

  const changeFileNumber = (delta: number) => {
    const match = fileName.match(/(\D*)(\d+)/);
    if (match) {
      const textPart = match[1];
      const numberPart = parseInt(match[2]) || 0;
      setFileName(textPart + (numberPart + delta));
    }
  };

  const setApproveNeeded = useCallback(
    (value: boolean) => {
      settings.setUi((prev) => ({ ...prev, approveNeededValue: value }));
    },
    [settings.setUi]
  );

  return {
    state: {
      fileName,
      approveNeeded: ui.approveNeededValue,
      storageProfile,
      exportType,
      uploadMode,
      converterMode,
      log,
      unseenLogCount,
      showImageProcessor,
      inputHtml,
      triggerExtract,
      uploadedUrlMap,
      isAutoExporting,
      uploadHistory,
      hasOutput,
      autoProcess,
      previewHtml,
    },
    actions: {
      setFileName,
      setApproveNeeded,
      setStorageProfile,
      setExportType,
      setUploadMode,
      setConverterMode,
      setAutoProcess,
      setUploadedUrlMap,
      setShowImageProcessor,
      changeFileNumber,
      addLog,
      handleAddToHistory,
      handleClearHistory,
      handleResetReplacement,
      handleReplaceUrls,
      handleAltsUpdate,
      handleExportHTML,
      handleExportMJML,
      handleDownloadHTML,
      handleDownloadMJML,
      handleAutoExportAll,
      handleClear,
      handleCopy,
      // For backwards compat:
      handleAutoProcess: handleAutoExportAll,
    },
    settings,
  };
}
