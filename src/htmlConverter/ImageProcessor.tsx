/**
 * Compact Image Processor for HTML Converter
 * Extracts and processes images from HTML content
 */

import React, { useState, useEffect } from "react";
import { Box, Button, Slider, Stack, Typography, useTheme, Snackbar, Alert, Tooltip } from "@mui/material";
import { PlayArrow as ProcessIcon, CloudUpload as UploadIcon, FindReplace as ReplaceIcon, Check as CheckIcon } from "@mui/icons-material";
import { saveAs } from "file-saver";

import { borderRadius, spacingMUI } from "../theme/tokens";
import StorageUploadDialog from "./StorageUploadDialog";
import { formatSize, extractFolderName } from "./utils/formatters";
import { getFileExtension, getImageFormat, isCrossOrigin } from "./imageUtils"; // getImageFormat needed for download
import { UI_TIMINGS } from "./constants";
import type { ImageAnalysisSettings, ImageFormatOverride } from "./types";
import { useImageConversion } from "./hooks/useImageConversion";
import { useImageUploader } from "./hooks/useImageUploader";
import { ImageGrid } from "./components/ImageGrid";
import { StyledPaper } from "./components/StyledPaper";

interface ImageProcessorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  triggerExtract?: number;
  fileName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: Array<{ filename: string; url: string; success: boolean }>, customAlts?: Record<string, string>) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onUploadedUrlsChange?: (urlMap: Record<string, string>) => void;
  onUploadedAltsChange?: (altMap: Record<string, string>) => void;
  onResetReplacement?: (resetFn: () => void) => void;
  hasOutput?: boolean;
  autoProcess?: boolean;
  storageProvider?: "default" | "alphaone";
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function ImageProcessor({ editorRef, onLog, visible, onVisibilityChange, triggerExtract = 0, fileName = "", onHistoryAdd, onReplaceUrls, onUploadedUrlsChange, onUploadedAltsChange, onResetReplacement, hasOutput = false, autoProcess: autoProcessProp, storageProvider = "default", imageAnalysisSettings }: ImageProcessorProps) {
  const theme = useTheme();

  // 1. Conversion Logic
  const {
    images,
    setImages, // needed for download/remove/format overrides
    settings: { format, quality, maxWidth, autoProcess },
    setSettings: { setQuality, setMaxWidth },
    actions: { extractImages, processAllPending, clearImagesAndRevoke, abortConversions },
    sessionId,
  } = useImageConversion({ editorRef, onLog, onVisibilityChange, autoProcessProp });

  // Snackbar local state (shared usage)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({ open: false, message: "", severity: "success" });

  const showSnackbar = (message: string, severity: "success" | "info" | "warning" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // 2. Upload Logic
  const {
    isUploading,
    lastUploadedUrls, // used for stats/ui
    replacementDone,
    handleUploadToStorage,
    handleReplaceInOutput,
    abortUploads,
    resetUploadState,
    resetReplacementOnly,
  } = useImageUploader({
    images,
    imagesSessionId: sessionId,
    editorRef,
    storageProvider,
    format,
    onLog,
    onUploadedUrlsChange,
    onReplaceUrls,
    onUploadedAltsChange,
    showSnackbar,
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const initialFolderName = extractFolderName(fileName);

  // Handlers for UI
  const handleDownloadSingle = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img || !img.convertedBlob) return;
    const imgFormat = getImageFormat(img, format);
    const ext = getFileExtension(imgFormat);
    saveAs(img.convertedBlob, `${img.name}${ext}`);
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) onVisibilityChange(false);
      return next;
    });
  };

  const handleFormatChange = (id: string, fmt: ImageFormatOverride) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return {
          ...img,
          formatOverride: fmt,
          // If format changes, reset status to allow re-processing?
          // Or user has to click "Process Again"?
          // Old code didn't reset status. It just updated prop.
          // But 'getImageFormat' would change result.
          // ProcessImage uses current state.
          status: img.status === "done" ? "pending" : img.status,
          convertedBlob: undefined,
          convertedSize: undefined,
        };
      })
    );
  };

  const handleClear = () => {
    abortConversions();
    abortUploads();
    clearImagesAndRevoke();
    resetUploadState();
    onVisibilityChange(false);
    onLog && onLog("🗑️ Очищено");
  };

  // Integration Effects
  useEffect(() => {
    if (triggerExtract > 0 && visible) {
      extractImages();
    }
  }, [triggerExtract, visible, extractImages]);

  useEffect(() => {
    if (onResetReplacement) {
      onResetReplacement(() => resetReplacementOnly());
    }
  }, [onResetReplacement, resetReplacementOnly]);

  useEffect(() => {
    if (!visible && images.length > 0) {
      clearImagesAndRevoke();
      resetUploadState();
    }
  }, [visible, images.length, clearImagesAndRevoke, resetUploadState]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      abortConversions();
      abortUploads();
    };
  }, [abortConversions, abortUploads]);

  // Derived
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
  const doneCount = images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src))).length; // approximation
  const pendingCount = images.filter((img) => img.status === "pending").length;
  const lastUploadedCount = Object.keys(lastUploadedUrls).length;

  const actionButtonSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    borderRadius: `${borderRadius.md}px`,
    transition: "all 0.2s",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.shadows[2],
    },
  };

  if (!visible) return null;

  return (
    <StyledPaper>
      <Stack spacing={spacingMUI.base}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant='subtitle2' fontWeight={600}>
            Обробка зображень
          </Typography>
          {images.length > 0 && (
            <Typography variant='caption' color='text.secondary'>
              {doneCount}/{images.length} готово
            </Typography>
          )}
        </Box>

        {/* Settings Row */}
        <Stack direction='row' spacing={spacingMUI.lg} alignItems='flex-start' flexWrap='wrap'>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={spacingMUI.xs}>
              <Typography variant='caption' color='text.secondary'>
                Якість:
              </Typography>
              <Typography variant='caption' fontWeight={600} color='primary.main'>
                {quality}%
              </Typography>
            </Stack>
            <Slider value={quality} onChange={(_, val) => setQuality(Array.isArray(val) ? val[0] : val)} min={60} max={100} size='small' />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={spacingMUI.xs}>
              <Typography variant='caption' color='text.secondary'>
                Макс. ширина:
              </Typography>
              <Typography variant='caption' fontWeight={600} color='primary.main'>
                {maxWidth}px
              </Typography>
            </Stack>
            <Slider value={maxWidth} onChange={(_, val) => setMaxWidth(Array.isArray(val) ? val[0] : val)} min={300} max={1200} step={100} size='small' />
          </Box>
        </Stack>

        <ImageGrid images={images} globalFormat={format} onDownload={handleDownloadSingle} onRemove={handleRemove} onFormatChange={handleFormatChange} />

        {/* Stats */}
        {doneCount > 0 && (
          <Box sx={{ mt: spacingMUI.sm, p: spacingMUI.sm, borderRadius: `${borderRadius.sm}px`, backgroundColor: "action.hover", border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant='caption' color='text.secondary'>
              💾 {formatSize(totalOriginal)} → {formatSize(totalConverted)} ({totalOriginal > 0 ? `-${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%` : "0%"})
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Stack direction='row' spacing={spacingMUI.sm} mt={spacingMUI.sm}>
          {pendingCount > 0 && !autoProcess && (
            <Button variant='outlined' startIcon={<ProcessIcon />} onClick={processAllPending} fullWidth sx={actionButtonSx}>
              Обробити все ({pendingCount})
            </Button>
          )}
          <Button variant='contained' color='primary' startIcon={<UploadIcon />} onClick={() => setUploadDialogOpen(true)} disabled={doneCount === 0} fullWidth sx={actionButtonSx}>
            Upload to Storage ({doneCount})
          </Button>

          {lastUploadedCount > 0 && (
            <Tooltip title={!hasOutput ? "Спочатку експортуйте HTML або MJML" : isUploading ? "Йде завантаження..." : replacementDone ? "URLs вже замінені" : "Замінити зображення на storage URLs"} arrow>
              <Box sx={{ width: "100%" }}>
                <Button variant={replacementDone ? "contained" : "outlined"} color={replacementDone ? "success" : "secondary"} startIcon={replacementDone ? <CheckIcon /> : <ReplaceIcon />} onClick={handleReplaceInOutput} disabled={replacementDone || !hasOutput || isUploading} fullWidth sx={actionButtonSx}>
                  {replacementDone ? `✓ Замінено (${lastUploadedCount})` : `Замінити (${lastUploadedCount})`}
                </Button>
              </Box>
            </Tooltip>
          )}

          <Button variant='outlined' onClick={handleClear} sx={actionButtonSx}>
            Очистити
          </Button>
        </Stack>
      </Stack>

      <StorageUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        storageProvider={storageProvider}
        files={images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src))).map((img) => ({ id: img.id, name: img.name, path: img.previewUrl, size: img.convertedSize ?? img.originalSize }))}
        onUpload={handleUploadToStorage}
        onCancel={() => {
          abortUploads();
          onLog && onLog("⚠️ Завантаження скасовано користувачем");
        }}
        initialFolderName={initialFolderName}
        onHistoryAdd={onHistoryAdd}
        onAltsUpdate={onUploadedAltsChange}
        imageAnalysisSettings={imageAnalysisSettings}
      />

      <Snackbar open={snackbar.open} autoHideDuration={UI_TIMINGS.SNACKBAR_DURATION} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
}
