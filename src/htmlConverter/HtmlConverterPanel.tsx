/**
 * HTML to Table Converter Panel
 * Main UI component for converting HTML to table-based email code
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Box, Button, Checkbox, Divider, FormControlLabel, IconButton, Stack, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { Add as AddIcon, ContentCopy as CopyIcon, Download as DownloadIcon, Remove as RemoveIcon, SwapHoriz as ConvertIcon } from "@mui/icons-material";

import { borderRadius, spacingMUI } from "../theme/tokens";
import { formatHtml, formatMjml } from "./formatter";
import { useContentReplacer } from "./hooks/useContentReplacer";
import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./UploadHistory";
import { STORAGE_KEYS, UPLOAD_CONFIG, IMAGE_DEFAULTS } from "./constants";
import type { UploadSession } from "./types";
import { useHtmlConverterSettings } from "./hooks/useHtmlConverterSettings";
import { Header } from "./components/Header";
import { EditorToolbar } from "./components/EditorToolbar";
import { StyledPaper } from "./components/StyledPaper";

const LOG_LIMIT = 500;
const IMAGE_DETECT_DEBOUNCE_MS = 250;

// Removed local components SectionHeader and StyledPaper

export default function HtmlConverterPanel() {
  const theme = useTheme();
  // Refs for contenteditable divs
  const editorRef = useRef<HTMLDivElement>(null);
  const outputHtmlRef = useRef<HTMLTextAreaElement>(null);
  const outputMjmlRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [fileName, setFileName] = useState("promo-1");
  const [approveNeeded, setApproveNeeded] = useState(true);
  const [useAlfaOne, setUseAlfaOne] = useState(false);
  const logBufferRef = useRef<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [unseenLogCount, setUnseenLogCount] = useState(0);
  const showLogsPanelRef = useRef(true);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const showImageProcessorRef = useRef(false);
  const imageDetectTimerRef = useRef<number | null>(null);
  const [inputHtml, setInputHtml] = useState<string>("");
  const [triggerExtract, setTriggerExtract] = useState(0);
  const [uploadedUrlMap, setUploadedUrlMap] = useState<Record<string, string>>({});
  const [uploadedAltMap, setUploadedAltMap] = useState<Record<string, string>>({});
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadSession[]>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const resetReplacementRef = useRef<(() => void) | null>(null);
  const [hasOutput, setHasOutput] = useState(false);
  const [autoProcess, setAutoProcess] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.autoProcess ?? IMAGE_DEFAULTS.AUTO_PROCESS;
      }
    } catch {
      // Fallback to default
    }
    return IMAGE_DEFAULTS.AUTO_PROCESS;
  });

  const { ui, setUi, imageAnalysis, setImageAnalysis, aiBackendStatus } = useHtmlConverterSettings();

  // Removed uiAnchorEl and settingsTab logic (moved to Header)

  useEffect(() => {
    showLogsPanelRef.current = ui.showLogsPanel;
    // When opening logs panel: render full buffered logs and clear unseen counter.
    if (ui.showLogsPanel) {
      setLog([...logBufferRef.current]);
      setUnseenLogCount(0);
    } else {
      // When hiding logs panel: stop rendering logs entirely to save CPU/DOM.
      setLog([]);
      setUnseenLogCount(0);
    }
  }, [ui.showLogsPanel]);

  useEffect(() => {
    showImageProcessorRef.current = showImageProcessor;
  }, [showImageProcessor]);

  const addLog = useCallback((message: string) => {
    const next = [...logBufferRef.current, message];
    const bounded = next.length <= LOG_LIMIT ? next : next.slice(next.length - LOG_LIMIT);
    logBufferRef.current = bounded;

    // Only update React state (and thus rerender) when logs panel is visible.
    if (showLogsPanelRef.current) {
      setLog([...bounded]);
      return;
    }

    // When logs panel is hidden, keep a cheap counter for the badge.
    setUnseenLogCount((prev) => Math.min(prev + 1, LOG_LIMIT));
  }, []);

  const handleAddToHistory = useCallback((category: string, folderName: string, results: Array<{ filename: string; url: string; success: boolean }>, customAlts?: Record<string, string>) => {
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
          alt: customAlts?.[r.filename] || undefined,
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

  const { replaceUrlsInContentByMap, replaceUrlsInContent, replaceAltsInContent } = useContentReplacer();

  const handleReplaceUrls = useCallback(
    (urlMap: Record<string, string>) => {
      const storageUrls = Object.values(urlMap);

      if (storageUrls.length === 0) {
        addLog(`⚠️ Немає URLs для заміни`);
        return;
      }

      // Prefer exact mapping first (oldUrl -> newUrl).
      // Fallback to positional replacement ONLY if mapping replaced nothing.
      if (outputHtmlRef.current?.value) {
        let content = outputHtmlRef.current.value;
        const mapped = replaceUrlsInContentByMap(content, /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi, urlMap);

        if (mapped.count > 0) {
          content = mapped.replaced;
          addLog(`🔄 Замінено ${mapped.count} посилань в Output HTML`);
        } else {
          const positional = replaceUrlsInContent(content, /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi, storageUrls);
          content = positional.replaced;
          if (positional.count > 0) addLog(`🔄 Замінено ${positional.count} посилань в Output HTML`);
        }

        // Replace ALT attributes
        const altResult = replaceAltsInContent(content, uploadedAltMap);
        if (altResult.count > 0) {
          content = altResult.replaced;
          addLog(`🔄 Замінено ${altResult.count} ALT-атрибутів в Output HTML`);
        }

        outputHtmlRef.current.value = content;
      }

      if (outputMjmlRef.current?.value) {
        let content = outputMjmlRef.current.value;
        const mapped = replaceUrlsInContentByMap(content, /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi, urlMap);

        if (mapped.count > 0) {
          content = mapped.replaced;
          addLog(`🔄 Замінено ${mapped.count} посилань в Output MJML`);
        } else {
          const positional = replaceUrlsInContent(content, /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi, storageUrls);
          content = positional.replaced;
          if (positional.count > 0) addLog(`🔄 Замінено ${positional.count} посилань в Output MJML`);
        }

        // Replace ALT attributes
        const altResult = replaceAltsInContent(content, uploadedAltMap);
        if (altResult.count > 0) {
          content = altResult.replaced;
          addLog(`🔄 Замінено ${altResult.count} ALT-атрибутів в Output MJML`);
        }

        outputMjmlRef.current.value = content;
      }
    },
    [addLog, replaceUrlsInContent, replaceUrlsInContentByMap, replaceAltsInContent, uploadedAltMap]
  );

  // Setup paste handler and auto-detect images
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

          // Trigger extraction when images exist OR when image processor was previously visible
          // (so it can clear stale state after images are removed).
          if (hasImages || showImageProcessorRef.current) {
            setTriggerExtract((prev) => prev + 1);
          }
        }, IMAGE_DETECT_DEBOUNCE_MS);
      };

      // Capture original HTML from clipboard on paste
      const handlePaste = (e: ClipboardEvent) => {
        const html = e.clipboardData?.getData("text/html");
        if (html) {
          // Replace base64 images with placeholders for display
          const cleanHtml = html.replace(/src="data:image\/[^;]+;base64,[^"]{100,}"/g, (match) => {
            const mimeType = match.match(/data:image\/([^;]+)/)?.[1] || "unknown";
            const length = match.length;
            return `src="[IMAGE: ${mimeType}, ${length} bytes]"`;
          });

          // Save cleaned HTML for display
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
  }, [addLog]);

  const changeFileNumber = (delta: number) => {
    const match = fileName.match(/(\D*)(\d+)/);
    if (match) {
      const textPart = match[1];
      const numberPart = parseInt(match[2]) || 0;
      setFileName(textPart + (numberPart + delta));
    }
  };

  const handleExportHTML = () => {
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

      // Mark that output exists
      setHasOutput(true);

      // Reset replacement state (output regenerated with old URLs)
      if (resetReplacementRef.current) {
        resetReplacementRef.current();
      }

      addLog("✅ HTML експортовано");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту HTML: ${message}`);
    }
  };

  const handleExportMJML = () => {
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

      // Mark that output exists
      setHasOutput(true);

      // Reset replacement state (output regenerated with old URLs)
      if (resetReplacementRef.current) {
        resetReplacementRef.current();
      }

      addLog("✅ MJML експортовано");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту MJML: ${message}`);
    }
  };

  const handleCopyHTML = async () => {
    if (!outputHtmlRef.current) return;
    try {
      await navigator.clipboard.writeText(outputHtmlRef.current.value);
      addLog("✅ HTML скопійовано в буфер");
    } catch (err) {
      addLog("❌ Помилка копіювання");
    }
  };

  const handleCopyMJML = async () => {
    if (!outputMjmlRef.current) return;
    try {
      await navigator.clipboard.writeText(outputMjmlRef.current.value);
      addLog("✅ MJML скопійовано в буфер");
    } catch (err) {
      addLog("❌ Помилка копіювання");
    }
  };

  const handleCopyInputHtml = async () => {
    try {
      await navigator.clipboard.writeText(inputHtml);
      addLog("✅ Вхідний HTML скопійовано в буфер");
    } catch (err) {
      addLog("❌ Помилка копіювання");
    }
  };

  const downloadFile = (content: string, extension: string) => {
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
  };

  const handleDownloadHTML = () => {
    if (outputHtmlRef.current) {
      downloadFile(outputHtmlRef.current.value, "html");
    }
  };

  const handleDownloadMJML = () => {
    if (outputMjmlRef.current) {
      downloadFile(outputMjmlRef.current.value, "mjml");
    }
  };

  const handleAutoExportAll = useCallback(() => {
    if (!editorRef.current) return;

    const editorContent = editorRef.current.innerHTML;
    if (!editorContent.trim()) {
      addLog("⚠️ Редактор порожній, нічого експортувати");
      return;
    }

    try {
      setIsAutoExporting(true);

      // Export outputs
      handleExportHTML();
      handleExportMJML();

      // Replace URLs if we have a mapping for this session
      if (Object.keys(uploadedUrlMap).length > 0) {
        handleReplaceUrls(uploadedUrlMap);
      } else {
        addLog("ℹ️ Немає завантажених URLs для підстановки — пропускаю replace");
      }

      // Download both files
      handleDownloadHTML();
      handleDownloadMJML();
    } finally {
      setIsAutoExporting(false);
    }
  }, [addLog, handleDownloadHTML, handleDownloadMJML, handleExportHTML, handleExportMJML, handleReplaceUrls, uploadedUrlMap]);

  const handleClear = () => {
    if (imageDetectTimerRef.current) {
      window.clearTimeout(imageDetectTimerRef.current);
      imageDetectTimerRef.current = null;
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    if (outputHtmlRef.current) {
      outputHtmlRef.current.value = "";
    }
    if (outputMjmlRef.current) {
      outputMjmlRef.current.value = "";
    }
    logBufferRef.current = [];
    setLog([]);
    setUnseenLogCount(0);
    setInputHtml("");
    setShowImageProcessor(false);
    setTriggerExtract(0);
    setHasOutput(false);
    setUploadedUrlMap({});

    // Reset replacement state
    if (resetReplacementRef.current) {
      resetReplacementRef.current();
    }

    // Avoid re-adding "cleared" into freshly cleared logs when logs panel is hidden.
    addLog("🧹 Очищено");
  };

  const handleAltsUpdate = useCallback(
    (altMap: Record<string, string>) => {
      // 1. Update runtime state for replacement
      setUploadedAltMap((prev) => ({ ...prev, ...altMap }));

      // 2. Update history persistence
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

  return (
    <Box
      data-app-scroll='true'
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: ui.compactMode ? spacingMUI.base : spacingMUI.xl,
        gap: ui.compactMode ? spacingMUI.base : spacingMUI.lg,
      }}>
      {/* Header */}
      <Header ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={autoProcess} setAutoProcess={setAutoProcess} aiBackendStatus={aiBackendStatus} unseenLogCount={unseenLogCount} onClear={handleClear} />

      {ui.stickyActions && (
        <EditorToolbar
          onExportHTML={handleExportHTML}
          onExportMJML={handleExportMJML}
          onAutoExportAll={handleAutoExportAll}
          isAutoExporting={isAutoExporting}
          sx={{
            position: "sticky",
            top: spacingMUI.sm,
            zIndex: 10,
          }}
        />
      )}

      {/* Editor */}
      <StyledPaper>
        <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.base}>
          Редактор тексту ✏️
        </Typography>
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          sx={{
            minHeight: ui.compactMode ? 160 : 200,
            maxHeight: ui.compactMode ? 320 : 400,
            overflow: "auto",
            p: ui.compactMode ? spacingMUI.sm : spacingMUI.base,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: theme.palette.action.hover,
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: 1.6,
            transition: "all 0.2s ease",
            "&:focus": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
              backgroundColor: theme.palette.action.hover,
            },
            "&:empty:before": {
              content: '"Вставте або введіть текст сюди..."',
              color: theme.palette.text.disabled,
            },
          }}
        />
      </StyledPaper>

      {/* File Settings (always visible) */}
      <StyledPaper>
        <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.base}>
          Налаштування файлу
        </Typography>

        <Stack direction='row' spacing={spacingMUI.base} alignItems='center' flexWrap='wrap'>
          <Stack direction='row' spacing={spacingMUI.sm} alignItems='center' sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              label="Ім'я файлу"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              size='small'
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${borderRadius.md}px`,
                  transition: "all 0.2s ease",
                  "&.Mui-focused": {
                    backgroundColor: "transparent",
                    "& fieldset": {
                      borderWidth: "2px",
                    },
                  },
                },
              }}
            />
            <Tooltip title='Зменшити номер'>
              <IconButton size='small' onClick={() => changeFileNumber(-1)} color='primary'>
                <RemoveIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Збільшити номер'>
              <IconButton size='small' onClick={() => changeFileNumber(1)} color='primary'>
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>

          <FormControlLabel control={<Checkbox checked={approveNeeded} onChange={(e) => setApproveNeeded(e.target.checked)} size='small' />} label={<Typography variant='body2'>Approve needed</Typography>} />

          <FormControlLabel control={<Checkbox checked={useAlfaOne} onChange={(e) => setUseAlfaOne(e.target.checked)} size='small' />} label={<Typography variant='body2'>AlfaOne</Typography>} />

          <Tooltip title='Експортувати HTML+MJML → підставити storage URLs (якщо є) → скачати два файли'>
            <span>
              <Button variant='contained' size='small' onClick={handleAutoExportAll} disabled={isAutoExporting} startIcon={<DownloadIcon fontSize='small' />} sx={{ textTransform: "none", whiteSpace: "nowrap", ml: "auto" }}>
                {isAutoExporting ? "Готую..." : "Зробити все"}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </StyledPaper>

      {/* Image Processor - only visible when images detected */}
      <ImageProcessor editorRef={editorRef} onLog={addLog} visible={showImageProcessor} onVisibilityChange={setShowImageProcessor} triggerExtract={triggerExtract} fileName={fileName} onHistoryAdd={handleAddToHistory} onReplaceUrls={handleReplaceUrls} onUploadedUrlsChange={setUploadedUrlMap} onUploadedAltsChange={handleAltsUpdate} onResetReplacement={handleResetReplacement} hasOutput={hasOutput} autoProcess={autoProcess} storageProvider={useAlfaOne ? "alphaone" : "default"} imageAnalysisSettings={imageAnalysis} />

      {/* Output Blocks */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={spacingMUI.lg}>
        {/* HTML Output */}
        <StyledPaper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}>
          <Stack direction='row' spacing={spacingMUI.sm} mb={spacingMUI.base} flexWrap='wrap'>
            <Button variant='contained' size='small' onClick={handleExportHTML} startIcon={<ConvertIcon />} disabled={isAutoExporting}>
              Експортувати HTML
            </Button>
            <Button variant='outlined' size='small' onClick={handleDownloadHTML} startIcon={<DownloadIcon fontSize='small' />}>
              Завантажити
            </Button>
            <Button variant='outlined' size='small' onClick={handleCopyHTML} startIcon={<CopyIcon fontSize='small' />}>
              Copy
            </Button>
          </Stack>

          <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
            HTML результат:
          </Typography>
          <TextField
            inputRef={outputHtmlRef}
            multiline
            fullWidth
            rows={12}
            InputProps={{ readOnly: true }}
            placeholder="Після експорту тут з'явиться готовий HTML код..."
            sx={{
              flex: 1,
              "& .MuiInputBase-root": {
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.5,
                backgroundColor: theme.palette.action.hover,
                "&.Mui-focused": {
                  backgroundColor: theme.palette.action.hover,
                },
              },
            }}
          />
        </StyledPaper>

        {/* MJML Output */}
        <StyledPaper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}>
          <Stack direction='row' spacing={spacingMUI.sm} mb={spacingMUI.base} flexWrap='wrap'>
            <Button variant='contained' size='small' onClick={handleExportMJML} startIcon={<ConvertIcon />} disabled={isAutoExporting}>
              Експортувати MJML
            </Button>
            <Button variant='outlined' size='small' onClick={handleDownloadMJML} startIcon={<DownloadIcon fontSize='small' />}>
              Завантажити
            </Button>
            <Button variant='outlined' size='small' onClick={handleCopyMJML} startIcon={<CopyIcon fontSize='small' />}>
              Copy
            </Button>
          </Stack>

          <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
            MJML результат:
          </Typography>
          <TextField
            inputRef={outputMjmlRef}
            multiline
            fullWidth
            rows={12}
            InputProps={{ readOnly: true }}
            placeholder="Після експорту тут з'явиться готовий MJML код..."
            sx={{
              flex: 1,
              "& .MuiInputBase-root": {
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.5,
                backgroundColor: theme.palette.action.hover,
                "&.Mui-focused": {
                  backgroundColor: theme.palette.action.hover,
                },
              },
            }}
          />
        </StyledPaper>
      </Stack>

      {/* Input HTML & Log */}
      {((ui.showInputHtml && inputHtml) || (ui.showLogsPanel && log.length > 0)) && (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={spacingMUI.lg}>
          {/* Input HTML */}
          {ui.showInputHtml && inputHtml && (
            <StyledPaper
              sx={{
                flex: 1,
                maxHeight: ui.compactMode ? 220 : 300,
                overflow: "auto",
              }}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' mb={spacingMUI.sm}>
                <Typography variant='subtitle2' fontWeight={600}>
                  Вхідний HTML
                </Typography>
                <Tooltip title='Копіювати'>
                  <IconButton size='small' onClick={handleCopyInputHtml}>
                    <CopyIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider sx={{ mb: spacingMUI.sm }} />
              <Box
                component='pre'
                sx={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "text.secondary",
                  lineHeight: 1.6,
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                {inputHtml}
              </Box>
            </StyledPaper>
          )}

          {/* Log */}
          {ui.showLogsPanel && log.length > 0 && (
            <StyledPaper
              sx={{
                flex: 1,
                maxHeight: ui.compactMode ? 220 : 300,
                overflow: "auto",
              }}>
              <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
                Лог операцій
              </Typography>
              <Divider sx={{ mb: spacingMUI.sm }} />
              {log.map((entry, idx) => (
                <Typography
                  key={idx}
                  variant='caption'
                  display='block'
                  sx={{
                    fontFamily: "monospace",
                    color: "text.secondary",
                    lineHeight: 1.8,
                    py: 0.25,
                  }}>
                  {entry}
                </Typography>
              ))}
            </StyledPaper>
          )}
        </Stack>
      )}

      {/* Upload History - Always visible when there are sessions */}
      {ui.showUploadHistory && <UploadHistory sessions={uploadHistory} onClear={handleClearHistory} />}
    </Box>
  );
}
