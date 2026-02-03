/**
 * HTML to Table Converter Panel
 * Main UI component for converting HTML to table-based email code
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  alpha,
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Remove as RemoveIcon,
  Settings as SettingsIcon,
  SwapHoriz as ConvertIcon,
} from "@mui/icons-material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, opacity, spacingMUI } from "../theme/tokens";
import { formatHtml, formatMjml } from "./formatter";
import { isSignatureImageTag } from "./imageUtils";
import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./UploadHistory";
import { STORAGE_KEYS, UPLOAD_CONFIG, IMAGE_DEFAULTS } from "./constants";
import type { ImageAnalysisSettings, UploadSession } from "./types";

const LOG_LIMIT = 500;
const IMAGE_DETECT_DEBOUNCE_MS = 250;

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: spacingMUI.md, mb: spacingMUI.base }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: `${componentStyles.card.borderRadius}px`,
          bgcolor: alpha(theme.palette.primary.main, opacity.selected),
          color: "primary.main",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant='subtitle2'
          fontWeight={600}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant='caption'
            color='text.secondary'
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

interface StyledPaperProps {
  children: React.ReactNode;
  sx?: any;
}

function StyledPaper({ children, sx = {} }: StyledPaperProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Paper
      elevation={0}
      sx={{
        p: spacingMUI.base,
        borderRadius: `${componentStyles.card.borderRadius}px`,
        backgroundColor:
          componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

export default function HtmlConverterPanel() {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

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

  type UiSettings = {
    showLogsPanel: boolean;
    showInputHtml: boolean;
    showUploadHistory: boolean;
    rememberUiLayout: boolean;
    compactMode: boolean;
    stickyActions: boolean;
    showAdvancedOcrSettings: boolean;
    ocrSimpleMode: "custom" | "fast" | "balanced" | "banner" | "max";
  };

  const DEFAULT_UI_SETTINGS: UiSettings = {
    showLogsPanel: true,
    showInputHtml: true,
    showUploadHistory: true,
    rememberUiLayout: true,
    compactMode: false,
    stickyActions: false,
    showAdvancedOcrSettings: false,
    ocrSimpleMode: "custom",
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

  const [ui, setUi] = useState<UiSettings>(() => loadUiSettings());
  const [uiAnchorEl, setUiAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsTab, setSettingsTab] = useState<"ui" | "image">("ui");

  const DEFAULT_IMAGE_ANALYSIS_SETTINGS: ImageAnalysisSettings = {
    enabled: false,
    engine: "ocr",
    runMode: "manual",
    autoApplyAlt: "ifEmpty",
    autoApplyFilename: "ifEmpty",
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
    autoAnalyzeMaxFiles: 0,
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

  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisSettings>(() =>
    loadImageAnalysisSettings()
  );

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

  useEffect(() => {
    try {
      if (!ui.rememberUiLayout) {
        localStorage.removeItem(STORAGE_KEYS.UI_SETTINGS);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, JSON.stringify(ui));
    } catch {
      // ignore storage errors (private mode/quota)
    }
  }, [ui]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_ANALYSIS_SETTINGS, JSON.stringify(imageAnalysis));
    } catch {
      // ignore storage errors (private mode/quota)
    }
  }, [imageAnalysis]);

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

  const handleAddToHistory = useCallback(
    (
      category: string,
      folderName: string,
      results: Array<{ filename: string; url: string; success: boolean }>
    ) => {
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
          })),
      };

      setUploadHistory((prev) => {
        const updated = [newSession, ...prev].slice(0, UPLOAD_CONFIG.MAX_HISTORY_SESSIONS);
        localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const handleClearHistory = useCallback(() => {
    setUploadHistory([]);
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
  }, []);

  const handleResetReplacement = useCallback((resetFn: () => void) => {
    resetReplacementRef.current = resetFn;
  }, []);

  const replaceUrlsInContentByMap = useCallback(
    (content: string, pattern: RegExp, urlMap: Record<string, string>) => {
      let replacedCount = 0;
      const replaced = content.replace(pattern, (match, prefix, oldUrl, suffix) => {
        if (isSignatureImageTag(match)) return match;

        const candidates: string[] = [String(oldUrl)];
        try {
          candidates.push(new URL(String(oldUrl), window.location.href).toString());
        } catch {
          // ignore
        }

        for (const c of candidates) {
          const next = urlMap[c];
          if (next) {
            replacedCount++;
            return `${prefix}${next}${suffix}`;
          }
        }
        return match;
      });

      return { replaced, count: replacedCount };
    },
    []
  );

  const replaceUrlsInContent = useCallback(
    (content: string, pattern: RegExp, storageUrls: string[]) => {
      let imageIndex = 0;
      let replacedCount = 0;

      const replaced = content.replace(pattern, (match, prefix, _oldUrl, suffix) => {
        if (isSignatureImageTag(match)) return match;
        if (imageIndex < storageUrls.length) {
          const newUrl = storageUrls[imageIndex++];
          replacedCount++;
          return `${prefix}${newUrl}${suffix}`;
        }
        return match;
      });

      return { replaced, count: replacedCount };
    },
    []
  );

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
        const original = outputHtmlRef.current.value;
        const mapped = replaceUrlsInContentByMap(
          original,
          /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
          urlMap
        );

        if (mapped.count > 0) {
          outputHtmlRef.current.value = mapped.replaced;
          addLog(`🔄 Замінено ${mapped.count} посилань в Output HTML`);
        } else {
          const positional = replaceUrlsInContent(
            original,
            /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
            storageUrls
          );
          outputHtmlRef.current.value = positional.replaced;
          if (positional.count > 0) addLog(`🔄 Замінено ${positional.count} посилань в Output HTML`);
        }
      }

      if (outputMjmlRef.current?.value) {
        const original = outputMjmlRef.current.value;
        const mapped = replaceUrlsInContentByMap(
          original,
          /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
          urlMap
        );

        if (mapped.count > 0) {
          outputMjmlRef.current.value = mapped.replaced;
          addLog(`🔄 Замінено ${mapped.count} посилань в Output MJML`);
        } else {
          const positional = replaceUrlsInContent(
            original,
            /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
            storageUrls
          );
          outputMjmlRef.current.value = positional.replaced;
          if (positional.count > 0) addLog(`🔄 Замінено ${positional.count} посилань в Output MJML`);
        }
      }
    },
    [addLog, replaceUrlsInContent, replaceUrlsInContentByMap]
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
  }, [
    addLog,
    handleDownloadHTML,
    handleDownloadMJML,
    handleExportHTML,
    handleExportMJML,
    handleReplaceUrls,
    uploadedUrlMap,
  ]);

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

  return (
    <Box
      data-app-scroll='true'
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: ui.compactMode ? spacingMUI.base : spacingMUI.xl,
        gap: ui.compactMode ? spacingMUI.base : spacingMUI.lg,
      }}
    >
      {/* Header */}
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
      >
        <SectionHeader
          icon={<CodeIcon fontSize='small' />}
          title='HTML to Table Converter'
          subtitle='Конвертація HTML в табличну структуру для email'
        />
        <Stack
          direction='row'
          alignItems='center'
          spacing={spacingMUI.sm}
        >
          <Tooltip title='UI налаштування'>
            <IconButton
              size='small'
              onClick={(e) => {
                setUiAnchorEl(e.currentTarget);
                setSettingsTab("ui");
              }}
            >
              <Badge
                color='primary'
                badgeContent={!ui.showLogsPanel && unseenLogCount > 0 ? unseenLogCount : 0}
                max={99}
              >
                <SettingsIcon fontSize='small' />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title='Очистити все'>
            <IconButton
              onClick={handleClear}
              color='error'
              size='small'
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Popover
        open={Boolean(uiAnchorEl)}
        anchorEl={uiAnchorEl}
        onClose={() => setUiAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: `${borderRadius.lg}px`,
            background:
              componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            border: componentStyles.card.border,
            boxShadow: componentStyles.card.boxShadow,
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ minWidth: 420, maxWidth: 520 }}>
          <Box
            sx={{
              px: spacingMUI.base,
              pt: spacingMUI.base,
              pb: spacingMUI.sm,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacingMUI.sm,
            }}
          >
            <Box>
              <Typography variant='subtitle2' fontWeight={700}>
                Налаштування
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                HTML Converter
              </Typography>
            </Box>
            <IconButton size='small' onClick={() => setUiAnchorEl(null)}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>

          <Tabs
            value={settingsTab}
            onChange={(_, v) => setSettingsTab(v)}
            variant='fullWidth'
            sx={{
              px: spacingMUI.xs,
              minHeight: 40,
              "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 },
            }}
          >
            <Tab value='ui' label='Інтерфейс' />
            <Tab value='image' label='Зображення' />
          </Tabs>

          <Divider />

          <Box
            sx={{
              p: spacingMUI.base,
              maxHeight: 520,
              overflowY: "auto",
            }}
          >
            {settingsTab === "ui" && (
              <>
                <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
                  Інтерфейс
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.showLogsPanel}
                        onChange={(e) =>
                          setUi((prev) => ({ ...prev, showLogsPanel: e.target.checked }))
                        }
                      />
                    }
                    label={<Typography variant='body2'>Показувати лог</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.showInputHtml}
                        onChange={(e) =>
                          setUi((prev) => ({ ...prev, showInputHtml: e.target.checked }))
                        }
                      />
                    }
                    label={<Typography variant='body2'>Показувати вхідний HTML</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.showUploadHistory}
                        onChange={(e) =>
                          setUi((prev) => ({ ...prev, showUploadHistory: e.target.checked }))
                        }
                      />
                    }
                    label={<Typography variant='body2'>Показувати історію завантажень</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.rememberUiLayout}
                        onChange={(e) =>
                          setUi((prev) => ({ ...prev, rememberUiLayout: e.target.checked }))
                        }
                      />
                    }
                    label={<Typography variant='body2'>Запамʼятовувати вигляд (layout)</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.compactMode}
                        onChange={(e) => setUi((prev) => ({ ...prev, compactMode: e.target.checked }))}
                      />
                    }
                    label={<Typography variant='body2'>Компактний режим</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.stickyActions}
                        onChange={(e) => setUi((prev) => ({ ...prev, stickyActions: e.target.checked }))}
                      />
                    }
                    label={<Typography variant='body2'>Закріпити кнопки зверху</Typography>}
                  />
                </FormGroup>
                <Typography variant='caption' color='text.secondary' display='block' mt={spacingMUI.sm}>
                  Якщо вимкнути «Запамʼятовувати вигляд» — ці налаштування не збережуться після перезавантаження.
                </Typography>
              </>
            )}

            {settingsTab === "image" && (
              <>
                <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
                  Зображення
                </Typography>

                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={autoProcess}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setAutoProcess(newValue);
                          try {
                            const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
                            const settings = stored ? JSON.parse(stored) : {};
                            settings.autoProcess = newValue;
                            localStorage.setItem(STORAGE_KEYS.IMAGE_SETTINGS, JSON.stringify(settings));
                          } catch {
                            // ignore
                          }
                        }}
                        size='small'
                      />
                    }
                    label={<Typography variant='body2'>Автообробка зображень</Typography>}
                  />
                </FormGroup>

                <Divider sx={{ my: spacingMUI.base }} />

                <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
                  Розпізнавання тексту на зображеннях (ALT/назви)
                </Typography>
                <Typography variant='caption' color='text.secondary' display='block' mb={spacingMUI.base}>
                  Працює в діалозі «Upload to Storage». Якщо не хочеш думати — вибери режим нижче.
                </Typography>

                <Stack spacing={spacingMUI.base}>
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={imageAnalysis.enabled}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                      />
                    }
                    label={<Typography variant='body2'>Увімкнути розпізнавання тексту</Typography>}
                  />

                  <FormControl
                    fullWidth
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                  >
                    <TextField
                      select
                      size='small'
                      label='Режим (простий вибір)'
                      value={ui.ocrSimpleMode}
                      onChange={(e) => {
                        const v = e.target.value;
                        setUi((prev) => ({ ...prev, ocrSimpleMode: v as UiSettings["ocrSimpleMode"] }));
                        if (v === "fast") {
                          setImageAnalysis((prev) => ({
                            ...prev,
                            enabled: true,
                            engine: "ocr",
                            runMode: "manual",
                            ocrScaleFactor: 1,
                            ocrPsm: "11",
                            ocrWhitelist: "",
                            preprocess: true,
                            preprocessUseThreshold: false,
                            preprocessBrightness: 1.0,
                            preprocessBlur: false,
                            preprocessSharpen: false,
                            preprocessContrast: 1.6,
                            smartPrecheck: true,
                            roiEnabled: false,
                            roiPreset: "full",
                            roiX: 0,
                            roiY: 0,
                            roiW: 1,
                            roiH: 1,
                            ocrMinWidth: 800,
                            ocrMaxWidth: 1100,
                            spellCorrectionBanner: true,
                          }));
                        } else if (v === "balanced") {
                          setImageAnalysis((prev) => ({
                            ...prev,
                            enabled: true,
                            engine: "ocr",
                            runMode: "manual",
                            ocrScaleFactor: 2,
                            ocrPsm: "11",
                            ocrWhitelist: "",
                            preprocess: true,
                            preprocessUseThreshold: true,
                            preprocessThreshold: 160,
                            preprocessBrightness: 1.1,
                            preprocessBlur: false,
                            preprocessSharpen: false,
                            preprocessContrast: 1.8,
                            smartPrecheck: true,
                            roiEnabled: false,
                            roiPreset: "full",
                            roiX: 0,
                            roiY: 0,
                            roiW: 1,
                            roiH: 1,
                            ocrMinWidth: 1000,
                            ocrMaxWidth: 1200,
                            spellCorrectionBanner: true,
                          }));
                        } else if (v === "banner") {
                          setImageAnalysis((prev) => ({
                            ...prev,
                            enabled: true,
                            engine: "ocr",
                            runMode: "manual",
                            ocrScaleFactor: 2,
                            ocrPsm: "6",
                            ocrWhitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.'\"- ",
                            preprocess: true,
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
                            roiX: 0,
                            roiY: 0,
                            roiW: 1,
                            roiH: 1,
                            ocrMinWidth: 1200,
                            ocrMaxWidth: 1400,
                            spellCorrectionBanner: true,
                          }));
                        } else if (v === "max") {
                          setImageAnalysis((prev) => ({
                            ...prev,
                            enabled: true,
                            engine: "ocr",
                            runMode: "manual",
                            ocrScaleFactor: 3,
                            ocrPsm: "6",
                            ocrWhitelist: "",
                            preprocess: true,
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
                            roiX: 0,
                            roiY: 0,
                            roiW: 1,
                            roiH: 1,
                            ocrMinWidth: 1400,
                            ocrMaxWidth: 1600,
                            spellCorrectionBanner: true,
                          }));
                        }
                      }}
                      helperText='Швидко = легше для ноутбука. Банер = найкраще для картинок з великим текстом. Максимально = повільніше.'
                    >
                      <MenuItem value='custom'>Не вибрано</MenuItem>
                      <MenuItem value='fast'>Швидко (економно)</MenuItem>
                      <MenuItem value='balanced'>Звичайно (рекомендовано)</MenuItem>
                      <MenuItem value='banner'>Банер з текстом (найкраще)</MenuItem>
                      <MenuItem value='max'>Максимальна якість (повільно)</MenuItem>
                    </TextField>
                  </FormControl>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                    <FormControl sx={{ flex: 1 }}>
                      <TextField
                        select
                        size='small'
                        label='Інструмент аналізу'
                        value={imageAnalysis.engine}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({
                            ...prev,
                            engine: e.target.value as ImageAnalysisSettings["engine"],
                          }))
                        }
                        disabled={!imageAnalysis.enabled}
                      >
                        <MenuItem value='off'>Вимкнено</MenuItem>
                        <MenuItem value='ocr'>Tesseract.js (Browser)</MenuItem>
                      </TextField>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={imageAnalysis.useAiBackend || false}
                          onChange={(e) =>
                            setImageAnalysis((prev) => ({
                              ...prev,
                              useAiBackend: e.target.checked,
                            }))
                          }
                          color="secondary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            AI Backend 🐍
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            PaddleOCR + BLIP + CLIP
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                    <FormControl sx={{ flex: 1 }}>
                      <TextField
                        select
                        size='small'
                        label='Запуск'
                        value={imageAnalysis.runMode}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({
                            ...prev,
                            runMode: e.target.value as ImageAnalysisSettings["runMode"],
                          }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      >
                        <MenuItem value='manual'>Тільки вручну</MenuItem>
                        <MenuItem value='auto'>Автоматично (обережно)</MenuItem>
                      </TextField>
                    </FormControl>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                    <FormControl sx={{ flex: 1 }}>
                      <TextField
                        select
                        size='small'
                        label='Автопідстановка ALT'
                        value={imageAnalysis.autoApplyAlt}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({
                            ...prev,
                            autoApplyAlt: e.target.value as ImageAnalysisSettings["autoApplyAlt"],
                          }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      >
                        <MenuItem value='off'>Ні</MenuItem>
                        <MenuItem value='ifEmpty'>Якщо поле пусте</MenuItem>
                      </TextField>
                    </FormControl>

                    <FormControl sx={{ flex: 1 }}>
                      <TextField
                        select
                        size='small'
                        label='Автопідстановка назви файлу'
                        value={imageAnalysis.autoApplyFilename}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({
                            ...prev,
                            autoApplyFilename:
                              e.target.value as ImageAnalysisSettings["autoApplyFilename"],
                          }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      >
                        <MenuItem value='off'>Ні</MenuItem>
                        <MenuItem value='ifEmpty'>Якщо поле пусте</MenuItem>
                      </TextField>
                    </FormControl>
                  </Stack>

                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={ui.showAdvancedOcrSettings}
                        onChange={(e) =>
                          setUi((prev) => ({ ...prev, showAdvancedOcrSettings: e.target.checked }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      />
                    }
                    label={<Typography variant='body2'>Показати розширені налаштування</Typography>}
                  />

                  {!ui.showAdvancedOcrSettings && (
                    <Alert
                      severity='info'
                      sx={{ borderRadius: `${borderRadius.md}px` }}
                    >
                      Якщо щось розпізнається погано — вибери «Банер з текстом». Якщо ноут слабкий — «Швидко».
                    </Alert>
                  )}

                  {ui.showAdvancedOcrSettings && (
                    <>
                  <Box>
                    <Typography variant='body2' fontWeight={600} mb={0.5}>
                      OCR min width: {imageAnalysis.ocrMinWidth}px
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                      Якщо картинка маленька — збільшимо перед OCR (часто сильно покращує точність).
                    </Typography>
                    <Slider
                      size='small'
                      value={imageAnalysis.ocrMinWidth}
                      onChange={(_, v) =>
                        setImageAnalysis((prev) => ({ ...prev, ocrMinWidth: v as number }))
                      }
                      min={0}
                      max={1600}
                      step={50}
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  </Box>

                  <Box>
                    <Typography variant='body2' fontWeight={600} mb={0.5}>
                      OCR max width: {imageAnalysis.ocrMaxWidth}px
                    </Typography>
                    <Slider
                      size='small'
                      value={imageAnalysis.ocrMaxWidth}
                      onChange={(_, v) =>
                        setImageAnalysis((prev) => ({ ...prev, ocrMaxWidth: v as number }))
                      }
                      min={600}
                      max={2000}
                      step={50}
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  </Box>

                  <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={imageAnalysis.smartPrecheck}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({ ...prev, smartPrecheck: e.target.checked }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      />
                    }
                    label={<Typography variant='body2'>Smart precheck (пропускати OCR якщо текст малоймовірний)</Typography>}
                  />

                  {imageAnalysis.smartPrecheck && (
                    <>
                      <Box>
                        <Typography variant='body2' fontWeight={600} mb={0.5}>
                          Text likelihood threshold: {imageAnalysis.textLikelihoodThreshold.toFixed(3)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                          Нижче = OCR запускається частіше. Вище = економить CPU, але може пропускати текст.
                        </Typography>
                        <Slider
                          size='small'
                          value={imageAnalysis.textLikelihoodThreshold}
                          onChange={(_, v) =>
                            setImageAnalysis((prev) => ({
                              ...prev,
                              textLikelihoodThreshold: v as number,
                            }))
                          }
                          min={0.02}
                          max={0.18}
                          step={0.005}
                          disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                        />
                      </Box>

                      <Box>
                        <Typography variant='body2' fontWeight={600} mb={0.5}>
                          Precheck edge threshold: {imageAnalysis.precheckEdgeThreshold}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                          Чутливість до дрібних контрастних контурів (текст).
                        </Typography>
                        <Slider
                          size='small'
                          value={imageAnalysis.precheckEdgeThreshold}
                          onChange={(_, v) =>
                            setImageAnalysis((prev) => ({
                              ...prev,
                              precheckEdgeThreshold: v as number,
                            }))
                          }
                          min={30}
                          max={140}
                          step={5}
                          disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                        />
                      </Box>
                    </>
                  )}

                  <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={imageAnalysis.preprocess}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({ ...prev, preprocess: e.target.checked }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      />
                    }
                    label={<Typography variant='body2'>Preprocess перед OCR (grayscale/contrast/threshold)</Typography>}
                  />

                  {imageAnalysis.preprocess && (
                    <>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                        <FormControl sx={{ flex: 1 }}>
                          <TextField
                            select
                            size='small'
                            label='PSM (page segmentation)'
                            value={imageAnalysis.ocrPsm}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                ocrPsm: e.target.value as ImageAnalysisSettings["ocrPsm"],
                              }))
                            }
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          >
                            <MenuItem value='11'>11 — Sparse text (банери/UI)</MenuItem>
                            <MenuItem value='6'>6 — Single block</MenuItem>
                            <MenuItem value='7'>7 — Single line</MenuItem>
                            <MenuItem value='8'>8 — Single word</MenuItem>
                            <MenuItem value='4'>4 — Single column</MenuItem>
                            <MenuItem value='3'>3 — Auto</MenuItem>
                          </TextField>
                        </FormControl>

                        <FormControl sx={{ flex: 1 }}>
                          <TextField
                            select
                            size='small'
                            label='Scale factor'
                            value={imageAnalysis.ocrScaleFactor}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                ocrScaleFactor: Number(e.target.value),
                              }))
                            }
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                            helperText='2× часто дає +точність, але важче для CPU'
                          >
                            <MenuItem value={1}>1×</MenuItem>
                            <MenuItem value={2}>2×</MenuItem>
                            <MenuItem value={3}>3×</MenuItem>
                          </TextField>
                        </FormControl>
                      </Stack>

                      <Box>
                        <Typography variant='body2' fontWeight={600} mb={0.5}>
                          Contrast: {imageAnalysis.preprocessContrast.toFixed(1)}×
                        </Typography>
                        <Slider
                          size='small'
                          value={imageAnalysis.preprocessContrast}
                          onChange={(_, v) =>
                            setImageAnalysis((prev) => ({
                              ...prev,
                              preprocessContrast: v as number,
                            }))
                          }
                          min={1}
                          max={3}
                          step={0.1}
                          disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                        />
                      </Box>

                      <Box>
                        <Typography variant='body2' fontWeight={600} mb={0.5}>
                          Brightness: {imageAnalysis.preprocessBrightness.toFixed(2)}×
                        </Typography>
                        <Slider
                          size='small'
                          value={imageAnalysis.preprocessBrightness}
                          onChange={(_, v) =>
                            setImageAnalysis((prev) => ({
                              ...prev,
                              preprocessBrightness: v as number,
                            }))
                          }
                          min={0.8}
                          max={1.4}
                          step={0.02}
                          disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                        />
                      </Box>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={imageAnalysis.preprocessUseThreshold}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                preprocessUseThreshold: e.target.checked,
                              }))
                            }
                            size='small'
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        }
                        label={<Typography variant='body2'>Threshold (binarize)</Typography>}
                      />

                      {imageAnalysis.preprocessUseThreshold && (
                        <Box>
                          <Typography variant='body2' fontWeight={600} mb={0.5}>
                            Threshold: {imageAnalysis.preprocessThreshold}
                          </Typography>
                          <Slider
                            size='small'
                            value={imageAnalysis.preprocessThreshold}
                            onChange={(_, v) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                preprocessThreshold: v as number,
                              }))
                            }
                            min={0}
                            max={255}
                            step={5}
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        </Box>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={imageAnalysis.preprocessBlur}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                preprocessBlur: e.target.checked,
                              }))
                            }
                            size='small'
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        }
                        label={<Typography variant='body2'>Blur background (reduce noise)</Typography>}
                      />

                      {imageAnalysis.preprocessBlur && (
                        <Box>
                          <Typography variant='body2' fontWeight={600} mb={0.5}>
                            Blur radius: {imageAnalysis.preprocessBlurRadius}
                          </Typography>
                          <Slider
                            size='small'
                            value={imageAnalysis.preprocessBlurRadius}
                            onChange={(_, v) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                preprocessBlurRadius: v as number,
                              }))
                            }
                            min={1}
                            max={3}
                            step={1}
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        </Box>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={imageAnalysis.preprocessSharpen}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                preprocessSharpen: e.target.checked,
                              }))
                            }
                            size='small'
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        }
                        label={<Typography variant='body2'>Sharpen (edge enhance)</Typography>}
                      />

                      <TextField
                        size='small'
                        label='Whitelist (optional)'
                        value={imageAnalysis.ocrWhitelist}
                        onChange={(e) =>
                          setImageAnalysis((prev) => ({ ...prev, ocrWhitelist: e.target.value }))
                        }
                        disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                        placeholder='Напр: ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                        helperText='Задай, якщо знаєш формат (наприклад тільки A–Z/0–9). Порожньо = без whitelist.'
                      />

                      <FormControl sx={{ minWidth: 240 }}>
                        <TextField
                          select
                          size='small'
                          label='Text area (crop)'
                          value={imageAnalysis.roiPreset}
                          onChange={(e) => {
                            const p = e.target.value as ImageAnalysisSettings["roiPreset"];
                            setImageAnalysis((prev) => {
                              if (p === "full") {
                                return { ...prev, roiEnabled: false, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                              }
                              if (p === "auto") {
                                return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                              }
                              if (p === "top60") {
                                return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 0.6 };
                              }
                              if (p === "top60_left70") {
                                return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 0.7, roiH: 0.6 };
                              }
                              return { ...prev, roiEnabled: true, roiPreset: p };
                            });
                          }}
                          disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          helperText='Для банерів часто допомагає відрізати праву частину/низ.'
                        >
                          <MenuItem value='full'>Full image</MenuItem>
                          <MenuItem value='auto'>Auto (detect text area)</MenuItem>
                          <MenuItem value='top60'>Top 60% (full width)</MenuItem>
                          <MenuItem value='top60_left70'>Top 60% + Left 70% (remove right)</MenuItem>
                          <MenuItem value='custom'>Custom (manual)</MenuItem>
                        </TextField>
                      </FormControl>

                      {imageAnalysis.roiPreset === "custom" && imageAnalysis.roiEnabled && (
                        <Stack spacing={spacingMUI.sm}>
                          <Typography variant='caption' color='text.secondary'>
                            ROI fractions (0..1): X/Y (start), W/H (size)
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                            <TextField
                              size='small'
                              type='number'
                              label='X'
                              value={imageAnalysis.roiX}
                              onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiX: Number(e.target.value) }))}
                              inputProps={{ min: 0, max: 1, step: 0.05 }}
                            />
                            <TextField
                              size='small'
                              type='number'
                              label='Y'
                              value={imageAnalysis.roiY}
                              onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiY: Number(e.target.value) }))}
                              inputProps={{ min: 0, max: 1, step: 0.05 }}
                            />
                            <TextField
                              size='small'
                              type='number'
                              label='W'
                              value={imageAnalysis.roiW}
                              onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiW: Number(e.target.value) }))}
                              inputProps={{ min: 0.1, max: 1, step: 0.05 }}
                            />
                            <TextField
                              size='small'
                              type='number'
                              label='H'
                              value={imageAnalysis.roiH}
                              onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiH: Number(e.target.value) }))}
                              inputProps={{ min: 0.1, max: 1, step: 0.05 }}
                            />
                          </Stack>
                        </Stack>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={imageAnalysis.spellCorrectionBanner}
                            onChange={(e) =>
                              setImageAnalysis((prev) => ({
                                ...prev,
                                spellCorrectionBanner: e.target.checked,
                              }))
                            }
                            size='small'
                            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                          />
                        }
                        label={<Typography variant='body2'>Spell correction (banner/CTA)</Typography>}
                      />
                    </>
                  )}

                  <TextField
                    size='small'
                    type='number'
                    label='Ліміт авто-аналізу (файлів)'
                    value={imageAnalysis.autoAnalyzeMaxFiles}
                    onChange={(e) => {
                      const n = Number(e.target.value || 0);
                      setImageAnalysis((prev) => ({
                        ...prev,
                        autoAnalyzeMaxFiles: Number.isFinite(n)
                          ? Math.max(0, Math.min(50, n))
                          : 0,
                      }));
                    }}
                    disabled={
                      !imageAnalysis.enabled ||
                      imageAnalysis.engine === "off" ||
                      imageAnalysis.runMode !== "auto"
                    }
                    inputProps={{ min: 0, max: 50 }}
                    helperText='0 = не запускати автоматично'
                  />
                    </>
                  )}
                </Stack>
              </>
            )}
          </Box>
        </Box>
      </Popover>

      {ui.stickyActions && (
        <StyledPaper
          sx={{
            position: "sticky",
            top: spacingMUI.sm,
            zIndex: 10,
          }}
        >
          <Stack
            direction='row'
            spacing={spacingMUI.sm}
            flexWrap='wrap'
            alignItems='center'
          >
            <Button
              variant='contained'
              size='small'
              onClick={handleExportHTML}
              startIcon={<ConvertIcon />}
              disabled={isAutoExporting}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Експортувати HTML
            </Button>
            <Button
              variant='contained'
              size='small'
              onClick={handleExportMJML}
              startIcon={<ConvertIcon />}
              disabled={isAutoExporting}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Експортувати MJML
            </Button>
            <Button
              variant='contained'
              size='small'
              onClick={handleAutoExportAll}
              startIcon={<DownloadIcon fontSize='small' />}
              disabled={isAutoExporting}
              sx={{ textTransform: "none", whiteSpace: "nowrap", ml: "auto" }}
            >
              {isAutoExporting ? "Готую..." : "Зробити все"}
            </Button>
          </Stack>
        </StyledPaper>
      )}

      {/* Editor */}
      <StyledPaper>
        <Typography
          variant='subtitle2'
          fontWeight={600}
          mb={spacingMUI.base}
        >
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
        <Typography
          variant='subtitle2'
          fontWeight={600}
          mb={spacingMUI.base}
        >
          Налаштування файлу
        </Typography>

        <Stack
          direction='row'
          spacing={spacingMUI.base}
          alignItems='center'
          flexWrap='wrap'
        >
          <Stack
            direction='row'
            spacing={spacingMUI.sm}
            alignItems='center'
            sx={{ flex: 1, minWidth: 250 }}
          >
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
              <IconButton
                size='small'
                onClick={() => changeFileNumber(-1)}
                color='primary'
              >
                <RemoveIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Збільшити номер'>
              <IconButton
                size='small'
                onClick={() => changeFileNumber(1)}
                color='primary'
              >
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={approveNeeded}
                onChange={(e) => setApproveNeeded(e.target.checked)}
                size='small'
              />
            }
            label={<Typography variant='body2'>Approve needed</Typography>}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={useAlfaOne}
                onChange={(e) => setUseAlfaOne(e.target.checked)}
                size='small'
              />
            }
            label={<Typography variant='body2'>AlfaOne</Typography>}
          />

          <Tooltip title='Експортувати HTML+MJML → підставити storage URLs (якщо є) → скачати два файли'>
            <span>
              <Button
                variant='contained'
                size='small'
                onClick={handleAutoExportAll}
                disabled={isAutoExporting}
                startIcon={<DownloadIcon fontSize='small' />}
                sx={{ textTransform: "none", whiteSpace: "nowrap", ml: "auto" }}
              >
                {isAutoExporting ? "Готую..." : "Зробити все"}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </StyledPaper>

      {/* Image Processor - only visible when images detected */}
      <ImageProcessor
        editorRef={editorRef}
        onLog={addLog}
        visible={showImageProcessor}
        onVisibilityChange={setShowImageProcessor}
        triggerExtract={triggerExtract}
        fileName={fileName}
        onHistoryAdd={handleAddToHistory}
        onReplaceUrls={handleReplaceUrls}
        onUploadedUrlsChange={setUploadedUrlMap}
        onResetReplacement={handleResetReplacement}
        hasOutput={hasOutput}
        autoProcess={autoProcess}
        storageProvider={useAlfaOne ? "alphaone" : "default"}
        imageAnalysisSettings={imageAnalysis}
      />

      {/* Output Blocks */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={spacingMUI.lg}
      >
        {/* HTML Output */}
        <StyledPaper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction='row'
            spacing={spacingMUI.sm}
            mb={spacingMUI.base}
            flexWrap='wrap'
          >
            <Button
              variant='contained'
              size='small'
              onClick={handleExportHTML}
              startIcon={<ConvertIcon />}
              disabled={isAutoExporting}
            >
              Експортувати HTML
            </Button>
            <Button
              variant='outlined'
              size='small'
              onClick={handleDownloadHTML}
              startIcon={<DownloadIcon fontSize='small' />}
            >
              Завантажити
            </Button>
            <Button
              variant='outlined'
              size='small'
              onClick={handleCopyHTML}
              startIcon={<CopyIcon fontSize='small' />}
            >
              Copy
            </Button>
          </Stack>

          <Typography
            variant='subtitle2'
            fontWeight={600}
            mb={spacingMUI.sm}
          >
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
          }}
        >
          <Stack
            direction='row'
            spacing={spacingMUI.sm}
            mb={spacingMUI.base}
            flexWrap='wrap'
          >
            <Button
              variant='contained'
              size='small'
              onClick={handleExportMJML}
              startIcon={<ConvertIcon />}
              disabled={isAutoExporting}
            >
              Експортувати MJML
            </Button>
            <Button
              variant='outlined'
              size='small'
              onClick={handleDownloadMJML}
              startIcon={<DownloadIcon fontSize='small' />}
            >
              Завантажити
            </Button>
            <Button
              variant='outlined'
              size='small'
              onClick={handleCopyMJML}
              startIcon={<CopyIcon fontSize='small' />}
            >
              Copy
            </Button>
          </Stack>

          <Typography
            variant='subtitle2'
            fontWeight={600}
            mb={spacingMUI.sm}
          >
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
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={spacingMUI.lg}
        >
          {/* Input HTML */}
          {ui.showInputHtml && inputHtml && (
            <StyledPaper
              sx={{
                flex: 1,
                maxHeight: ui.compactMode ? 220 : 300,
                overflow: "auto",
              }}
            >
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                mb={spacingMUI.sm}
              >
                <Typography
                  variant='subtitle2'
                  fontWeight={600}
                >
                  Вхідний HTML
                </Typography>
                <Tooltip title='Копіювати'>
                  <IconButton
                    size='small'
                    onClick={handleCopyInputHtml}
                  >
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
                }}
              >
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
              }}
            >
              <Typography
                variant='subtitle2'
                fontWeight={600}
                mb={spacingMUI.sm}
              >
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
                  }}
                >
                  {entry}
                </Typography>
              ))}
            </StyledPaper>
          )}
        </Stack>
      )}

      {/* Upload History - Always visible when there are sessions */}
      {ui.showUploadHistory && (
        <UploadHistory
          sessions={uploadHistory}
          onClear={handleClearHistory}
        />
      )}
    </Box>
  );
}
