import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Typography, Box, Alert, LinearProgress, Stack, useTheme, alpha, Divider } from "@mui/material";
import { CloudUpload as UploadIcon, CheckCircle as SuccessIcon, Error as ErrorIcon, Close as CloseIcon } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { spacingMUI, borderRadius } from "../theme/tokens";
import { copyToClipboard } from "./utils/clipboard";
import { useOcrAnalysis } from "./utils/useOcrAnalysis";
import { useHtmlConverterSettings } from "./hooks/useHtmlConverterSettings";
import { UI_TIMINGS, STORAGE_PROVIDERS_CONFIG, FOLDER_NAME_REGEX } from "./constants";
import type { ImageAnalysisSettings, UploadResult } from "./types";
import type { StorageProviderKey } from "./constants";
import { UploadResults, toShortPath } from "./components/UploadResults";
import FileListItem from "./components/FileListItem";

interface StorageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  storageProvider?: StorageProviderKey;
  files: Array<{ id: string; name: string; path?: string }>;
  onUpload: (category: string, folderName: string, customNames: Record<string, string>, customAlts: Record<string, string>, fileOrder?: string[], onProgress?: (result: UploadResult) => void) => Promise<{ results: UploadResult[]; category: string; folderName: string }>;
  onCancel?: () => void;
  initialFolderName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: UploadResult[], customAlts?: Record<string, string>) => void;
  onAltsUpdate?: (altMap: Record<string, string>) => void;
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function StorageUploadDialog({ open, onClose, storageProvider = "default", files, onUpload, onCancel, initialFolderName = "", onHistoryAdd, onAltsUpdate, imageAnalysisSettings }: StorageUploadDialogProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { ui } = useHtmlConverterSettings();

  const providerCfg = STORAGE_PROVIDERS_CONFIG.providers[storageProvider] || STORAGE_PROVIDERS_CONFIG.providers.default;
  const showCategory = providerCfg.usesCategory;

  const categories = (showCategory && providerCfg.categories && providerCfg.categories.length > 0 ? providerCfg.categories : STORAGE_PROVIDERS_CONFIG.providers.default.categories) || ["finance", "health"];
  const defaultCategory = (showCategory && providerCfg.defaultCategory) || STORAGE_PROVIDERS_CONFIG.providers.default.defaultCategory || categories[0] || "finance";

  const [category, setCategory] = useState<string>(defaultCategory);
  const [folderName, setFolderName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [customAlts, setCustomAlts] = useState<Record<string, string>>({});
  const [orderedFiles, setOrderedFiles] = useState(files);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState<{ fileId: string; tagIdx: number } | null>(null);

  const pendingFiles = orderedFiles.filter((f) => !uploadResults.some((r) => r.success && r.fileId === f.id));

  const analysisEnabled = Boolean(imageAnalysisSettings?.enabled && (imageAnalysisSettings.engine === "ocr" || imageAnalysisSettings.useAiBackend));
  const analysisLabel = imageAnalysisSettings?.useAiBackend ? "Analyze (AI)" : "Analyze (OCR)";

  // AI (step 1): OCR-based suggestions (configured globally in HtmlConverterPanel)
  const {
    aiById,
    analyzeFile,
    reset: resetOcrState,
    dispose: disposeOcr,
  } = useOcrAnalysis({
    enabled: analysisEnabled,
    settings: imageAnalysisSettings,
    files: orderedFiles,
  });

  const handleAnalyzeFile = useCallback(
    async (file: { id: string; name: string; path?: string }, opts?: { force?: boolean }) => {
      await analyzeFile(file, { force: opts?.force });
    },
    [analyzeFile]
  );

  // Sync orderedFiles when files prop changes, but ONLY when dialog is closed
  useEffect(() => {
    if (!open) {
      setOrderedFiles(files);
    }
  }, [files, open]);

  // Reset per-open transient state
  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploadResults([]);
    setCopiedUrl(null);
    setCustomNames({});
    setCustomAlts({});
    setEditingTag(null);
    resetOcrState();
  }, [open]);

  // Propagate ALT text changes to parent
  useEffect(() => {
    if (onAltsUpdate) onAltsUpdate(customAlts);
  }, [customAlts, onAltsUpdate]);

  // Reset category when provider changes
  useEffect(() => {
    if (!showCategory) return;
    setCategory((prev) => (categories.includes(prev) ? prev : defaultCategory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageProvider]);

  // Auto-fill from initialFolderName or clipboard on mount
  useEffect(() => {
    if (open) {
      // Priority 1: Use initialFolderName from fileName input
      if (initialFolderName && FOLDER_NAME_REGEX.test(initialFolderName)) {
        setFolderName(initialFolderName);
        return;
      }

      // Priority 2: Try to get from clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard
          .readText()
          .then((text) => {
            // Check if clipboard contains valid format (e.g., "ABCD123")
            if (FOLDER_NAME_REGEX.test(text.trim())) {
              setFolderName(text.trim());
            }
          })
          .catch((err) => {
            // Clipboard API not available, permission denied, or document not focused
            console.debug("Clipboard read failed:", err.message || err);
          });
      }
    }
  }, [open, initialFolderName]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...orderedFiles];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);

    setOrderedFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveFile = (fileId: string) => {
    setOrderedFiles((prev) => prev.filter((f) => f.id !== fileId));
    // also remove from customNames/Alts if you want, but they're harmless
  };

  const handleUpload = async () => {
    setError(null);
    setUploadResults([]);

    // Validation
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    if (!FOLDER_NAME_REGEX.test(folderName)) {
      setError("Invalid format. Expected: Letters + Numbers (e.g., ABCD123)");
      return;
    }

    setUploading(true);

    try {
      const fileOrder = pendingFiles.map((f) => f.id);
      const effectiveCategory = showCategory ? category : "finance";
      const response = await onUpload(effectiveCategory, folderName.trim(), customNames, customAlts, fileOrder, (progressResult) => {
        setUploadResults((prev) => {
          // Remove previous attempt of the SAME file if it exists, replace with new one
          const filtered = prev.filter((r) => r.fileId !== progressResult.fileId);
          return [...filtered, progressResult];
        });
      });

      const successfulIds = new Set(response.results.filter((r) => r.success).map((r) => r.fileId));

      // Add to history (only what was successfully uploaded in THIS batch)
      if (onHistoryAdd && response.results.length > 0) {
        // Pass only the newly successful results to history so we don't duplicate them in the history view
        const newSuccesses = response.results.filter((r) => r.success);
        if (newSuccesses.length > 0) {
          onHistoryAdd(response.category, response.folderName, newSuccesses, customAlts);
        }
      }

      // Auto-close if all files in this batch succeeded AND the setting is enabled
      if (successfulIds.size === response.results.length && ui.autoCloseUploadDialog) {
        setTimeout(() => {
          handleClose();
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      // If uploading, trigger cancel instead of close
      handleCancel();
    } else {
      onClose();
      setError(null);
      setUploadResults([]);
      setCopiedUrl(null);
      setCustomNames({});
      setCustomAlts({});
      disposeOcr();
    }
  };

  const handleCancel = () => {
    if (uploading && onCancel) {
      onCancel();
      setError("Upload cancelled");
      setUploading(false);
    }
  };

  const handleCopyUrl = async (url: string, isShortPath = false) => {
    const textToCopy = isShortPath ? toShortPath(url) : url;

    const copiedKey = isShortPath ? `${url}-short` : url;

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedUrl(copiedKey);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  const handleCopyAllUrls = async (isShortPath = false) => {
    const urls = uploadResults
      .filter((r) => r.success)
      .map((r) => (isShortPath ? toShortPath(r.url) : r.url))
      .join("\n");

    const copiedKey = isShortPath ? "all-short" : "all";

    const success = await copyToClipboard(urls);
    if (success) {
      setCopiedUrl(copiedKey);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${borderRadius.lg}px`,
          background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
        },
      }}>
      <DialogTitle sx={{ pb: spacingMUI.sm }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box display='flex' alignItems='center' gap={spacingMUI.sm}>
            {pendingFiles.length === 0 && uploadResults.length > 0 ? <SuccessIcon sx={{ color: theme.palette.success.main }} /> : <UploadIcon color='primary' />}
            <Typography variant='h6' component='span' fontWeight={600}>
              {pendingFiles.length === 0 && uploadResults.length > 0 ? "Upload Complete" : uploadResults.some((r) => r.success) ? "Partial Upload Complete" : "Upload to Storage"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={uploading}
            size='small'
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
              },
            }}>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: spacingMUI.lg }}>
        <Stack spacing={spacingMUI.lg}>
          {/* Always show input section so UI doesn't visually jump to a new "Upload Complete" screen */}
          {orderedFiles.length > 0 && (
            <>
              {/* Files list with thumbnails, rename, and drag & drop */}
              <Box>
                <Stack direction='row' justifyContent='space-between' alignItems='center' mb={spacingMUI.sm}>
                  <Typography variant='body2' color='text.secondary' fontWeight={500}>
                    Files to upload ({orderedFiles.length}):
                  </Typography>
                  {analysisEnabled && orderedFiles.length > 1 && (
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={async () => {
                        for (const f of orderedFiles) await handleAnalyzeFile(f);
                      }}
                      disabled={uploading || orderedFiles.some((f) => aiById[f.id]?.status === "running")}
                      sx={{ textTransform: "none" }}>
                      {orderedFiles.some((f) => aiById[f.id]?.status === "running") ? "Analyzing…" : `${analysisLabel.replace("Analyze", "Analyze All")} (${orderedFiles.length})`}
                    </Button>
                  )}
                </Stack>
                <Stack
                  spacing={spacingMUI.sm}
                  sx={{
                    maxHeight: "45vh",
                    overflowY: "auto",
                    pr: 1, // small padding to make scrollbar look nice
                    mr: -1, // offset padding
                    // styling for webkit scrollbar
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: alpha(theme.palette.text.disabled, 0.4),
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: alpha(theme.palette.text.disabled, 0.6),
                    },
                  }}>
                  {orderedFiles.map((file, index) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      index={index}
                      uploading={uploading}
                      draggedIndex={draggedIndex}
                      customName={customNames[file.id] || ""}
                      customAltString={customAlts[file.id] || ""}
                      aiState={aiById[file.id]}
                      analysisEnabled={analysisEnabled}
                      analysisLabel={analysisLabel}
                      editingTag={editingTag}
                      useAiBackend={imageAnalysisSettings?.useAiBackend}
                      onNameChange={(fileId: string, value: string) => setCustomNames((prev) => ({ ...prev, [fileId]: value }))}
                      onAltChange={(fileId: string, newAltString: string) => setCustomAlts((prev) => ({ ...prev, [fileId]: newAltString }))}
                      onEditingTagChange={setEditingTag}
                      onAnalyze={handleAnalyzeFile}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onRemove={() => handleRemoveFile(file.id)}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Category Selection */}
              {showCategory && (
                <FormControl component='fieldset'>
                  <FormLabel
                    component='legend'
                    sx={{
                      fontWeight: 500,
                      mb: spacingMUI.sm,
                      color: theme.palette.text.primary,
                    }}>
                    Category
                  </FormLabel>
                  <RadioGroup row value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map((c) => (
                      <FormControlLabel key={c} value={c} control={<Radio />} label={c} />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}

              {/* Folder Name Input */}
              <TextField
                label='Folder Name'
                placeholder='e.g., ABCD123'
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                fullWidth
                disabled={uploading}
                error={Boolean(folderName.trim() && !FOLDER_NAME_REGEX.test(folderName))}
                helperText={folderName.trim() && !FOLDER_NAME_REGEX.test(folderName) ? "Invalid format. Use letters and numbers only." : "Format: Letters + Numbers (e.g., ABCD123, Finance456)"}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${borderRadius.md}px`,
                    "&.Mui-focused": {
                      backgroundColor: "transparent",
                    },
                  },
                }}
              />

              {/* Upload Path Preview */}
              {folderName && FOLDER_NAME_REGEX.test(folderName) && (
                <Alert
                  severity='info'
                  sx={{
                    borderRadius: `${borderRadius.md}px`,
                    "& .MuiAlert-message": {
                      width: "100%",
                    },
                  }}>
                  <Typography variant='caption' sx={{ fontFamily: "monospace" }}>
                    <strong>Upload path:</strong>
                    <br />
                    {(() => {
                      const letters = folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
                      const digits = folderName.replace(/[^0-9]/g, "");
                      const parts = [providerCfg.publicRootPrefix];
                      if (showCategory) parts.push(category);
                      parts.push(letters, `lift-${digits}`);
                      return `${parts.filter(Boolean).join("/")}/`;
                    })()}
                  </Typography>
                </Alert>
              )}

              {/* Progress */}
              {uploading && (
                <Box
                  sx={{
                    p: spacingMUI.base,
                    borderRadius: `${borderRadius.md}px`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}>
                  <LinearProgress sx={{ mb: spacingMUI.sm, borderRadius: `${borderRadius.sm}px` }} />
                  <Typography variant='body2' color='text.secondary' align='center'>
                    Uploading files...
                  </Typography>
                </Box>
              )}

              {/* Error Message */}
              {error && (
                <Alert icon={<ErrorIcon />} severity='error' sx={{ borderRadius: `${borderRadius.md}px` }}>
                  {error}
                </Alert>
              )}
            </>
          )}

          {/* Upload Results (only show successful ones when retrying) */}
          {uploadResults.some((r) => r.success) && <UploadResults results={uploadResults.filter((r) => r.success)} copiedUrl={copiedUrl} onCopyUrl={handleCopyUrl} onCopyAllUrls={handleCopyAllUrls} cardBackground={componentStyles.card.background} cardBackdropFilter={componentStyles.card.backdropFilter} cardWebkitBackdropFilter={componentStyles.card.WebkitBackdropFilter} />}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: spacingMUI.lg, pb: spacingMUI.base, pt: spacingMUI.sm }}>
        {pendingFiles.length === 0 && uploadResults.length > 0 ? (
          // After upload is fully complete (no pending files)
          <Button
            fullWidth
            variant='contained'
            onClick={handleClose}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${borderRadius.md}px`,
            }}>
            Done
          </Button>
        ) : (
          // Before/during upload or if there are pending files left to process
          <>
            <Button
              onClick={handleClose}
              color={uploading ? "error" : "inherit"}
              variant={uploading ? "outlined" : "text"}
              sx={{
                textTransform: "none",
                borderRadius: `${borderRadius.md}px`,
                fontWeight: uploading ? 600 : 400,
              }}>
              {uploadResults.some((r) => r.success) ? "Close" : "Cancel"}
            </Button>
            <Button
              variant='contained'
              onClick={handleUpload}
              disabled={uploading || pendingFiles.length === 0 || !folderName.trim() || !FOLDER_NAME_REGEX.test(folderName)}
              startIcon={<UploadIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: `${borderRadius.md}px`,
              }}>
              {uploading ? "Uploading..." : uploadResults.some((r) => !r.success) ? "Retry Failed" : "Upload"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
