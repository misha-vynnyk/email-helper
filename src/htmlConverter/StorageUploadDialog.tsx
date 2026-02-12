import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, FormLabel, ToggleButtonGroup, ToggleButton, Typography, Box, Alert, LinearProgress, IconButton, Tooltip, Stack, useTheme, alpha, Divider, FormHelperText } from "@mui/material";
import { CloudUpload as UploadIcon, CheckCircle as SuccessIcon, Error as ErrorIcon, Close as CloseIcon, Link as LinkIcon, CheckCircleOutline as CheckIcon } from "@mui/icons-material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { spacingMUI, borderRadius } from "../theme/tokens";
import { copyToClipboard } from "./utils/clipboard";
import { AiBackendClient } from "./utils/ocr/aiClient";

// import { normalizeCustomNameInput } from "./utils/imageAnalysis";
import { useOcrAnalysis } from "./utils/useOcrAnalysis";
import { UI_TIMINGS } from "./constants";
import type { ImageAnalysisSettings, UploadResult } from "./types";
import type { StorageProviderKey } from "./constants";
import { useUploadMetadata } from "./hooks/useUploadMetadata";
import { FileList } from "./components/FileList";

interface StorageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  storageProvider?: StorageProviderKey;
  files: Array<{ id: string; name: string; path?: string }>;
  onUpload: (category: string, folderName: string, customNames: Record<string, string>, customAlts: Record<string, string>, fileOrder?: string[]) => Promise<{ results: UploadResult[]; category: string; folderName: string }>;
  onCancel?: () => void;
  initialFolderName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: UploadResult[], customAlts?: Record<string, string>) => void;
  onAltsUpdate?: (altMap: Record<string, string>) => void; // For post-upload alt updates
  existingUrls?: Record<string, string>; // Existing storage URLs for files (id -> url)
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function StorageUploadDialog({ open, onClose, storageProvider = "default", files, onUpload, onCancel, initialFolderName = "", onHistoryAdd, onAltsUpdate, existingUrls, imageAnalysisSettings }: StorageUploadDialogProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  // Extracted Metadata Hook
  const { category, setCategory, folderName, setFolderName, customNames, setCustomNames, customAlts, setCustomAlts, orderedFiles, draggedIndex, handleDragStart, handleDragOver, handleDragEnd, showCategory, categories, providerCfg } = useUploadMetadata({ files, open, storageProvider, initialFolderName });

  // UI State
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showOcrTextById, setShowOcrTextById] = useState<Record<string, boolean>>({});
  const [aiBackendWarning, setAiBackendWarning] = useState<string | null>(null);

  const analysisEnabled = Boolean(imageAnalysisSettings?.enabled && imageAnalysisSettings.engine === "ocr");

  // Check AI backend availability when analysis is enabled
  useEffect(() => {
    if (!analysisEnabled) {
      setAiBackendWarning(null);
      return;
    }

    let isMounted = true;

    const checkAiBackend = async () => {
      try {
        const available = await AiBackendClient.isAvailable();
        if (isMounted) {
          if (!available) {
            setAiBackendWarning(
              "⚠️ Image analysis backend is not running. Please run: npm run dev:ai to enable image analysis."
            );
          } else {
            setAiBackendWarning(null);
          }
        }
      } catch {
        if (isMounted) {
          setAiBackendWarning("⚠️ Cannot connect to image analysis backend");
        }
      }
    };

    checkAiBackend();
    // Re-check every 10 seconds
    const interval = setInterval(checkAiBackend, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [analysisEnabled]);

  // AI Analysis (kept here as it ties to complex state, though could be extracted)
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
      const result = await analyzeFile(file, { force: opts?.force });
      if (!result) return;

      // Auto-apply if settings dictate
      // DISABLE AUTO-APPLY (User request: "remove automatic insertion")
      /*
      const bestAlt = result.altSuggestions[0] || result.ctaSuggestions?.[0];
      if (imageAnalysisSettings?.autoApplyAlt === "ifEmpty" && bestAlt) {
        setCustomAlts((prev) => (prev[file.id]?.length ? prev : { ...prev, [file.id]: [bestAlt] }));
      }
      if (imageAnalysisSettings?.autoApplyFilename === "ifEmpty" && result.nameSuggestions[0]) {
        const normalized = normalizeCustomNameInput(result.nameSuggestions[0]);
        if (normalized) {
          setCustomNames((prev) => (prev[file.id] ? prev : { ...prev, [file.id]: normalized }));
        }
      }
      */
    },
    [analyzeFile, /* imageAnalysisSettings?.autoApplyAlt, imageAnalysisSettings?.autoApplyFilename, */ setCustomAlts, setCustomNames]
  );

  // Handlers
  const [altsSaved, setAltsSaved] = useState(false);
  const hasAltsToSave = orderedFiles.some((f) => customAlts[f.id]?.length > 0);

  const handleSaveAlts = () => {
    if (!onAltsUpdate) return;

    // Collect alts
    const altMap: Record<string, string> = {};

    // From current results
    if (uploadResults.length > 0) {
      for (const res of uploadResults) {
        if (res.success) {
          const file = orderedFiles.find((f) => {
            const customName = customNames[f.id];
            const baseName = customName || f.name.replace(/\.[^.]+$/, "");
            return res.filename.startsWith(baseName);
          });
          if (file && customAlts[file.id]?.length) {
            altMap[res.url] = customAlts[file.id].join(" | ");
          }
        }
      }
    }

    // From existing URLs
    if (existingUrls) {
      for (const file of orderedFiles) {
        if (existingUrls[file.id] && customAlts[file.id]?.length) {
          altMap[existingUrls[file.id]] = customAlts[file.id].join(" | ");
        }
      }
    }

    if (Object.keys(altMap).length > 0) {
      onAltsUpdate(altMap);
      setAltsSaved(true);
      setTimeout(() => setAltsSaved(false), 2000);
    }
  };

  const handleUploadClick = async () => {
    setError(null);
    setUploadResults([]);

    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }
    if (!/[a-zA-Z]+\d+/.test(folderName)) {
      setError("Invalid format. Expected: Letters + Numbers (e.g., ABCD123)");
      return;
    }

    setUploading(true);
    try {
      const fileOrder = orderedFiles.map((f) => f.id);
      const effectiveCategory = showCategory ? category : "finance";
      // Convert customAlts from array to pipe-separated string for API
      const customAltsAsStrings: Record<string, string> = {};
      for (const [id, alts] of Object.entries(customAlts)) {
        customAltsAsStrings[id] = alts.join(" | ");
      }
      const response = await onUpload(effectiveCategory, folderName.trim(), customNames, customAltsAsStrings, fileOrder);
      setUploadResults(response.results);
      if (onHistoryAdd && response.results.length > 0) {
        // Build filename -> alt map for history
        const altsByFilename: Record<string, string> = {};
        for (const res of response.results) {
          if (res.success) {
            // Find the file by matching the result filename
            const file = orderedFiles.find((f) => {
              const customName = customNames[f.id];
              const baseName = customName || f.name.replace(/\.[^.]+$/, "");
              return res.filename.startsWith(baseName);
            });
            if (file && customAlts[file.id]?.length) {
              altsByFilename[res.filename] = customAlts[file.id].join(" | ");
            }
          }
        }
        onHistoryAdd(response.category, response.folderName, response.results, altsByFilename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      handleCancelClick();
    } else {
      onClose();
      // Reset UI state
      setError(null);
      setUploadResults([]);
      setCopiedUrl(null);
      // Metadata state resets in hook on open change
      disposeOcr();
      resetOcrState();
    }
  };

  const handleCancelClick = () => {
    if (uploading && onCancel) {
      onCancel();
      setError("Завантаження скасовано");
      setUploading(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopiedUrl(key);
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
            {uploadResults.length > 0 ? <SuccessIcon sx={{ color: theme.palette.success.main }} /> : <UploadIcon color='primary' />}
            <Typography variant='h6' component='span' fontWeight={600}>
              {uploadResults.length > 0 ? "Upload Complete" : "Upload to Storage"}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={uploading} size='small'>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: spacingMUI.lg }}>
        <Stack spacing={spacingMUI.lg}>
          {/* AI Backend Warning */}
          {aiBackendWarning && (
            <Alert severity='warning' sx={{ borderRadius: `${borderRadius.md}px` }}>
              {aiBackendWarning}
            </Alert>
          )}

          {/* Input Section */}
          {uploadResults.length === 0 && (
            <>
              {/* File List */}
              {files.length > 0 && (
                <>
                  <Typography variant='subtitle2' fontWeight={600}>
                    Files ({files.length})
                  </Typography>
                  <FileList files={orderedFiles} customNames={customNames} setCustomNames={setCustomNames} customAlts={customAlts} setCustomAlts={setCustomAlts} draggedIndex={draggedIndex} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} aiById={aiById} showOcrTextById={showOcrTextById} setShowOcrTextById={setShowOcrTextById} onAnalyze={handleAnalyzeFile} />
                </>
              )}

              {/* Metadata Form */}
              <Stack spacing={spacingMUI.base}>
                {showCategory ? (
                  <FormControl fullWidth>
                    <FormLabel component='legend' sx={{ fontWeight: 500, mb: 1, color: "text.primary" }}>
                      Category
                    </FormLabel>
                    <ToggleButtonGroup
                      value={category}
                      exclusive
                      onChange={(_, newVal) => newVal && setCategory(newVal)}
                      fullWidth
                      size='small'
                      sx={{
                        "& .MuiToggleButton-root": {
                          borderRadius: `${borderRadius.md}px`,
                          border: `1px solid ${theme.palette.divider}`,
                          "&.Mui-selected": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            border: `1px solid ${theme.palette.primary.main}`,
                            "&:hover": {
                              backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            },
                          },
                          "&:not(:first-of-type)": {
                            marginLeft: 1,
                            borderLeft: `1px solid ${theme.palette.divider}`,
                          },
                          "&:not(:last-of-type)": {
                            borderRight: `1px solid ${theme.palette.divider}`,
                          },
                        },
                      }}>
                      {categories.map((c) => (
                        <ToggleButton key={c} value={c}>
                          {c}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </FormControl>
                ) : (
                  <Alert severity='info' sx={{ borderRadius: `${borderRadius.md}px` }}>
                    AlfaOne: категорія не використовується (root: <code>{providerCfg.publicRootPrefix}/</code>)
                  </Alert>
                )}

                <Box>
                  <TextField
                    label='Folder Name'
                    placeholder='e.g., ABCD123'
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    fullWidth
                    disabled={uploading}
                    // helperText removal - moving to custom helper text below
                    autoFocus
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: `${borderRadius.md}px` } }}
                  />
                  {/* Combined Helper Text: Format + Path Preview */}
                  <FormHelperText sx={{ mt: 1, ml: 1, lineHeight: 1.5 }}>
                    Format: Letters + Numbers (e.g., ABCD123)
                    <br />
                    {folderName && /[a-zA-Z]+\d+/.test(folderName) && (
                      <Typography component='span' variant='caption' sx={{ fontFamily: "monospace", color: "text.primary", display: "block", mt: 0.5, p: 0.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                        Path:{" "}
                        <strong>
                          {(() => {
                            const letters = folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
                            const digits = folderName.replace(/[^0-9]/g, "");
                            const parts = [providerCfg.publicRootPrefix];
                            if (showCategory) parts.push(category);
                            parts.push(letters, `lift-${digits}`);
                            return `${parts.filter(Boolean).join("/")}/`;
                          })()}
                        </strong>
                      </Typography>
                    )}
                  </FormHelperText>
                </Box>
              </Stack>

              {/* Progress/Error */}
              {uploading && (
                <Box sx={{ p: 2, borderRadius: `${borderRadius.md}px`, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                  <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />
                  <Typography variant='body2' color='text.secondary' align='center'>
                    Uploading files...
                  </Typography>
                </Box>
              )}
              {error && (
                <Alert icon={<ErrorIcon />} severity='error' sx={{ borderRadius: `${borderRadius.md}px` }}>
                  {error}
                </Alert>
              )}
            </>
          )}

          {/* Results Section */}
          {uploadResults.length > 0 && (
            <Box sx={{ p: 2, borderRadius: `${borderRadius.lg}px`, bgcolor: componentStyles.card.background || alpha(theme.palette.background.paper, 0.5), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
              <Box display='flex' justifyContent='space-between' mb={2}>
                <Box display='flex' alignItems='center' gap={1}>
                  <SuccessIcon color='success' />
                  <Typography variant='subtitle2'>
                    Uploaded Files ({uploadResults.filter((r) => r.success).length}/{uploadResults.length})
                  </Typography>
                </Box>
                <Box display='flex' gap={1}>
                  <Tooltip title='Copy all URLs'>
                    <Button
                      size='small'
                      onClick={() => {
                        const text = uploadResults
                          .filter((r) => r.success)
                          .map((r) => r.url)
                          .join("\n");
                        handleCopy(text, "all");
                      }}
                      startIcon={copiedUrl === "all" ? <CheckIcon /> : <LinkIcon />}>
                      {copiedUrl === "all" ? "✓" : "Copy URLs"}
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
              <Stack spacing={1}>
                {uploadResults.map((res, idx) => (
                  <Box key={idx} sx={{ p: 1, borderRadius: 1, bgcolor: res.success ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05), border: `1px solid ${res.success ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15)}`, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box flex={1}>
                      <Typography variant='body2' fontWeight={500}>
                        {res.filename}
                      </Typography>
                      {res.success ? (
                        <Typography variant='caption' sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                          {res.url}
                        </Typography>
                      ) : (
                        <Typography variant='caption' color='error'>
                          {res.error}
                        </Typography>
                      )}
                    </Box>
                    {res.success && (
                      <Tooltip title='Copy URL'>
                        <Button size='small' onClick={() => handleCopy(res.url, res.url)} startIcon={copiedUrl === res.url ? <CheckIcon /> : <LinkIcon />} sx={{ minWidth: "auto", px: 1 }}>
                          {copiedUrl === res.url ? "✓" : "URL"}
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        {uploadResults.length > 0 ? (
          <>
            <Button fullWidth variant='contained' onClick={handleClose} sx={{ borderRadius: `${borderRadius.md}px` }}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} color={uploading ? "error" : "inherit"} variant={uploading ? "outlined" : "text"} sx={{ borderRadius: `${borderRadius.md}px` }}>
              {uploading ? "Скасувати" : "Cancel"}
            </Button>

            {onAltsUpdate && existingUrls && Object.keys(existingUrls).length > 0 && hasAltsToSave && (
              <Button variant={altsSaved ? "contained" : "outlined"} color={altsSaved ? "success" : "primary"} onClick={handleSaveAlts} disabled={uploading || altsSaved} startIcon={altsSaved ? <CheckIcon /> : undefined} sx={{ borderRadius: `${borderRadius.md}px` }}>
                {altsSaved ? "Saved!" : "Save Alts"}
              </Button>
            )}

            <Button variant='contained' onClick={handleUploadClick} disabled={uploading || !folderName.trim()} startIcon={<UploadIcon />} sx={{ borderRadius: `${borderRadius.md}px` }}>
              {uploading ? "Завантаження..." : "Upload"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
