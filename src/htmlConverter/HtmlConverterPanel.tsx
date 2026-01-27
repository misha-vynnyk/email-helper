/**
 * HTML to Table Converter Panel
 * Main UI component for converting HTML to table-based email code
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Remove as RemoveIcon,
  SwapHoriz as ConvertIcon,
} from "@mui/icons-material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, opacity, spacingMUI } from "../theme/tokens";
import { formatHtml, formatMjml } from "./formatter";
import { setupPasteHandler, isSignatureImageTag } from "./imageUtils";
import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./UploadHistory";
import { STORAGE_KEYS, UPLOAD_CONFIG, IMAGE_DEFAULTS } from "./constants";
import type { UploadSession } from "./types";

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

  // Refs for contenteditable divs
  const editorRef = useRef<HTMLDivElement>(null);
  const outputHtmlRef = useRef<HTMLTextAreaElement>(null);
  const outputMjmlRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [fileName, setFileName] = useState("promo-1");
  const [approveNeeded, setApproveNeeded] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [inputHtml, setInputHtml] = useState<string>("");
  const [triggerExtract, setTriggerExtract] = useState(0);
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

  const addLog = (message: string) => {
    setLog((prev) => [...prev, message]);
  };

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
            shortPath: r.url.replace("https://storage.5th-elementagency.com/", ""),
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

      if (outputHtmlRef.current?.value) {
        const { replaced, count } = replaceUrlsInContent(
          outputHtmlRef.current.value,
          /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
          storageUrls
        );
        outputHtmlRef.current.value = replaced;
        if (count > 0) addLog(`🔄 Замінено ${count} посилань в Output HTML`);
      }

      if (outputMjmlRef.current?.value) {
        const { replaced, count } = replaceUrlsInContent(
          outputMjmlRef.current.value,
          /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
          storageUrls
        );
        outputMjmlRef.current.value = replaced;
        if (count > 0) addLog(`🔄 Замінено ${count} посилань в Output MJML`);
      }
    },
    [addLog, replaceUrlsInContent]
  );

  // Setup paste handler and auto-detect images
  useEffect(() => {
    if (editorRef.current) {
      setupPasteHandler(editorRef.current, addLog);

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

        // Small delay to ensure DOM is updated after paste
        setTimeout(() => {
          if (!editorRef.current) return;
          const imgElements = editorRef.current.querySelectorAll("img");
          const hasImages = imgElements.length > 0;

          if (hasImages) {
            setShowImageProcessor(true);
          }

          // Always trigger extraction to clear old images if needed
          setTimeout(() => {
            setTriggerExtract((prev) => prev + 1);
          }, 100);
        }, 300);
      };

      const handleInput = () => {
        if (!editorRef.current) return;

        // Check if there are still images in the editor
        const imgElements = editorRef.current.querySelectorAll("img");
        const hasImages = imgElements.length > 0;

        if (!hasImages && showImageProcessor) {
          // No images found, trigger extraction to clear
          setTriggerExtract((prev) => prev + 1);
        }
      };

      editorRef.current.addEventListener("paste", handlePaste as EventListener);
      editorRef.current.addEventListener("input", handleInput);

      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener("paste", handlePaste as EventListener);
          editorRef.current.removeEventListener("input", handleInput);
        }
      };
    }
  }, [showImageProcessor]);

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

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    if (outputHtmlRef.current) {
      outputHtmlRef.current.value = "";
    }
    if (outputMjmlRef.current) {
      outputMjmlRef.current.value = "";
    }
    setLog([]);
    setInputHtml("");
    setShowImageProcessor(false);
    setTriggerExtract(0);
    setHasOutput(false);

    // Reset replacement state
    if (resetReplacementRef.current) {
      resetReplacementRef.current();
    }

    addLog("🧹 Очищено");
  };

  return (
    <Box
      data-app-scroll='true'
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: spacingMUI.xl,
        gap: spacingMUI.lg,
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
        <FormControlLabel
          control={
            <Checkbox
              checked={autoProcess}
              onChange={(e) => {
                const newValue = e.target.checked;
                setAutoProcess(newValue);
                // Save to localStorage
                try {
                  const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
                  const settings = stored ? JSON.parse(stored) : {};
                  settings.autoProcess = newValue;
                  localStorage.setItem(STORAGE_KEYS.IMAGE_SETTINGS, JSON.stringify(settings));
                } catch {
                  // Ignore errors
                }
              }}
              size='small'
            />
          }
          label={<Typography variant='caption'>Автообробка зображень</Typography>}
        />
        <Stack
          direction='row'
          alignItems='center'
          spacing={spacingMUI.sm}
        >
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
            minHeight: 200,
            maxHeight: 400,
            overflow: "auto",
            p: spacingMUI.base,
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

      {/* File Settings */}
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
        onResetReplacement={handleResetReplacement}
        hasOutput={hasOutput}
        autoProcess={autoProcess}
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
      {(inputHtml || log.length > 0) && (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={spacingMUI.lg}
        >
          {/* Input HTML */}
          {inputHtml && (
            <StyledPaper
              sx={{
                flex: 1,
                maxHeight: 300,
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
          {log.length > 0 && (
            <StyledPaper
              sx={{
                flex: 1,
                maxHeight: 300,
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
      <UploadHistory
        sessions={uploadHistory}
        onClear={handleClearHistory}
      />
    </Box>
  );
}
