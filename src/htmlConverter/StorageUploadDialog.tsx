import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ContentCopy as CopyIcon,
  Image as ImageIcon,
  CheckCircleOutline as CheckIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { spacingMUI, borderRadius } from "../theme/tokens";
import { copyToClipboard } from "./utils/clipboard";
import { normalizeCustomNameInput } from "./utils/imageAnalysis";
import { useOcrAnalysis } from "./utils/useOcrAnalysis";
import { UI_TIMINGS } from "./constants";
import { STORAGE_PROVIDERS_CONFIG } from "./constants";
import type { ImageAnalysisSettings, UploadResult } from "./types";
import type { StorageProviderKey } from "./constants";

function toShortPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
  } catch {
    return url;
  }
}

interface StorageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  storageProvider?: StorageProviderKey;
  files: Array<{ id: string; name: string; path?: string }>;
  onUpload: (
    category: string,
    folderName: string,
    customNames: Record<string, string>,
    fileOrder?: string[]
  ) => Promise<{ results: UploadResult[]; category: string; folderName: string }>;
  onCancel?: () => void;
  initialFolderName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: UploadResult[]) => void;
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function StorageUploadDialog({
  open,
  onClose,
  storageProvider = "default",
  files,
  onUpload,
  onCancel,
  initialFolderName = "",
  onHistoryAdd,
  imageAnalysisSettings,
}: StorageUploadDialogProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  const providerCfg =
    STORAGE_PROVIDERS_CONFIG.providers[storageProvider] ||
    STORAGE_PROVIDERS_CONFIG.providers.default;
  const showCategory = providerCfg.usesCategory;

  const categories = (showCategory && providerCfg.categories && providerCfg.categories.length > 0
    ? providerCfg.categories
    : STORAGE_PROVIDERS_CONFIG.providers.default.categories) || ["finance", "health"];
  const defaultCategory =
    (showCategory && providerCfg.defaultCategory) ||
    STORAGE_PROVIDERS_CONFIG.providers.default.defaultCategory ||
    categories[0] ||
    "finance";

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
  const [showOcrTextById, setShowOcrTextById] = useState<Record<string, boolean>>({});

  const analysisEnabled = Boolean(
    imageAnalysisSettings?.enabled && imageAnalysisSettings.engine === "ocr"
  );

  // AI (step 1): OCR-based suggestions (configured globally in HtmlConverterPanel)
  const { aiById, analyzeFile, reset: resetOcrState, dispose: disposeOcr } = useOcrAnalysis({
    enabled: analysisEnabled,
    settings: imageAnalysisSettings,
    files: orderedFiles,
  });

  const handleAnalyzeFile = useCallback(
    async (file: { id: string; name: string; path?: string }, opts?: { force?: boolean }) => {
      const result = await analyzeFile(file, { force: opts?.force });
      if (!result) return;

      // Auto-apply (global settings)
      const bestAlt = result.altSuggestions[0] || result.ctaSuggestions?.[0];
      if (imageAnalysisSettings?.autoApplyAlt === "ifEmpty" && bestAlt) {
        setCustomAlts((prev) => (prev[file.id] ? prev : { ...prev, [file.id]: bestAlt }));
      }
      if (imageAnalysisSettings?.autoApplyFilename === "ifEmpty" && result.nameSuggestions[0]) {
        const normalized = normalizeCustomNameInput(result.nameSuggestions[0]);
        if (normalized) {
          setCustomNames((prev) => (prev[file.id] ? prev : { ...prev, [file.id]: normalized }));
        }
      }
    },
    [analyzeFile, imageAnalysisSettings?.autoApplyAlt, imageAnalysisSettings?.autoApplyFilename]
  );

  // Sync orderedFiles when files prop changes
  useEffect(() => {
    setOrderedFiles(files);
  }, [files]);

  // Reset per-open transient state
  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploadResults([]);
    setCopiedUrl(null);
    setCustomNames({});
    setCustomAlts({});
    setShowOcrTextById({});
    resetOcrState();
  }, [open]);

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
      if (initialFolderName && /[a-zA-Z]+\d+/.test(initialFolderName)) {
        setFolderName(initialFolderName);
        return;
      }

      // Priority 2: Try to get from clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard
          .readText()
          .then((text) => {
            // Check if clipboard contains valid format (e.g., "ABCD123")
            if (/[a-zA-Z]+\d+/.test(text.trim())) {
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

  const handleUpload = async () => {
    setError(null);
    setUploadResults([]);

    // Validation
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
      const response = await onUpload(effectiveCategory, folderName.trim(), customNames, fileOrder);
      setUploadResults(response.results);

      // Add to history
      if (onHistoryAdd && response.results.length > 0) {
        onHistoryAdd(response.category, response.folderName, response.results);
      }

      // Don't auto-close, let user review results and copy URLs
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
      setError("Завантаження скасовано");
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
          background:
            componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
        },
      }}
    >
      <DialogTitle sx={{ pb: spacingMUI.sm }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
        >
          <Box
            display='flex'
            alignItems='center'
            gap={spacingMUI.sm}
          >
            {uploadResults.length > 0 ? (
              <SuccessIcon sx={{ color: theme.palette.success.main }} />
            ) : (
              <UploadIcon color='primary' />
            )}
            <Typography
              variant='h6'
              component='span'
              fontWeight={600}
            >
              {uploadResults.length > 0 ? "Upload Complete" : "Upload to Storage"}
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
            }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: spacingMUI.lg }}>
        <Stack spacing={spacingMUI.lg}>
          {/* Hide input section if upload is complete */}
          {uploadResults.length === 0 && (
            <>
              {/* Files list with thumbnails, rename, and drag & drop */}
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  fontWeight={500}
                  gutterBottom
                >
                  Files to upload ({orderedFiles.length}):
                </Typography>
                <Stack
                  spacing={spacingMUI.sm}
                  mt={spacingMUI.sm}
                >
                  {orderedFiles.map((file, index) => (
                    <Box
                      key={file.id}
                      draggable={!uploading}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: spacingMUI.sm,
                        p: spacingMUI.sm,
                        borderRadius: `${borderRadius.sm}px`,
                        backgroundColor:
                          draggedIndex === index
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${draggedIndex === index ? theme.palette.primary.main : theme.palette.divider}`,
                        cursor: uploading ? "default" : "grab",
                        transition: "all 0.2s ease",
                        "&:active": {
                          cursor: uploading ? "default" : "grabbing",
                        },
                        "&:hover": uploading
                          ? {}
                          : {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              borderColor: theme.palette.primary.light,
                            },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacingMUI.sm,
                        }}
                      >
                        {/* Drag Handle */}
                        <DragIcon
                          sx={{
                            color: theme.palette.text.disabled,
                            cursor: uploading ? "default" : "grab",
                            "&:active": {
                              cursor: uploading ? "default" : "grabbing",
                            },
                          }}
                        />

                        {/* Thumbnail */}
                        {file.path && (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: `${borderRadius.sm}px`,
                              overflow: "hidden",
                              flexShrink: 0,
                              border: `1px solid ${theme.palette.divider}`,
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                            }}
                          >
                            <img
                              src={file.path}
                              alt={file.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                        )}

                        {/* Index Chip */}
                        <Chip
                          label={`#${index + 1}`}
                          size='small'
                          sx={{
                            minWidth: 36,
                            fontWeight: 700,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        />

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: spacingMUI.xs }}>
                          {/* Name Input */}
                          <TextField
                            size='small'
                            fullWidth
                            placeholder={file.name.replace(/\.[^/.]+$/, "")}
                            value={customNames[file.id] || ""}
                            onChange={(e) => {
                          const value = normalizeCustomNameInput(e.target.value);
                              setCustomNames((prev) => ({
                                ...prev,
                                [file.id]: value,
                              }));
                            }}
                            disabled={uploading}
                            helperText={customNames[file.id] ? `${customNames[file.id]}.jpg` : file.name}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: `${borderRadius.sm}px`,
                                "&.Mui-focused": {
                                  backgroundColor: "transparent",
                                },
                              },
                              "& .MuiFormHelperText-root": {
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                              },
                            }}
                          />

                          {/* ALT Input */}
                          {analysisEnabled && (
                            <TextField
                              size='small'
                              fullWidth
                              label='ALT'
                              placeholder='Suggested from OCR…'
                              value={customAlts[file.id] || ""}
                              onChange={(e) => {
                                setCustomAlts((prev) => ({ ...prev, [file.id]: e.target.value }));
                              }}
                              disabled={uploading}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* AI suggestions */}
                      {analysisEnabled && (
                        <Box sx={{ pl: 0, pt: spacingMUI.xs }}>
                          <Stack
                            direction='row'
                            spacing={spacingMUI.xs}
                            alignItems='center'
                            flexWrap='wrap'
                          >
                            <Button
                              size='small'
                              variant='outlined'
                              onClick={() => handleAnalyzeFile(file)}
                              disabled={uploading || aiById[file.id]?.status === "running"}
                              sx={{ textTransform: "none" }}
                            >
                              {aiById[file.id]?.status === "running" ? "Analyzing…" : "Analyze (OCR)"}
                            </Button>

                            {aiById[file.id]?.skippedReason === "lowTextLikelihood" && (
                              <Button
                                size='small'
                                variant='text'
                                onClick={() => handleAnalyzeFile(file, { force: true })}
                                disabled={uploading || aiById[file.id]?.status === "running"}
                                sx={{ textTransform: "none" }}
                              >
                                Force OCR
                              </Button>
                            )}

                            {typeof aiById[file.id]?.textLikelihood === "number" && (
                              <Chip
                                size='small'
                                variant='outlined'
                                label={`TL ${Number(aiById[file.id]?.textLikelihood).toFixed(3)}`}
                              />
                            )}

                            {aiById[file.id]?.cacheHit && (
                              <Chip size='small' variant='outlined' label='cache' />
                            )}

                            {aiById[file.id]?.status === "error" && (
                              <Typography variant='caption' color='error'>
                                {aiById[file.id]?.error}
                              </Typography>
                            )}
                          </Stack>

                          {aiById[file.id]?.status === "running" && (
                            <Box sx={{ mt: spacingMUI.xs }}>
                              <LinearProgress
                                variant={typeof aiById[file.id]?.progress === "number" ? "determinate" : "indeterminate"}
                                value={Math.round((aiById[file.id]?.progress ?? 0) * 100)}
                              />
                            </Box>
                          )}

                          {aiById[file.id]?.status === "done" && (
                            <Box sx={{ mt: spacingMUI.xs }}>
                              {aiById[file.id]?.skippedReason === "lowTextLikelihood" && (
                                <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
                                  OCR пропущено (текст малоймовірний). Натисни <b>Force OCR</b>, якщо це банер/кнопка з текстом.
                                </Typography>
                              )}

                              {(aiById[file.id]?.ocrText || aiById[file.id]?.ocrTextRaw) && (
                                <Box sx={{ mb: spacingMUI.xs }}>
                                  <Stack direction='row' spacing={spacingMUI.xs} alignItems='center' flexWrap='wrap'>
                                    <Button
                                      size='small'
                                      variant='text'
                                      onClick={() =>
                                        setShowOcrTextById((prev) => ({
                                          ...prev,
                                          [file.id]: !prev[file.id],
                                        }))
                                      }
                                      sx={{ textTransform: "none", px: 0.5 }}
                                    >
                                      {showOcrTextById[file.id] ? "Сховати OCR текст" : "Показати OCR текст"}
                                    </Button>

                                    <Tooltip title='Copy OCR text'>
                                      <IconButton
                                        size='small'
                                        onClick={() =>
                                          copyToClipboard(
                                            aiById[file.id]?.ocrTextRaw ||
                                              aiById[file.id]?.ocrText ||
                                              ""
                                          )
                                        }
                                      >
                                        <CopyIcon fontSize='small' />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>

                                  {showOcrTextById[file.id] && (
                                    <TextField
                                      fullWidth
                                      size='small'
                                      multiline
                                      minRows={3}
                                      maxRows={10}
                                      value={aiById[file.id]?.ocrText || ""}
                                      label='OCR (clean)'
                                      InputProps={{ readOnly: true }}
                                      sx={{ mt: spacingMUI.xs }}
                                    />
                                  )}

                                  {showOcrTextById[file.id] && aiById[file.id]?.ocrTextRaw && (
                                    <TextField
                                      fullWidth
                                      size='small'
                                      multiline
                                      minRows={3}
                                      maxRows={10}
                                      value={aiById[file.id]?.ocrTextRaw || ""}
                                      label='OCR (raw debug)'
                                      InputProps={{ readOnly: true }}
                                      sx={{ mt: spacingMUI.xs }}
                                    />
                                  )}
                                </Box>
                              )}

                              {(aiById[file.id]?.altSuggestions?.length ?? 0) > 0 && (
                                <>
                                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
                                    ALT suggestions
                                  </Typography>
                                  <Stack direction='row' spacing={spacingMUI.xs} flexWrap='wrap'>
                                    {aiById[file.id]?.altSuggestions?.map((s) => (
                                      <Chip
                                        key={s}
                                        size='small'
                                        label={s}
                                        onClick={() => setCustomAlts((prev) => ({ ...prev, [file.id]: s }))}
                                        sx={{ cursor: "pointer" }}
                                      />
                                    ))}
                                  </Stack>
                                </>
                              )}

                              {(aiById[file.id]?.ctaSuggestions?.length ?? 0) > 0 && (
                                <Box sx={{ mt: spacingMUI.xs }}>
                                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
                                    CTA text
                                  </Typography>
                                  <Stack direction='row' spacing={spacingMUI.xs} flexWrap='wrap'>
                                    {aiById[file.id]?.ctaSuggestions?.map((s) => (
                                      <Chip
                                        key={s}
                                        size='small'
                                        variant='outlined'
                                        label={s}
                                        onClick={() => setCustomAlts((prev) => ({ ...prev, [file.id]: s }))}
                                        sx={{ cursor: "pointer" }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              )}

                              {(aiById[file.id]?.nameSuggestions?.length ?? 0) > 0 && (
                                <Box sx={{ mt: spacingMUI.xs }}>
                                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
                                    Filename (one word)
                                  </Typography>
                                  <Stack direction='row' spacing={spacingMUI.xs} flexWrap='wrap'>
                                    {aiById[file.id]?.nameSuggestions?.map((s) => (
                                      <Chip
                                        key={s}
                                        size='small'
                                        variant='outlined'
                                        label={s}
                                        onClick={() =>
                                          setCustomNames((prev) => ({
                                            ...prev,
                                            [file.id]: normalizeCustomNameInput(s),
                                          }))
                                        }
                                        sx={{ cursor: "pointer" }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Category Selection */}
              {showCategory ? (
                <FormControl component='fieldset'>
                  <FormLabel
                    component='legend'
                    sx={{
                      fontWeight: 500,
                      mb: spacingMUI.sm,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Category
                  </FormLabel>
                  <RadioGroup
                    row
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <FormControlLabel
                        key={c}
                        value={c}
                        control={<Radio />}
                        label={c}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <Alert
                  severity='info'
                  sx={{ borderRadius: `${borderRadius.md}px` }}
                >
                  AlfaOne: категорія не використовується (root:{" "}
                  <code>{providerCfg.publicRootPrefix}/</code>)
                </Alert>
              )}

              {/* Folder Name Input */}
              <TextField
                label='Folder Name'
                placeholder='e.g., ABCD123'
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                fullWidth
                disabled={uploading}
                helperText='Format: Letters + Numbers (e.g., ABCD123, Finance456)'
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
              {folderName && /[a-zA-Z]+\d+/.test(folderName) && (
                <Alert
                  severity='info'
                  sx={{
                    borderRadius: `${borderRadius.md}px`,
                    "& .MuiAlert-message": {
                      width: "100%",
                    },
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{ fontFamily: "monospace" }}
                  >
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
                  }}
                >
                  <LinearProgress
                    sx={{ mb: spacingMUI.sm, borderRadius: `${borderRadius.sm}px` }}
                  />
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    align='center'
                  >
                    Uploading files...
                  </Typography>
                </Box>
              )}

              {/* Error Message */}
              {error && (
                <Alert
                  icon={<ErrorIcon />}
                  severity='error'
                  sx={{ borderRadius: `${borderRadius.md}px` }}
                >
                  {error}
                </Alert>
              )}
            </>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <Box
              sx={{
                p: spacingMUI.base,
                borderRadius: `${borderRadius.lg}px`,
                backgroundColor:
                  componentStyles.card.background || alpha(theme.palette.background.paper, 0.5),
                backdropFilter: componentStyles.card.backdropFilter,
                WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={spacingMUI.base}
              >
                <Box
                  display='flex'
                  alignItems='center'
                  gap={spacingMUI.xs}
                >
                  <SuccessIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography
                    variant='subtitle2'
                    fontWeight={600}
                  >
                    Uploaded Files ({uploadResults.filter((r) => r.success).length}/
                    {uploadResults.length})
                  </Typography>
                </Box>
                {uploadResults.filter((r) => r.success).length > 0 && (
                  <Box
                    display='flex'
                    gap={spacingMUI.xs}
                  >
                    <Tooltip
                      title='Copy all full URLs'
                      arrow
                      placement='top'
                    >
                      <Button
                        size='small'
                        onClick={() => handleCopyAllUrls(false)}
                        startIcon={copiedUrl === "all" ? <CheckIcon /> : <LinkIcon />}
                        sx={{
                          textTransform: "none",
                          borderRadius: `${borderRadius.md}px`,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {copiedUrl === "all" ? "✓" : "Copy URLs"}
                      </Button>
                    </Tooltip>
                    <Tooltip
                      title='Copy all short paths'
                      arrow
                      placement='top'
                    >
                      <Button
                        size='small'
                        onClick={() => handleCopyAllUrls(true)}
                        startIcon={copiedUrl === "all-short" ? <CheckIcon /> : <CopyIcon />}
                        variant='outlined'
                        sx={{
                          textTransform: "none",
                          borderRadius: `${borderRadius.md}px`,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {copiedUrl === "all-short" ? "✓" : "Copy Paths"}
                      </Button>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              <Stack spacing={spacingMUI.xs}>
                {uploadResults.map((result, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: spacingMUI.sm,
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: result.success
                        ? alpha(theme.palette.success.main, 0.05)
                        : alpha(theme.palette.error.main, 0.05),
                      border: `1px solid ${
                        result.success
                          ? alpha(theme.palette.success.main, 0.15)
                          : alpha(theme.palette.error.main, 0.15)
                      }`,
                      display: "flex",
                      alignItems: "center",
                      gap: spacingMUI.sm,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: result.success
                          ? alpha(theme.palette.success.main, 0.08)
                          : alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <ImageIcon
                      sx={{
                        fontSize: 18,
                        color: result.success
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      }}
                    />
                    <Box
                      flex={1}
                      minWidth={0}
                    >
                      <Typography
                        variant='body2'
                        fontWeight={500}
                        sx={{
                          mb: 0.25,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {result.filename}
                      </Typography>
                      {result.success ? (
                        <Typography
                          variant='caption'
                          sx={{
                            fontFamily: "monospace",
                            color: theme.palette.text.secondary,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {result.url}
                        </Typography>
                      ) : (
                        <Typography
                          variant='caption'
                          color='error.main'
                        >
                          {result.error || "Upload failed"}
                        </Typography>
                      )}
                    </Box>
                    {result.success && (
                      <Box
                        display='flex'
                        gap={spacingMUI.xs}
                      >
                        <Tooltip
                          title='Copy full URL'
                          arrow
                          placement='top'
                        >
                          <Button
                            size='small'
                            onClick={() => handleCopyUrl(result.url, false)}
                            startIcon={copiedUrl === result.url ? <CheckIcon /> : <LinkIcon />}
                            sx={{
                              minWidth: "auto",
                              px: spacingMUI.sm,
                              py: spacingMUI.xs,
                              textTransform: "none",
                              borderRadius: `${borderRadius.sm}px`,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color:
                                copiedUrl === result.url
                                  ? theme.palette.success.main
                                  : theme.palette.primary.main,
                              "&:hover": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            {copiedUrl === result.url ? "✓" : "URL"}
                          </Button>
                        </Tooltip>
                        <Tooltip
                          title='Copy short path'
                          arrow
                          placement='top'
                        >
                          <Button
                            size='small'
                            onClick={() => handleCopyUrl(result.url, true)}
                            startIcon={
                              copiedUrl === `${result.url}-short` ? <CheckIcon /> : <CopyIcon />
                            }
                            sx={{
                              minWidth: "auto",
                              px: spacingMUI.sm,
                              py: spacingMUI.xs,
                              textTransform: "none",
                              borderRadius: `${borderRadius.sm}px`,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color:
                                copiedUrl === `${result.url}-short`
                                  ? theme.palette.success.main
                                  : theme.palette.text.secondary,
                              "&:hover": {
                                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                              },
                            }}
                          >
                            {copiedUrl === `${result.url}-short` ? "✓" : "Path"}
                          </Button>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: spacingMUI.lg, pb: spacingMUI.base, pt: spacingMUI.sm }}>
        {uploadResults.length > 0 ? (
          // After upload is complete
          <Button
            fullWidth
            variant='contained'
            onClick={handleClose}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${borderRadius.md}px`,
            }}
          >
            Done
          </Button>
        ) : (
          // Before/during upload
          <>
            <Button
              onClick={handleClose}
              color={uploading ? "error" : "inherit"}
              variant={uploading ? "outlined" : "text"}
              sx={{
                textTransform: "none",
                borderRadius: `${borderRadius.md}px`,
                fontWeight: uploading ? 600 : 400,
              }}
            >
              {uploading ? "Скасувати" : "Cancel"}
            </Button>
            <Button
              variant='contained'
              onClick={handleUpload}
              disabled={uploading || !folderName.trim()}
              startIcon={<UploadIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: `${borderRadius.md}px`,
              }}
            >
              {uploading ? "Завантаження..." : "Upload"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
