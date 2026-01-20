/**
 * HTML to Table Converter Panel
 * Main UI component for converting HTML to table-based email code
 */

import React, { useState, useRef, useEffect } from "react";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Slider,
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
  Image as ImageIcon,
  Remove as RemoveIcon,
  SwapHoriz as ConvertIcon,
} from "@mui/icons-material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, opacity, spacing, spacingMUI } from "../theme/tokens";
import { formatHtml, formatMjml } from "./formatter";
import { downloadImagesFolder, setupPasteHandler } from "./imageUtils";

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
        <Typography variant='subtitle2' fontWeight={600}>
          {title}
        </Typography>
        {subtitle && <Typography variant='caption' color='text.secondary'>{subtitle}</Typography>}
      </Box>
    </Box>
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
  const [bgColor, setBgColor] = useState("#ffffff");
  const [jpgQuality, setJpgQuality] = useState(0.82);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
    console.log(message);
  };

  // Setup paste handler
  useEffect(() => {
    if (editorRef.current) {
      setupPasteHandler(editorRef.current, addLog);
    }
  }, []);

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
    const editorContent = editorRef.current.innerHTML;
    const formattedContent = formatHtml(editorContent);
    if (outputHtmlRef.current) {
      outputHtmlRef.current.value = formattedContent;
    }
    addLog("✅ HTML експортовано");
  };

  const handleExportMJML = () => {
    if (!editorRef.current) return;
    const editorContent = editorRef.current.innerHTML;
    const formattedContent = formatMjml(editorContent);
    if (outputMjmlRef.current) {
      outputMjmlRef.current.value = formattedContent;
    }
    addLog("✅ MJML експортовано");
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

  const downloadFile = (content: string, extension: string) => {
    const name = fileName.replace(/\s+/g, '').toUpperCase();
    const approvalText = approveNeeded ? '(Approve needed)' : '';
    const fullName = `${name}_${extension}${approvalText}.html`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullName;
    a.click();
    URL.revokeObjectURL(url);

    addLog(`📥 Завантажено: ${fullName}`);
  };

  const handleDownloadHTML = () => {
    if (outputHtmlRef.current) {
      downloadFile(outputHtmlRef.current.value, 'html');
    }
  };

  const handleDownloadMJML = () => {
    if (outputMjmlRef.current) {
      downloadFile(outputMjmlRef.current.value, 'mjml');
    }
  };

  const handleDownloadImages = async () => {
    if (!editorRef.current) return;
    setLog([]);
    addLog("🔄 Початок обробки зображень...");
    await downloadImagesFolder(
      editorRef.current,
      fileName,
      bgColor,
      jpgQuality,
      addLog
    );
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    if (outputHtmlRef.current) {
      outputHtmlRef.current.value = '';
    }
    if (outputMjmlRef.current) {
      outputMjmlRef.current.value = '';
    }
    setLog([]);
    addLog("🧹 Очищено");
  };

  return (
    <Box
      data-app-scroll="true"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        p: spacingMUI.xl,
        gap: spacingMUI.lg,
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <SectionHeader
          icon={<CodeIcon fontSize="small" />}
          title="HTML to Table Converter"
          subtitle="Конвертація HTML в табличну структуру для email"
        />

        <Tooltip title="Очистити все">
          <IconButton onClick={handleClear} color="error" size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Editor */}
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
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.base}>
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
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.6,
            transition: 'all 0.2s ease',
            '&:focus': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
              backgroundColor: alpha(theme.palette.action.hover, 0.5),
            },
            '&:empty:before': {
              content: '"Вставте або введіть HTML код сюди..."',
              color: theme.palette.text.disabled,
            }
          }}
        />
      </Paper>

      {/* File Settings */}
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
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.base}>
          Налаштування файлу
        </Typography>

        <Stack direction="row" spacing={spacingMUI.base} alignItems="center" flexWrap="wrap">
          <Stack direction="row" spacing={spacingMUI.sm} alignItems="center" sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              label="Ім'я файлу"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              size="small"
              fullWidth
            />
            <Tooltip title="Зменшити номер">
              <IconButton size="small" onClick={() => changeFileNumber(-1)} color="primary">
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Збільшити номер">
              <IconButton size="small" onClick={() => changeFileNumber(1)} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={approveNeeded}
                onChange={(e) => setApproveNeeded(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Approve needed</Typography>}
          />
        </Stack>
      </Paper>

      {/* Image Settings */}
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
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.base}>
          Налаштування зображень
        </Typography>

        <Stack direction="row" spacing={spacingMUI.xl} alignItems="center" flexWrap="wrap">
          <Box>
            <Typography variant="caption" display="block" mb={spacingMUI.xs} color="text.secondary">
              Фон для прозорості:
            </Typography>
            <Box
              component="input"
              type="color"
              value={bgColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgColor(e.target.value)}
              sx={{
                width: 60,
                height: 36,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${borderRadius.md}px`,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                }
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={spacingMUI.xs}>
              <Typography variant="caption" color="text.secondary">
                Якість JPG:
              </Typography>
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {(jpgQuality * 100).toFixed(0)}%
              </Typography>
            </Stack>
            <Slider
              value={jpgQuality}
              onChange={(_, value) => setJpgQuality(value as number)}
              min={0.5}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              size="small"
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<ImageIcon />}
            onClick={handleDownloadImages}
            sx={{ minWidth: 200 }}
          >
            Завантажити Images ZIP
          </Button>
        </Stack>
      </Paper>

      {/* Output Blocks */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={spacingMUI.lg}>
        {/* HTML Output */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: spacingMUI.base,
            borderRadius: `${componentStyles.card.borderRadius}px`,
            backgroundColor:
              componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            border: componentStyles.card.border,
            boxShadow: componentStyles.card.boxShadow,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack direction="row" spacing={spacingMUI.sm} mb={spacingMUI.base} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              onClick={handleExportHTML}
              startIcon={<ConvertIcon />}
            >
              Експортувати HTML
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadHTML}
              startIcon={<DownloadIcon fontSize="small" />}
            >
              Завантажити
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCopyHTML}
              startIcon={<CopyIcon fontSize="small" />}
            >
              Copy
            </Button>
          </Stack>

          <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.sm}>
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
              },
            }}
          />
        </Paper>

        {/* MJML Output */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: spacingMUI.base,
            borderRadius: `${componentStyles.card.borderRadius}px`,
            backgroundColor:
              componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            border: componentStyles.card.border,
            boxShadow: componentStyles.card.boxShadow,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack direction="row" spacing={spacingMUI.sm} mb={spacingMUI.base} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              onClick={handleExportMJML}
              startIcon={<ConvertIcon />}
            >
              Експортувати MJML
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadMJML}
              startIcon={<DownloadIcon fontSize="small" />}
            >
              Завантажити
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCopyMJML}
              startIcon={<CopyIcon fontSize="small" />}
            >
              Copy
            </Button>
          </Stack>

          <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.sm}>
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
              },
            }}
          />
        </Paper>
      </Stack>

      {/* Log */}
      {log.length > 0 && (
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
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} mb={spacingMUI.sm}>
            Лог операцій
          </Typography>
          <Divider sx={{ mb: spacingMUI.sm }} />
          {log.map((entry, idx) => (
            <Typography
              key={idx}
              variant="caption"
              display="block"
              sx={{
                fontFamily: 'monospace',
                color: 'text.secondary',
                lineHeight: 1.8,
                py: 0.25,
              }}
            >
              {entry}
            </Typography>
          ))}
        </Paper>
      )}

      {/* Footer Tip */}
      <Paper
        elevation={0}
        sx={{
          p: spacingMUI.base,
          borderRadius: `${componentStyles.card.borderRadius}px`,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={spacingMUI.sm}>
          <Box
            component="span"
            sx={{
              fontSize: '1.2em',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            💡
          </Box>
          Вставте HTML з Google Docs або іншого редактора, налаштуйте параметри та експортуйте
        </Typography>
      </Paper>
    </Box>
  );
}
