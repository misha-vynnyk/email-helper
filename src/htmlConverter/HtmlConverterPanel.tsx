/**
 * HTML to Table Converter Panel
 * Main UI component for converting HTML to table-based email code
 */

import { useRef } from "react";
import { Box, Button, Checkbox, Divider, FormControlLabel, IconButton, Stack, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { Add as AddIcon, ContentCopy as CopyIcon, Download as DownloadIcon, Remove as RemoveIcon, SwapHoriz as ConvertIcon } from "@mui/icons-material";

import { borderRadius, spacingMUI } from "../theme/tokens";
import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./UploadHistory";
import { Header } from "./components/Header";
import { EditorToolbar } from "./components/EditorToolbar";
import { StyledPaper } from "./components/StyledPaper";
import { useHtmlConverterLogic } from "./hooks/useHtmlConverterLogic";

export default function HtmlConverterPanel() {
  const theme = useTheme();

  // Refs for contenteditable divs and textareas
  const editorRef = useRef<HTMLDivElement>(null);
  const outputHtmlRef = useRef<HTMLTextAreaElement>(null);
  const outputMjmlRef = useRef<HTMLTextAreaElement>(null);

  // Business Logic Hook
  const { state, actions, settings } = useHtmlConverterLogic({
    editorRef,
    outputHtmlRef,
    outputMjmlRef,
  });

  const { ui, setUi, imageAnalysis, setImageAnalysis, aiBackendStatus } = settings;

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
      <Header ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={state.autoProcess} setAutoProcess={actions.setAutoProcess} aiBackendStatus={aiBackendStatus} unseenLogCount={state.unseenLogCount} onClear={actions.handleClear} />

      {ui.stickyActions && (
        <EditorToolbar
          onExportHTML={actions.handleExportHTML}
          onExportMJML={actions.handleExportMJML}
          onAutoExportAll={actions.handleAutoExportAll}
          isAutoExporting={state.isAutoExporting}
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
              value={state.fileName}
              onChange={(e) => actions.setFileName(e.target.value)}
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
              <IconButton size='small' onClick={() => actions.changeFileNumber(-1)} color='primary'>
                <RemoveIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Збільшити номер'>
              <IconButton size='small' onClick={() => actions.changeFileNumber(1)} color='primary'>
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>

          {ui.showApproveNeeded && <FormControlLabel control={<Checkbox checked={state.approveNeeded} onChange={(e) => actions.setApproveNeeded(e.target.checked)} size='small' />} label={<Typography variant='body2'>Approve needed</Typography>} />}

          <FormControlLabel control={<Checkbox checked={state.useAlfaOne} onChange={(e) => actions.setUseAlfaOne(e.target.checked)} size='small' />} label={<Typography variant='body2'>AlfaOne</Typography>} />

          <Tooltip title='Експортувати HTML+MJML → підставити storage URLs (якщо є) → скачати два файли'>
            <span>
              <Button variant='contained' size='small' onClick={actions.handleAutoExportAll} disabled={state.isAutoExporting} startIcon={<DownloadIcon fontSize='small' />} sx={{ textTransform: "none", whiteSpace: "nowrap", ml: "auto" }}>
                {state.isAutoExporting ? "Готую..." : "Зробити все"}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </StyledPaper>

      {/* Image Processor - only visible when images detected */}
      <ImageProcessor
        editorRef={editorRef}
        onLog={actions.addLog}
        visible={state.showImageProcessor}
        onVisibilityChange={actions.setShowImageProcessor}
        triggerExtract={state.triggerExtract}
        fileName={state.fileName}
        onHistoryAdd={actions.handleAddToHistory}
        onReplaceUrls={actions.handleReplaceUrls}
        onUploadedUrlsChange={actions.setUploadedUrlMap}
        onUploadedAltsChange={actions.handleAltsUpdate}
        onResetReplacement={actions.handleResetReplacement}
        hasOutput={state.hasOutput}
        autoProcess={state.autoProcess}
        storageProvider={state.useAlfaOne ? "alphaone" : "default"}
        imageAnalysisSettings={imageAnalysis}
        setImageAnalysis={setImageAnalysis}
      />

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
            <Button variant='contained' size='small' onClick={actions.handleExportHTML} startIcon={<ConvertIcon />} disabled={state.isAutoExporting}>
              Експортувати HTML
            </Button>
            <Button variant='outlined' size='small' onClick={actions.handleDownloadHTML} startIcon={<DownloadIcon fontSize='small' />}>
              Завантажити
            </Button>
            <Button variant='outlined' size='small' onClick={() => outputHtmlRef.current && actions.handleCopy(outputHtmlRef.current.value, "HTML")} startIcon={<CopyIcon fontSize='small' />}>
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
            <Button variant='contained' size='small' onClick={actions.handleExportMJML} startIcon={<ConvertIcon />} disabled={state.isAutoExporting}>
              Експортувати MJML
            </Button>
            <Button variant='outlined' size='small' onClick={actions.handleDownloadMJML} startIcon={<DownloadIcon fontSize='small' />}>
              Завантажити
            </Button>
            <Button variant='outlined' size='small' onClick={() => outputMjmlRef.current && actions.handleCopy(outputMjmlRef.current.value, "MJML")} startIcon={<CopyIcon fontSize='small' />}>
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
      {((ui.showInputHtml && state.inputHtml) || (ui.showLogsPanel && state.log.length > 0)) && (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={spacingMUI.lg}>
          {/* Input HTML */}
          {ui.showInputHtml && state.inputHtml && (
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
                  <IconButton size='small' onClick={() => actions.handleCopy(state.inputHtml, "Вхідний HTML")}>
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
                {state.inputHtml}
              </Box>
            </StyledPaper>
          )}

          {/* Log */}
          {ui.showLogsPanel && state.log.length > 0 && (
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
              {state.log.map((entry, idx) => (
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
      {ui.showUploadHistory && <UploadHistory sessions={state.uploadHistory} onClear={actions.handleClearHistory} />}
    </Box>
  );
}
