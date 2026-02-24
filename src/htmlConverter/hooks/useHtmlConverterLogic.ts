import { useState, useRef, useEffect, useCallback } from "react";
import { formatHtml, formatMjml } from "../formatter";
import { useContentReplacer } from "./useContentReplacer";
import { STORAGE_KEYS, UPLOAD_CONFIG, IMAGE_DEFAULTS } from "../constants";
import type { UploadSession, UploadResult } from "../types";
import { useHtmlConverterSettings } from "./useHtmlConverterSettings";

const LOG_LIMIT = 500;
const IMAGE_DETECT_DEBOUNCE_MS = 250;

interface UseHtmlConverterLogicProps {
  editorRef: React.RefObject<HTMLDivElement>;
  outputHtmlRef: React.RefObject<HTMLTextAreaElement>;
  outputMjmlRef: React.RefObject<HTMLTextAreaElement>;
}

export function useHtmlConverterLogic({ editorRef, outputHtmlRef, outputMjmlRef }: UseHtmlConverterLogicProps) {
  // 1. Settings Hook Integration
  const settings = useHtmlConverterSettings();
  const { ui } = settings;

  // 2. Local State
  const [fileName, setFileName] = useState("promo-1");
  const approveNeeded = ui.approveNeededValue;
  const setApproveNeeded = useCallback(
    (value: boolean) => {
      settings.setUi((prev) => ({ ...prev, approveNeededValue: value }));
    },
    [settings.setUi]
  );
  const [useAlfaOne, setUseAlfaOne] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [unseenLogCount, setUnseenLogCount] = useState(0);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [inputHtml, setInputHtml] = useState<string>("");
  const [triggerExtract, setTriggerExtract] = useState(0);
  const [uploadedUrlMap, setUploadedUrlMap] = useState<Record<string, string>>({});
  const [uploadedAltMap, setUploadedAltMap] = useState<Record<string, string>>({});
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [hasOutput, setHasOutput] = useState(false);

  const [uploadHistory, setUploadHistory] = useState<UploadSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [autoProcess, setAutoProcess] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.autoProcess ?? IMAGE_DEFAULTS.AUTO_PROCESS;
      }
    } catch {
      // Fallback
    }
    return IMAGE_DEFAULTS.AUTO_PROCESS;
  });

  // 3. Refs
  const logBufferRef = useRef<string[]>([]);
  const showLogsPanelRef = useRef(true);
  const showImageProcessorRef = useRef(false);
  const imageDetectTimerRef = useRef<number | null>(null);
  const resetReplacementRef = useRef<(() => void) | null>(null);

  // 4. Effects
  useEffect(() => {
    showLogsPanelRef.current = ui.showLogsPanel;
    if (ui.showLogsPanel) {
      setLog([...logBufferRef.current]);
      setUnseenLogCount(0);
    } else {
      setLog([]);
      setUnseenLogCount(0);
    }
  }, [ui.showLogsPanel]);

  useEffect(() => {
    showImageProcessorRef.current = showImageProcessor;
  }, [showImageProcessor]);

  // 5. Handlers & Logic
  const addLog = useCallback((message: string) => {
    const next = [...logBufferRef.current, message];
    const bounded = next.length <= LOG_LIMIT ? next : next.slice(next.length - LOG_LIMIT);
    logBufferRef.current = bounded;

    if (showLogsPanelRef.current) {
      setLog([...bounded]);
      return;
    }
    setUnseenLogCount((prev) => Math.min(prev + 1, LOG_LIMIT));
  }, []);

  // Paste & Input Handling
  useEffect(() => {
    if (editorRef.current) {
      const scheduleImageSync = () => {
        if (imageDetectTimerRef.current) {
          window.clearTimeout(imageDetectTimerRef.current);
        }
        imageDetectTimerRef.current = window.setTimeout(() => {
          if (!editorRef.current) return;

          const hasImages = editorRef.current.querySelector("img") !== null;
          if (hasImages) {
            setShowImageProcessor(true);
          }

          if (hasImages || showImageProcessorRef.current) {
            setTriggerExtract((prev) => prev + 1);
          }
        }, IMAGE_DETECT_DEBOUNCE_MS);
      };

      const handlePaste = (e: ClipboardEvent) => {
        const html = e.clipboardData?.getData("text/html");
        if (html) {
          const cleanHtml = html.replace(/src="data:image\/[^;]+;base64,[^"]{100,}"/g, (match) => {
            const mimeType = match.match(/data:image\/([^;]+)/)?.[1] || "unknown";
            const length = match.length;
            return `src="[IMAGE: ${mimeType}, ${length} bytes]"`;
          });
          setInputHtml(cleanHtml);
        }
        scheduleImageSync();
      };

      const handleInput = () => {
        scheduleImageSync();
      };

      editorRef.current.addEventListener("paste", handlePaste as EventListener);
      editorRef.current.addEventListener("input", handleInput);

      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener("paste", handlePaste as EventListener);
          editorRef.current.removeEventListener("input", handleInput);
        }
        if (imageDetectTimerRef.current) {
          window.clearTimeout(imageDetectTimerRef.current);
          imageDetectTimerRef.current = null;
        }
      };
    }
  }, [addLog, editorRef]);

  const changeFileNumber = (delta: number) => {
    const match = fileName.match(/(\D*)(\d+)/);
    if (match) {
      const textPart = match[1];
      const numberPart = parseInt(match[2]) || 0;
      setFileName(textPart + (numberPart + delta));
    }
  };

  const { replaceUrlsInContentByMap, replaceUrlsInContent, replaceAltsInContent } = useContentReplacer();

  const handleAddToHistory = useCallback((category: string, folderName: string, results: UploadResult[], customAlts?: Record<string, string>) => {
    const newSession: UploadSession = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      category,
      folderName,
      files: results
        .filter((r) => r.success)
        .map((r) => ({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          filename: r.filename,
          url: r.url,
          shortPath: (() => {
            try {
              const u = new URL(r.url);
              return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
            } catch {
              return r.url;
            }
          })(),
          category,
          folderName,
          alt: (r.fileId ? customAlts?.[r.fileId] : undefined) || customAlts?.[r.filename] || undefined,
        })),
    };

    setUploadHistory((prev) => {
      const updated = [newSession, ...prev].slice(0, UPLOAD_CONFIG.MAX_HISTORY_SESSIONS);
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setUploadHistory([]);
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
  }, []);

  const handleResetReplacement = useCallback((resetFn: () => void) => {
    resetReplacementRef.current = resetFn;
  }, []);

  const handleReplaceUrls = useCallback(
    (urlMap: Record<string, string>) => {
      const storageUrls = Object.values(urlMap);

      if (storageUrls.length === 0) {
        addLog(`⚠️ Немає URLs для заміни`);
        return;
      }

      const processOutput = (ref: React.RefObject<HTMLTextAreaElement>, type: "HTML" | "MJML") => {
        if (ref.current?.value) {
          let content = ref.current.value;
          const regex = type === "HTML" ? /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi : /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;

          const mapped = replaceUrlsInContentByMap(content, regex, urlMap);

          if (mapped.count > 0) {
            content = mapped.replaced;
            addLog(`🔄 Замінено ${mapped.count} посилань в Output ${type}`);
          } else {
            const positional = replaceUrlsInContent(content, regex, storageUrls);
            content = positional.replaced;
            if (positional.count > 0) addLog(`🔄 Замінено ${positional.count} посилань в Output ${type}`);
          }

          const altResult = replaceAltsInContent(content, uploadedAltMap);
          if (altResult.count > 0) {
            content = altResult.replaced;
            addLog(`🔄 Замінено ${altResult.count} ALT-атрибутів в Output ${type}`);
          }

          ref.current.value = content;
        }
      };

      processOutput(outputHtmlRef, "HTML");
      processOutput(outputMjmlRef, "MJML");
    },
    [addLog, replaceUrlsInContent, replaceUrlsInContentByMap, replaceAltsInContent, uploadedAltMap, outputHtmlRef, outputMjmlRef]
  );

  const handleAltsUpdate = useCallback(
    (altMap: Record<string, string>) => {
      setUploadedAltMap((prev) => ({ ...prev, ...altMap }));
      setUploadHistory((prev) => {
        const updatedHistory = prev.map((session) => ({
          ...session,
          files: session.files.map((file) => {
            if (altMap[file.url]) {
              return { ...file, alt: altMap[file.url] };
            }
            return file;
          }),
        }));
        localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(updatedHistory));
        return updatedHistory;
      });
      addLog(`💾 Збережено ${Object.keys(altMap).length} оновлених Alt-текстів в історію`);
    },
    [addLog]
  );

  const handleExportHTML = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const editorContent = editorRef.current.innerHTML;
      if (!editorContent.trim()) {
        addLog("⚠️ Редактор порожній, нічого експортувати");
        return;
      }
      const formattedContent = formatHtml(editorContent);
      if (outputHtmlRef.current) {
        outputHtmlRef.current.value = formattedContent;
      }
      setHasOutput(true);
      if (resetReplacementRef.current) resetReplacementRef.current();
      addLog("✅ HTML експортовано");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту HTML: ${message}`);
    }
  }, [addLog, editorRef, outputHtmlRef]);

  const handleExportMJML = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const editorContent = editorRef.current.innerHTML;
      if (!editorContent.trim()) {
        addLog("⚠️ Редактор порожній, нічого експортувати");
        return;
      }
      const formattedContent = formatMjml(editorContent);
      if (outputMjmlRef.current) {
        outputMjmlRef.current.value = formattedContent;
      }
      setHasOutput(true);
      if (resetReplacementRef.current) resetReplacementRef.current();
      addLog("✅ MJML експортовано");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту MJML: ${message}`);
    }
  }, [addLog, editorRef, outputMjmlRef]);

  const downloadFile = useCallback(
    (content: string, extension: string) => {
      const name = fileName.replace(/\s+/g, "").toUpperCase();
      const approvalText = approveNeeded ? "(Approve needed)" : "";
      const fullName = `${name}_${extension}${approvalText}.html`;

      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fullName;
      a.click();
      URL.revokeObjectURL(url);

      addLog(`📥 Завантажено: ${fullName}`);
    },
    [fileName, approveNeeded, addLog]
  );

  const handleDownloadHTML = useCallback(() => {
    if (outputHtmlRef.current) downloadFile(outputHtmlRef.current.value, "html");
  }, [downloadFile, outputHtmlRef]);

  const handleDownloadMJML = useCallback(() => {
    if (outputMjmlRef.current) downloadFile(outputMjmlRef.current.value, "mjml");
  }, [downloadFile, outputMjmlRef]);

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
    if (imageDetectTimerRef.current) {
      window.clearTimeout(imageDetectTimerRef.current);
      imageDetectTimerRef.current = null;
    }
    if (editorRef.current) editorRef.current.innerHTML = "";
    if (outputHtmlRef.current) outputHtmlRef.current.value = "";
    if (outputMjmlRef.current) outputMjmlRef.current.value = "";

    logBufferRef.current = [];
    setLog([]);
    setUnseenLogCount(0);
    setInputHtml("");
    setShowImageProcessor(false);
    setTriggerExtract(0);
    setHasOutput(false);
    setUploadedUrlMap({});
    setUploadedAltMap({});

    if (resetReplacementRef.current) resetReplacementRef.current();
    addLog("🧹 Очищено");
  }, [addLog, editorRef, outputHtmlRef, outputMjmlRef]);

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

  return {
    state: {
      fileName,
      approveNeeded,
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
    },
    settings, // Pass through the entire settings object
  };
}
