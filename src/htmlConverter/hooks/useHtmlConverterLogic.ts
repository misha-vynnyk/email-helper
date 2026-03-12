import { useState, useCallback, useRef } from "react";
import { useHtmlConverterSettings } from "./useHtmlConverterSettings";
import { useAppDiagnostics } from "./internal/useAppDiagnostics";
import { useUploadHistory } from "./internal/useUploadHistory";
import { useEditorSync } from "./internal/useEditorSync";
import { useHtmlExport } from "./internal/useHtmlExport";
import { STORAGE_KEYS, IMAGE_DEFAULTS } from "../constants";

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
  const [fileName, setFileName] = useState("promo-1");
  const [useAlfaOne, setUseAlfaOne] = useState(false);
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
    showImageProcessorRef,
    setShowImageProcessor,
    setTriggerExtract,
    clearMemory: () => {
      setUploadedUrlMap({});
      setUploadedAltMap({});
    },
  });

  // Export Logic
  const {
    handleResetReplacement,
    triggerResetReplacement,
    handleReplaceUrls,
    handleExportHTML,
    handleExportMJML,
    downloadFile,
  } = useHtmlExport({
    editorRef,
    outputHtmlRef,
    outputMjmlRef,
    uploadedUrlMap,
    uploadedAltMap,
    addLog,
    setHasOutput,
  });

  const handleDownloadHTML = useCallback(() => {
    if (outputHtmlRef.current) downloadFile(outputHtmlRef.current.value, "html", fileName, ui.approveNeededValue);
  }, [downloadFile, outputHtmlRef, fileName, ui.approveNeededValue]);

  const handleDownloadMJML = useCallback(() => {
    if (outputMjmlRef.current) downloadFile(outputMjmlRef.current.value, "mjml", fileName, ui.approveNeededValue);
  }, [downloadFile, outputMjmlRef, fileName, ui.approveNeededValue]);

  // Combined Operations
  const handleAutoExportAll = useCallback(() => {
    if (!editorRef.current) return;
    const editorContent = editorRef.current.innerHTML;
    if (!editorContent.trim()) {
      addLog("⚠️ Редактор порожній, нічого експортувати");
      return;
    }

    try {
      setIsAutoExporting(true);
      handleExportHTML();
      handleExportMJML();

      if (Object.keys(uploadedUrlMap).length > 0) {
        handleReplaceUrls(uploadedUrlMap);
      } else {
        addLog("ℹ️ Немає завантажених URLs для підстановки — пропускаю replace");
      }

      handleDownloadHTML();
      handleDownloadMJML();
    } finally {
      setIsAutoExporting(false);
    }
  }, [addLog, editorRef, handleExportHTML, handleExportMJML, handleReplaceUrls, uploadedUrlMap, handleDownloadHTML, handleDownloadMJML]);

  const handleClear = useCallback(() => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    if (outputHtmlRef.current) outputHtmlRef.current.value = "";
    if (outputMjmlRef.current) outputMjmlRef.current.value = "";

    clearLogs();
    clearInputHtml();
    setShowImageProcessor(false);
    setTriggerExtract(0);
    setHasOutput(false);
    setUploadedUrlMap({});
    setUploadedAltMap({});

    triggerResetReplacement();
    addLog("🧹 Очищено");
  }, [addLog, editorRef, outputHtmlRef, outputMjmlRef, clearLogs, clearInputHtml, triggerResetReplacement]);

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
      useAlfaOne,
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
    },
    actions: {
      setFileName,
      setApproveNeeded,
      setUseAlfaOne,
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
      handleAutoProcess: handleAutoExportAll
    },
    settings,
  };
}
