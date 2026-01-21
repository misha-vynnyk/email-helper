/**
 * Compact Image Processor for HTML Converter
 * Extracts and processes images from HTML content
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  alpha,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PlayArrow as ProcessIcon,
  CloudUpload as UploadIcon,
  FindReplace as ReplaceIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, spacingMUI } from "../theme/tokens";
import StorageUploadDialog from "./StorageUploadDialog";
import { formatSize, extractFolderName } from "./utils/formatters";
import { logError, logSuccess, logWarning } from "./utils/errorHandler";
import { STORAGE_KEYS, UI_TIMINGS, UPLOAD_CONFIG, IMAGE_DEFAULTS, STORAGE_URL_PREFIX } from "./constants";
import type { ProcessedImage, ImageFormat, ImageSettings, UploadResult, StorageUploadResponse } from "./types";

interface ImageProcessorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  triggerExtract?: number;
  fileName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: Array<{ filename: string; url: string; success: boolean }>) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onResetReplacement?: (resetFn: () => void) => void;
  hasOutput?: boolean;
}

function loadSettings(): ImageSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load HTML converter settings:", error);
  }
  return {
    format: IMAGE_DEFAULTS.FORMAT,
    quality: IMAGE_DEFAULTS.QUALITY,
    maxWidth: IMAGE_DEFAULTS.MAX_WIDTH,
    autoProcess: IMAGE_DEFAULTS.AUTO_PROCESS,
    preserveFormat: IMAGE_DEFAULTS.PRESERVE_FORMAT,
  };
}

function saveSettings(settings: ImageSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.IMAGE_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save HTML converter settings:", error);
  }
}

export default function ImageProcessor({
  editorRef,
  onLog,
  visible,
  onVisibilityChange,
  triggerExtract = 0,
  fileName = "",
  onHistoryAdd,
  onReplaceUrls,
  onResetReplacement,
  hasOutput = false
}: ImageProcessorProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  const [images, setImages] = useState<ProcessedImage[]>([]);
  const savedSettings = loadSettings();
  const [format, setFormat] = useState<ImageFormat>(savedSettings.format);
  const [quality, setQuality] = useState(savedSettings.quality);
  const [maxWidth, setMaxWidth] = useState(savedSettings.maxWidth);
  const [isExtracting, setIsExtracting] = useState(false);
  const [autoProcess, setAutoProcess] = useState(savedSettings.autoProcess);
  const [preserveFormat, setPreserveFormat] = useState(savedSettings.preserveFormat);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const isExtractingRef = useRef(false);
  const [lastUploadedUrls, setLastUploadedUrls] = useState<Record<string, string>>({});
  const [replacementDone, setReplacementDone] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const initialFolderName = extractFolderName(fileName);

  // Register reset function with parent
  useEffect(() => {
    if (onResetReplacement) {
      onResetReplacement(() => setReplacementDone(false));
    }
  }, [onResetReplacement]);

  const log = useCallback(
    (message: string) => {
      if (onLog) onLog(message);
    },
    [onLog]
  );

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings({
      format,
      quality,
      maxWidth,
      autoProcess,
      preserveFormat,
    });
  }, [format, quality, maxWidth, autoProcess, preserveFormat]);

  // Extract images from HTML
  const extractImages = useCallback(async () => {
    if (!editorRef.current) {
      log("⚠️ Редактор порожній");
      return;
    }

    if (isExtractingRef.current) {
      log("⚠️ Витягування вже виконується...");
      return;
    }

    isExtractingRef.current = true;
    setIsExtracting(true);
    log("🔍 Пошук зображень в HTML...");

    try {
      const imgElements = editorRef.current.querySelectorAll("img");

      if (imgElements.length === 0) {
        log("❌ Зображення не знайдено");
        // Clear existing images when no images found in editor
        setImages((prevImages) => {
          prevImages.forEach((img) => {
            if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
          });
          return [];
        });
        // Hide image processor panel when no images
        onVisibilityChange(false);
        isExtractingRef.current = false;
        setIsExtracting(false);
        return;
      }

      log(`✅ Знайдено ${imgElements.length} зображень`);

      const newImages: ProcessedImage[] = [];

      for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        const src = img.src;

        if (!src) continue;

        const id = `${Date.now()}-${i}`;
        const name = `image-${i + 1}`;

        newImages.push({
          id,
          src,
          previewUrl: src,
          originalSize: 0, // Will be calculated when loaded
          status: "pending" as const,
          name,
        });
      }

      setImages(newImages);
      onVisibilityChange(true);

      if (!autoProcess) {
        log("⏸️ Автообробка вимкнена. Натисніть 'Обробити все'");
      }

    } catch (error) {
      log(`❌ Помилка витягування: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      isExtractingRef.current = false;
      setIsExtracting(false);
    }
  }, [editorRef, log, autoProcess, onVisibilityChange]);

  const convertImage = useCallback(
    async (src: string): Promise<{ blob: Blob; originalSize: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            // Calculate dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            // Detect original format
            let outputFormat: ImageFormat = format;
            if (preserveFormat && img.src.startsWith("data:")) {
              const mimeMatch = img.src.match(/data:image\/(jpeg|jpg|png|webp)/i);
              if (mimeMatch) {
                const detectedFormat = mimeMatch[1].toLowerCase();
                if (detectedFormat === "jpg") {
                  outputFormat = "jpeg";
                } else if (detectedFormat === "webp" || detectedFormat === "jpeg") {
                  outputFormat = detectedFormat as ImageFormat;
                }
              }
            }

            // Fill white background for JPEG
            if (outputFormat === "jpeg") {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
            }

            // Draw and convert
            ctx.drawImage(img, 0, 0, width, height);

            // Calculate original size (approximate from data URL if present)
            let originalSize = 0;
            if (img.src.startsWith("data:")) {
              const base64 = img.src.split(",")[1];
              originalSize = Math.ceil((base64.length * 3) / 4);
            }

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({ blob, originalSize });
                } else {
                  reject(new Error("Failed to create blob"));
                }
              },
              `image/${outputFormat}`,
              quality / 100
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));

        img.src = src;
      });
    },
    [format, quality, maxWidth, preserveFormat]
  );

  const processImage = useCallback(
    async (id: string) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, status: "processing" as const } : img
        )
      );

      const image = images.find((img) => img.id === id);
      if (!image) {
        log(`⚠️ Зображення з id ${id} не знайдено в state`);
        return;
      }

      log(`🔄 Початок обробки ${image.name}...`);

      try {
        const result = await convertImage(image.src);

        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? {
                  ...img,
                  status: "done" as const,
                  convertedBlob: result.blob,
                  convertedSize: result.blob.size,
                  originalSize: result.originalSize || img.originalSize,
                }
              : img
          )
        );

        const originalSize = result.originalSize || image.originalSize;
        if (originalSize > 0) {
          const saved = ((1 - result.blob.size / originalSize) * 100).toFixed(0);
          log(`✅ ${image.name}: ${formatSize(originalSize)} → ${formatSize(result.blob.size)} (-${saved}%)`);
        } else {
          log(`✅ ${image.name}: оброблено → ${formatSize(result.blob.size)}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, status: "error" as const, error: message }
              : img
          )
        );
        log(`❌ Помилка: ${image.name}`);
      }
    },
    [images, convertImage, log]
  );

  const handleDownloadAll = useCallback(async () => {
    const completed = images.filter((img) => img.status === "done" && img.convertedBlob);

    if (completed.length === 0) {
      log("❌ Немає оброблених зображень");
      return;
    }

    log("📦 Створення ZIP архіву...");

    const zip = new JSZip();
    completed.forEach((img) => {
      const ext = format === "jpeg" ? ".jpg" : ".webp";
      const name = img.name + ext;
      zip.file(name, img.convertedBlob!);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `images-${Date.now()}.zip`);

    log(`✅ Завантажено ${completed.length} зображень`);
  }, [images, format, log]);

  const handleDownloadSingle = useCallback((id: string) => {
    const img = images.find((i) => i.id === id);

    if (!img || img.status !== "done" || !img.convertedBlob) {
      log("❌ Зображення не готове для завантаження");
      return;
    }

    const ext = format === "jpeg" ? ".jpg" : ".webp";
    const filename = `${img.name}${ext}`;
    saveAs(img.convertedBlob, filename);
    log(`✅ Завантажено: ${filename}`);
  }, [images, format, log]);

  const handleUploadToStorage = useCallback(
    async (category: string, folderName: string, customNames: Record<string, string> = {}, fileOrder?: string[]): Promise<{ results: Array<{ filename: string; url: string; success: boolean }>; category: string; folderName: string }> => {
      let completed = images.filter((img) => img.status === "done" && img.convertedBlob);

      // Sort by order if provided
      if (fileOrder && fileOrder.length > 0) {
        completed = completed.sort((a, b) => {
          const indexA = fileOrder.indexOf(a.id);
          const indexB = fileOrder.indexOf(b.id);
          return indexA - indexB;
        });
      }

      if (completed.length === 0) {
        throw new Error("Немає оброблених зображень для завантаження");
      }

      // Prevent multiple simultaneous uploads
      if (isUploading) {
        throw new Error("Завантаження вже виконується");
      }

      setIsUploading(true);
      uploadAbortControllerRef.current = new AbortController();

      log(`🚀 Початок завантаження ${completed.length} зображень на storage...`);

      const uploadedUrls: Record<string, string> = {}; // Original src -> uploaded URL
      const results: Array<{ filename: string; url: string; success: boolean }> = [];
      const errors: string[] = [];
      let successCount = 0;

      try {
        for (let i = 0; i < completed.length; i++) {
          const img = completed[i];
          const ext = format === "jpeg" ? ".jpg" : ".webp";
          // Use custom name if provided, otherwise use default name
          const baseName = customNames[img.id] || img.name;
          const filename = `${baseName}${ext}`;

          // Check if upload was cancelled
          if (uploadAbortControllerRef.current?.signal.aborted) {
            log(`⚠️ Завантаження скасовано користувачем`);
            throw new Error("Завантаження скасовано");
          }

          try {
            log(`📤 [${i + 1}/${completed.length}] Завантаження ${filename}...`);

            // Prepare file (upload blob to server) with timeout
            const formData = new FormData();
            formData.append("file", img.convertedBlob!, filename);
            formData.append("category", category);
            formData.append("folderName", folderName);

            const prepareResponse = await Promise.race([
              fetch("http://localhost:3001/api/storage-upload/prepare", {
                method: "POST",
                body: formData,
                signal: uploadAbortControllerRef.current.signal,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: сервер не відповідає (30s)")), UPLOAD_CONFIG.PREPARE_TIMEOUT)
              ),
            ]);

            if (!prepareResponse.ok) {
              const errorData = await prepareResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${prepareResponse.status}`);
            }

            const { tempPath } = await prepareResponse.json();

            // Upload to storage with longer timeout (for slow internet)
            const storageResponse = await Promise.race([
              fetch("http://localhost:3001/api/storage-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  filePath: tempPath,
                  category,
                  folderName,
                  skipConfirmation: true,
                }),
                signal: uploadAbortControllerRef.current.signal,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: storage не відповідає (180s)")), UPLOAD_CONFIG.STORAGE_TIMEOUT)
              ),
            ]);

            if (!storageResponse.ok) {
              const errorData = await storageResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Storage HTTP ${storageResponse.status}`);
            }

            const result = await storageResponse.json();
            if (result.filePath) {
              // Map original src to uploaded URL
              const fullUrl = `${STORAGE_URL_PREFIX}${result.filePath}`;
              uploadedUrls[img.src] = fullUrl;
              successCount++;
              log(`✅ [${i + 1}/${completed.length}] ${filename} → storage`);

              // Add to results
              results.push({
                filename,
                url: fullUrl,
                success: true,
              });
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";

            // Add failed result
            results.push({
              filename,
              url: "",
              success: false,
            });

            // Distinguish between network errors and other errors
            if (errorMsg.includes("Failed to fetch") || errorMsg === "Network request failed") {
              errors.push(`${filename}: Немає з'єднання з сервером`);
              log(`❌ ${filename}: Немає з'єднання з сервером`);
            } else if (errorMsg.includes("Timeout")) {
              errors.push(`${filename}: ${errorMsg}`);
              log(`❌ ${filename}: ${errorMsg}`);
            } else if (errorMsg === "Завантаження скасовано") {
              throw error; // Propagate cancellation
            } else {
              errors.push(`${filename}: ${errorMsg}`);
              log(`❌ ${filename}: ${errorMsg}`);
            }

            // Continue with next file instead of stopping everything
            continue;
          }
        }

        // Replace images in HTML editor with uploaded URLs
        if (editorRef.current && Object.keys(uploadedUrls).length > 0) {
          const imgElements = editorRef.current.querySelectorAll("img");
          imgElements.forEach((imgEl) => {
            if (uploadedUrls[imgEl.src]) {
              imgEl.src = uploadedUrls[imgEl.src];
            }
          });
          log(`🔄 Замінено ${Object.keys(uploadedUrls).length} зображень в HTML editor`);
        }

        // Save uploaded URLs for manual replacement
        if (Object.keys(uploadedUrls).length > 0) {
          setLastUploadedUrls(uploadedUrls);
        }

        // Copy all URLs to clipboard
        if (Object.keys(uploadedUrls).length > 0) {
          const urlsList = Object.values(uploadedUrls).join("\n");
          let clipboardSuccess = false;

          if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
              await navigator.clipboard.writeText(urlsList);
              clipboardSuccess = true;
            } catch (clipError) {
              // Fallback: try using execCommand
              try {
                const textArea = document.createElement("textarea");
                textArea.value = urlsList;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                clipboardSuccess = success;
              } catch (fallbackError) {
                console.warn("Fallback clipboard failed:", fallbackError);
              }
            }
          }

          if (clipboardSuccess) {
            log(`📋 URLs скопійовано в буфер`);
          } else {
            log(`📋 URLs: ${urlsList.split('\n').join(', ')}`);
          }
        }

        // Final summary
        if (successCount === completed.length) {
          log(`🎉 Успішно завантажено всі ${successCount} зображень`);
        } else if (successCount > 0) {
          log(`⚠️ Завантажено ${successCount} з ${completed.length} зображень (${errors.length} помилок)`);
        } else {
          log(`❌ Не вдалося завантажити жодного зображення`);
        }

        return { results, category, folderName };
      } finally {
        setIsUploading(false);
        uploadAbortControllerRef.current = null;
      }
    },
    [images, format, log, editorRef, isUploading]
  );

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleClear = useCallback(() => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setLastUploadedUrls({});
    onVisibilityChange(false);
    log("🗑️ Очищено");
  }, [images, log, onVisibilityChange]);

  const handleReplaceInOutput = useCallback(() => {
    if (onReplaceUrls && Object.keys(lastUploadedUrls).length > 0) {
      onReplaceUrls(lastUploadedUrls);
      setReplacementDone(true);
      log(`✅ Замінено ${Object.keys(lastUploadedUrls).length} посилань в Output`);
      setSnackbar({
        open: true,
        message: `🔄 Замінено ${Object.keys(lastUploadedUrls).length} посилань в Output HTML/MJML`,
        severity: 'success',
      });
    }
  }, [lastUploadedUrls, onReplaceUrls, log]);

  const handleProcessAll = useCallback(() => {
    const pendingImages = images.filter(img => img.status === "pending");
    if (pendingImages.length === 0) {
      log("⚠️ Всі зображення вже оброблені");
      return;
    }
    log(`🔄 Обробка ${pendingImages.length} зображень...`);
    pendingImages.forEach((img) => processImage(img.id));
  }, [images, log]);

  // Listen for extraction trigger
  useEffect(() => {
    if (triggerExtract > 0 && visible) {
      extractImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerExtract, visible]);

  // Auto-process pending images when autoProcess is enabled
  useEffect(() => {
    if (!autoProcess || images.length === 0) return;

    const pendingImages = images.filter(img => img.status === "pending");
    if (pendingImages.length > 0) {
      log(`🔄 Автообробка ${pendingImages.length} зображень...`);
      pendingImages.forEach((img) => processImage(img.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, autoProcess]);

  // Clear images when component is hidden
  useEffect(() => {
    if (!visible && images.length > 0) {
      images.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      setImages([]);
    }
  }, [visible]);

  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce(
    (sum, img) => sum + (img.convertedSize || 0),
    0
  );
  const doneCount = images.filter((img) => img.status === "done").length;
  const pendingCount = images.filter((img) => img.status === "pending").length;

  if (!visible) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: spacingMUI.base,
        borderRadius: `${componentStyles.card.borderRadius}px`,
        backgroundColor:
          componentStyles.card.background ||
          alpha(theme.palette.background.paper, 0.8),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
      }}
    >
      <Stack spacing={spacingMUI.base}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Обробка зображень
          </Typography>
          {images.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {doneCount}/{images.length} готово
            </Typography>
          )}
        </Box>

        {/* Settings Row */}
        <Stack direction="row" spacing={spacingMUI.lg} alignItems="flex-start" flexWrap="wrap">
          {/* Checkboxes */}
          <Stack spacing={spacingMUI.xs}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="caption">Автообробка</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preserveFormat}
                  onChange={(e) => setPreserveFormat(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="caption">Зберегти формат</Typography>}
            />
          </Stack>

          <Box>
            <Typography variant="caption" display="block" mb={spacingMUI.xs} color="text.secondary">
              Формат:
            </Typography>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={(_, val) => val && setFormat(val)}
              size="small"
              disabled={preserveFormat}
            >
              <ToggleButton value="jpeg">JPEG</ToggleButton>
              <ToggleButton value="webp">WebP</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={spacingMUI.xs}>
              <Typography variant="caption" color="text.secondary">
                Якість:
              </Typography>
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {quality}%
              </Typography>
            </Stack>
            <Slider
              value={quality}
              onChange={(_, val) => setQuality(val as number)}
              min={60}
              max={100}
              size="small"
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={spacingMUI.xs}>
              <Typography variant="caption" color="text.secondary">
                Макс. ширина:
              </Typography>
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {maxWidth}px
              </Typography>
            </Stack>
            <Slider
              value={maxWidth}
              onChange={(_, val) => setMaxWidth(val as number)}
              min={300}
              max={1200}
              step={100}
              size="small"
            />
          </Box>
        </Stack>

        {/* Extract Button */}
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={extractImages}
          disabled={isExtracting}
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: `${borderRadius.md}px`,
          }}
        >
          {isExtracting ? "Витягування..." : "Витягти зображення з HTML"}
        </Button>

        {/* Images List */}
        {images.length > 0 && (
          <Box>
            <Stack direction="row" spacing={spacingMUI.sm} sx={{ overflowX: "auto", pb: spacingMUI.xs }}>
              {images.map((img) => (
                <Box
                  key={img.id}
                  sx={{
                    position: "relative",
                    minWidth: 80,
                    maxWidth: 80,
                    height: 80,
                    borderRadius: `${borderRadius.sm}px`,
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <img
                    src={img.previewUrl}
                    alt={img.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {img.status === "processing" && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: alpha(theme.palette.background.default, 0.8),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LinearProgress sx={{ width: "80%" }} />
                    </Box>
                  )}
                  {img.status === "done" && (
                    <Tooltip title="Завантажити">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadSingle(img.id)}
                        sx={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          backgroundColor: alpha(theme.palette.success.main, 0.9),
                          color: "white",
                          width: 20,
                          height: 20,
                          "&:hover": {
                            backgroundColor: theme.palette.success.main,
                          },
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Видалити">
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(img.id)}
                      sx={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        backgroundColor: alpha(theme.palette.error.main, 0.8),
                        color: "white",
                        width: 20,
                        height: 20,
                        "&:hover": {
                          backgroundColor: theme.palette.error.main,
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>

            {/* Stats */}
            {doneCount > 0 && (
              <Box
                sx={{
                  mt: spacingMUI.sm,
                  p: spacingMUI.sm,
                  borderRadius: `${borderRadius.sm}px`,
                  backgroundColor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  💾 {formatSize(totalOriginal)} → {formatSize(totalConverted)} (
                  {totalOriginal > 0
                    ? `-${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%`
                    : "0%"}
                  )
                </Typography>
              </Box>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={spacingMUI.sm} mt={spacingMUI.sm}>
              {pendingCount > 0 && !autoProcess && (
                <Button
                  variant="outlined"
                  startIcon={<ProcessIcon />}
                  onClick={handleProcessAll}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: `${borderRadius.md}px`,
                  }}
                >
                  Обробити все ({pendingCount})
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
                disabled={doneCount === 0}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${borderRadius.md}px`,
                }}
              >
                Upload to Storage ({doneCount})
              </Button>
              {Object.keys(lastUploadedUrls).length > 0 && (
                <Tooltip
                  title={
                    !hasOutput
                      ? "Спочатку експортуйте HTML або MJML"
                      : replacementDone
                        ? "URLs вже замінені в Output"
                        : "Замінити зображення на storage URLs"
                  }
                  arrow
                >
                  <span style={{ width: '100%' }}>
                    <Button
                      variant={replacementDone ? "contained" : "outlined"}
                      color={replacementDone ? "success" : "secondary"}
                      startIcon={replacementDone ? <CheckIcon /> : <ReplaceIcon />}
                      onClick={handleReplaceInOutput}
                      disabled={replacementDone || !hasOutput}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: `${borderRadius.md}px`,
                      }}
                    >
                      {replacementDone
                        ? `✓ Замінено в Output (${Object.keys(lastUploadedUrls).length})`
                        : `Замінити в Output (${Object.keys(lastUploadedUrls).length})`
                      }
                    </Button>
                  </span>
                </Tooltip>
              )}
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
                disabled={doneCount === 0}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${borderRadius.md}px`,
                }}
              >
                Завантажити ZIP ({doneCount})
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${borderRadius.md}px`,
                }}
              >
                Очистити
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>

      <StorageUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        files={images
          .filter((img) => img.status === "done")
          .map((img) => ({ id: img.id, name: img.name, path: img.previewUrl }))}
        onUpload={handleUploadToStorage}
        onCancel={() => {
          if (uploadAbortControllerRef.current) {
            uploadAbortControllerRef.current.abort();
            log("⚠️ Завантаження скасовано користувачем");
          }
        }}
        initialFolderName={initialFolderName}
        onHistoryAdd={onHistoryAdd}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={UI_TIMINGS.SNACKBAR_DURATION}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
