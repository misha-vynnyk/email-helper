import { useState, useEffect } from "react";
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
import { STORAGE_URL_PREFIX, UI_TIMINGS } from "./constants";
import type { UploadResult } from "./types";

interface StorageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  files: Array<{ id: string; name: string; path?: string }>;
  onUpload: (category: string, folderName: string, customNames: Record<string, string>, fileOrder?: string[]) => Promise<{ results: UploadResult[]; category: string; folderName: string }>;
  onCancel?: () => void;
  initialFolderName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: UploadResult[]) => void;
}

export default function StorageUploadDialog({
  open,
  onClose,
  files,
  onUpload,
  onCancel,
  initialFolderName = "",
  onHistoryAdd,
}: StorageUploadDialogProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  const [category, setCategory] = useState<string>("finance");
  const [folderName, setFolderName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [orderedFiles, setOrderedFiles] = useState(files);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync orderedFiles when files prop changes
  useEffect(() => {
    setOrderedFiles(files);
  }, [files]);

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
      const response = await onUpload(category, folderName.trim(), customNames, fileOrder);
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
    const textToCopy = isShortPath
      ? url.replace(STORAGE_URL_PREFIX, '')
      : url;

    const copiedKey = isShortPath ? `${url}-short` : url;

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedUrl(copiedKey);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  const handleCopyAllUrls = async (isShortPath = false) => {
    const urls = uploadResults
      .filter(r => r.success)
      .map(r => isShortPath
        ? r.url.replace(STORAGE_URL_PREFIX, '')
        : r.url
      )
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${borderRadius.lg}px`,
          backgroundColor: componentStyles.card.background || theme.palette.background.paper,
        }
      }}
    >
      <DialogTitle sx={{ pb: spacingMUI.sm }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={spacingMUI.sm}>
            {uploadResults.length > 0 ? (
              <SuccessIcon sx={{ color: theme.palette.success.main }} />
            ) : (
              <UploadIcon color="primary" />
            )}
            <Typography variant="h6" component="span" fontWeight={600}>
              {uploadResults.length > 0 ? "Upload Complete" : "Upload to Storage"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={uploading}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
              }
            }}
          >
            <CloseIcon fontSize="small" />
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
                <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                  Files to upload ({orderedFiles.length}):
                </Typography>
                <Stack spacing={spacingMUI.sm} mt={spacingMUI.sm}>
                  {orderedFiles.map((file, index) => (
                    <Box
                      key={file.id}
                      draggable={!uploading}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacingMUI.sm,
                        p: spacingMUI.sm,
                        borderRadius: `${borderRadius.sm}px`,
                        backgroundColor: draggedIndex === index
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${draggedIndex === index ? theme.palette.primary.main : theme.palette.divider}`,
                        cursor: uploading ? 'default' : 'grab',
                        transition: 'all 0.2s ease',
                        '&:active': {
                          cursor: uploading ? 'default' : 'grabbing',
                        },
                        '&:hover': uploading ? {} : {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          borderColor: theme.palette.primary.light,
                        },
                      }}
                    >
                      {/* Drag Handle */}
                      <DragIcon
                        sx={{
                          color: theme.palette.text.disabled,
                          cursor: uploading ? 'default' : 'grab',
                          '&:active': {
                            cursor: uploading ? 'default' : 'grabbing',
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
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                          }}
                        >
                          <img
                            src={file.path}
                            alt={file.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                      )}

                      {/* Index Chip */}
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          minWidth: 36,
                          fontWeight: 700,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      />

                      {/* Name Input */}
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={file.name.replace(/\.[^/.]+$/, '')}
                        value={customNames[file.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^a-zA-Z0-9-_]/g, '')
                            .toLowerCase();
                          setCustomNames((prev) => ({
                            ...prev,
                            [file.id]: value,
                          }));
                        }}
                        disabled={uploading}
                        helperText={customNames[file.id] ? `${customNames[file.id]}.jpg` : file.name}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: `${borderRadius.sm}px`,
                            '&.Mui-focused': {
                              backgroundColor: 'transparent',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
          </Box>

          {/* Category Selection */}
          <FormControl component="fieldset">
            <FormLabel
              component="legend"
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
              <FormControlLabel value="finance" control={<Radio />} label="Finance" />
              <FormControlLabel value="health" control={<Radio />} label="Health" />
            </RadioGroup>
          </FormControl>

          {/* Folder Name Input */}
          <TextField
            label="Folder Name"
            placeholder="e.g., ABCD123"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            fullWidth
            disabled={uploading}
            helperText="Format: Letters + Numbers (e.g., ABCD123, Finance456)"
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: `${borderRadius.md}px`,
                '&.Mui-focused': {
                  backgroundColor: 'transparent',
                },
              }
            }}
          />

          {/* Upload Path Preview */}
          {folderName && /[a-zA-Z]+\d+/.test(folderName) && (
            <Alert
              severity="info"
              sx={{
                borderRadius: `${borderRadius.md}px`,
                '& .MuiAlert-message': {
                  width: '100%',
                }
              }}
            >
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                <strong>Upload path:</strong>
                <br />
                {`Promo/${category}/${folderName
                  .replace(/[^a-zA-Z]/g, "")
                  .toLowerCase()}/lift-${folderName.replace(/[^0-9]/g, "")}/`}
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
              <LinearProgress sx={{ mb: spacingMUI.sm, borderRadius: `${borderRadius.sm}px` }} />
              <Typography variant="body2" color="text.secondary" align="center">
                Uploading files...
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              icon={<ErrorIcon />}
              severity="error"
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
                backgroundColor: componentStyles.card.background || alpha(theme.palette.background.paper, 0.5),
                backdropFilter: componentStyles.card.backdropFilter,
                WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={spacingMUI.base}>
                <Box display="flex" alignItems="center" gap={spacingMUI.xs}>
                  <SuccessIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Uploaded Files ({uploadResults.filter(r => r.success).length}/{uploadResults.length})
                  </Typography>
                </Box>
                {uploadResults.filter(r => r.success).length > 0 && (
                  <Box display="flex" gap={spacingMUI.xs}>
                    <Tooltip title="Copy all full URLs" arrow placement="top">
                      <Button
                        size="small"
                        onClick={() => handleCopyAllUrls(false)}
                        startIcon={copiedUrl === "all" ? <CheckIcon /> : <LinkIcon />}
                        sx={{
                          textTransform: 'none',
                          borderRadius: `${borderRadius.md}px`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {copiedUrl === "all" ? "✓" : "Copy URLs"}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Copy all short paths" arrow placement="top">
                      <Button
                        size="small"
                        onClick={() => handleCopyAllUrls(true)}
                        startIcon={copiedUrl === "all-short" ? <CheckIcon /> : <CopyIcon />}
                        variant="outlined"
                        sx={{
                          textTransform: 'none',
                          borderRadius: `${borderRadius.md}px`,
                          fontSize: '0.75rem',
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
                      border: `1px solid ${result.success
                        ? alpha(theme.palette.success.main, 0.15)
                        : alpha(theme.palette.error.main, 0.15)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacingMUI.sm,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: result.success
                          ? alpha(theme.palette.success.main, 0.08)
                          : alpha(theme.palette.error.main, 0.08),
                      }
                    }}
                  >
                    <ImageIcon
                      sx={{
                        fontSize: 18,
                        color: result.success
                          ? theme.palette.success.main
                          : theme.palette.error.main
                      }}
                    />
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          mb: 0.25,
                          color: theme.palette.text.primary
                        }}
                      >
                        {result.filename}
                      </Typography>
                      {result.success && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: theme.palette.text.secondary,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {result.url}
                        </Typography>
                      )}
                    </Box>
                    {result.success && (
                      <Box display="flex" gap={spacingMUI.xs}>
                        <Tooltip title="Copy full URL" arrow placement="top">
                          <Button
                            size="small"
                            onClick={() => handleCopyUrl(result.url, false)}
                            startIcon={copiedUrl === result.url ? <CheckIcon /> : <LinkIcon />}
                            sx={{
                              minWidth: 'auto',
                              px: spacingMUI.sm,
                              py: spacingMUI.xs,
                              textTransform: 'none',
                              borderRadius: `${borderRadius.sm}px`,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: copiedUrl === result.url
                                ? theme.palette.success.main
                                : theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              }
                            }}
                          >
                            {copiedUrl === result.url ? "✓" : "URL"}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Copy short path" arrow placement="top">
                          <Button
                            size="small"
                            onClick={() => handleCopyUrl(result.url, true)}
                            startIcon={copiedUrl === `${result.url}-short` ? <CheckIcon /> : <CopyIcon />}
                            sx={{
                              minWidth: 'auto',
                              px: spacingMUI.sm,
                              py: spacingMUI.xs,
                              textTransform: 'none',
                              borderRadius: `${borderRadius.sm}px`,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: copiedUrl === `${result.url}-short`
                                ? theme.palette.success.main
                                : theme.palette.text.secondary,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                              }
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
            variant="contained"
            onClick={handleClose}
            sx={{
              textTransform: 'none',
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
                textTransform: 'none',
                borderRadius: `${borderRadius.md}px`,
                fontWeight: uploading ? 600 : 400,
              }}
            >
              {uploading ? "Скасувати" : "Cancel"}
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || !folderName.trim()}
              startIcon={<UploadIcon />}
              sx={{
                textTransform: 'none',
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
