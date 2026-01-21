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
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PlayArrow as ProcessIcon,
} from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, spacingMUI } from "../theme/tokens";

type ImageFormat = "jpeg" | "webp";

interface ProcessedImage {
  id: string;
  src: string;
  previewUrl: string;
  convertedBlob?: Blob;
  originalSize: number;
  convertedSize?: number;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  name: string;
}

interface ImageProcessorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  triggerExtract?: number;
}

const HTML_CONVERTER_STORAGE_KEY = "html-converter-image-settings";

interface HtmlConverterImageSettings {
  format: ImageFormat;
  quality: number;
  maxWidth: number;
  autoProcess: boolean;
  preserveFormat: boolean;
}

function loadSettings(): HtmlConverterImageSettings {
  try {
    const stored = localStorage.getItem(HTML_CONVERTER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load HTML converter settings:", error);
  }
  return {
    format: "jpeg",
    quality: 82,
    maxWidth: 600,
    autoProcess: true,
    preserveFormat: false,
  };
}

function saveSettings(settings: HtmlConverterImageSettings) {
  try {
    localStorage.setItem(HTML_CONVERTER_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save HTML converter settings:", error);
  }
}

export default function ImageProcessor({
  editorRef,
  onLog,
  visible,
  onVisibilityChange,
  triggerExtract = 0
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

    setIsExtracting(true);
    log("🔍 Пошук зображень в HTML...");

    try {
      const imgElements = editorRef.current.querySelectorAll("img");

      if (imgElements.length === 0) {
        log("❌ Зображення не знайдено");
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
      const name = img.name.replace(/^image-/, "img-") + ext;
      zip.file(name, img.convertedBlob!);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `images-${Date.now()}.zip`);

    log(`✅ Завантажено ${completed.length} зображень`);
  }, [images, format, log]);

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
    onVisibilityChange(false);
    log("🗑️ Очищено");
  }, [images, log, onVisibilityChange]);

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
    if (triggerExtract > 0 && visible && images.length === 0) {
      extractImages();
    }
  }, [triggerExtract, visible, images.length, extractImages]);

  // Auto-process pending images when autoProcess is enabled
  useEffect(() => {
    if (!autoProcess || images.length === 0) return;

    const pendingImages = images.filter(img => img.status === "pending");
    if (pendingImages.length > 0) {
      log(`🔄 Автообробка ${pendingImages.length} зображень...`);
      pendingImages.forEach((img) => processImage(img.id));
    }
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

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
  };

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
                    <Box
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        backgroundColor: alpha(theme.palette.success.main, 0.9),
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                      }}
                    >
                      ✓
                    </Box>
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
                >
                  Обробити все ({pendingCount})
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
                disabled={doneCount === 0}
                fullWidth
              >
                Завантажити ZIP ({doneCount})
              </Button>
              <Button variant="outlined" onClick={handleClear}>
                Очистити
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
