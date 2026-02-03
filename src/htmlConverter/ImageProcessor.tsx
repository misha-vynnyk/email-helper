/**
 * Compact Image Processor for HTML Converter
 * Extracts and processes images from HTML content
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
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
  PlayArrow as ProcessIcon,
  CloudUpload as UploadIcon,
  FindReplace as ReplaceIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { saveAs } from "file-saver";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, spacingMUI } from "../theme/tokens";
import StorageUploadDialog from "./StorageUploadDialog";
import { formatSize, extractFolderName } from "./utils/formatters";
import { copyToClipboard } from "./utils/clipboard";
import { isSignatureImageAlt } from "./imageUtils";
import {
  STORAGE_KEYS,
  UI_TIMINGS,
  UPLOAD_CONFIG,
  IMAGE_DEFAULTS,
  STORAGE_URL_PREFIX,
  STORAGE_PROVIDERS_CONFIG,
} from "./constants";
import type {
  ImageAnalysisSettings,
  ProcessedImage,
  ImageFormat,
  ImageFormatOverride,
  ImageSettings,
} from "./types";
import API_URL, { isApiAvailable } from "../config/api";

const isCrossOrigin = (src: string): boolean => {
  try {
    if (src.startsWith("data:") || src.startsWith("blob:")) return false;
    return new URL(src, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

// Utility function to detect transparency in image
const detectTransparency = async (src: string): Promise<boolean> => {
  try {
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      // локальні до сторінки — перевіряємо як завжди
    } else {
      const urlOrigin = new URL(src, window.location.href).origin;
      if (urlOrigin !== window.location.origin) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if any pixel has alpha < 255 (transparent)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      } catch (error) {
        // If error (e.g., CORS), assume no transparency
        resolve(false);
      }
    };

    img.onerror = () => resolve(false);
    img.src = src;
  });
};

// Get final format for image based on override and auto-detection
const getImageFormat = (image: ProcessedImage, globalFormat: ImageFormat): ImageFormat => {
  // If manual override is set (not "auto"), use it
  if (image.formatOverride && image.formatOverride !== "auto") {
    return image.formatOverride;
  }

  // Auto-detection: if has transparency, use PNG
  if (image.hasTransparency) {
    return "png";
  }

  // Otherwise use global format
  return globalFormat;
};

const EXT_BY_FORMAT: Record<ImageFormat, string> = { jpeg: ".jpg", png: ".png" };
const getFileExtension = (f: ImageFormat) => EXT_BY_FORMAT[f] ?? ".jpg";

interface ImageProcessorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  triggerExtract?: number;
  fileName?: string;
  onHistoryAdd?: (
    category: string,
    folderName: string,
    results: Array<{ filename: string; url: string; success: boolean }>
  ) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onUploadedUrlsChange?: (urlMap: Record<string, string>) => void;
  onResetReplacement?: (resetFn: () => void) => void;
  hasOutput?: boolean;
  autoProcess?: boolean;
  storageProvider?: "default" | "alphaone";
  imageAnalysisSettings?: ImageAnalysisSettings;
}

function loadSettings(): ImageSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Silently fallback to defaults if settings can't be loaded
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
    // Silently ignore if settings can't be saved (e.g., quota exceeded)
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
  onUploadedUrlsChange,
  onResetReplacement,
  hasOutput = false,
  autoProcess: autoProcessProp,
  storageProvider = "default",
  imageAnalysisSettings,
}: ImageProcessorProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  const [images, setImages] = useState<ProcessedImage[]>([]);
  const savedSettings = loadSettings();
  const [format] = useState<ImageFormat>(savedSettings.format);
  const [quality, setQuality] = useState(savedSettings.quality);
  const [maxWidth, setMaxWidth] = useState(savedSettings.maxWidth);
  const [autoProcess, setAutoProcess] = useState(autoProcessProp ?? savedSettings.autoProcess);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const convertAbortControllerRef = useRef<AbortController | null>(null);
  const isExtractingRef = useRef(false);
  const [lastUploadedUrls, setLastUploadedUrls] = useState<Record<string, string>>({});
  // Prevent applying "old" uploaded URLs to a new editor/output state
  const [imagesSessionId, setImagesSessionId] = useState(0);
  const [lastUploadedSessionId, setLastUploadedSessionId] = useState<number | null>(null);
  const [replacementDone, setReplacementDone] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "info" | "warning" | "error" = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const clearImagesAndRevoke = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  }, []);

  const initialFolderName = extractFolderName(fileName);

  // Register reset function with parent
  useEffect(() => {
    if (onResetReplacement) {
      onResetReplacement(() => setReplacementDone(false));
    }
  }, [onResetReplacement]);

  // New document/template => old uploaded URLs must not be applicable
  useEffect(() => {
    setImagesSessionId((s) => s + 1);
    setLastUploadedSessionId(null);
    setLastUploadedUrls({});
    onUploadedUrlsChange?.({});
    setReplacementDone(false);
  }, [fileName, onUploadedUrlsChange]);

  const log = useCallback(
    (message: string) => {
      if (onLog) onLog(message);
    },
    [onLog]
  );

  const isAbortError = (e: unknown): boolean => {
    return (
      (e instanceof DOMException && e.name === "AbortError") ||
      (typeof e === "object" &&
        e !== null &&
        "name" in e &&
        (e as { name?: unknown }).name === "AbortError")
    );
  };

  const abortConversions = useCallback(() => {
    if (convertAbortControllerRef.current) {
      convertAbortControllerRef.current.abort();
      convertAbortControllerRef.current = null;
    }
  }, []);

  const abortUploads = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      // Prevent setState after unmount + stop network activity
      abortConversions();
      abortUploads();
    };
  }, [abortConversions, abortUploads]);

  // Sync autoProcess with prop if provided
  useEffect(() => {
    if (autoProcessProp !== undefined && autoProcessProp !== autoProcess) {
      setAutoProcess(autoProcessProp);
    }
  }, [autoProcessProp, autoProcess]);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings({
      format,
      quality,
      maxWidth,
      autoProcess,
      preserveFormat: IMAGE_DEFAULTS.PRESERVE_FORMAT,
    });
  }, [format, quality, maxWidth, autoProcess]);

  // Re-process when quality/maxWidth changes so slider actually affects output
  useEffect(() => {
    // Cancel in-flight conversions; they are now stale for the new settings.
    abortConversions();
    setImages((prev) => {
      const hasProcessed = prev.some((img) => img.status === "done" || img.status === "error");
      if (!hasProcessed) return prev;
      return prev.map((img) =>
        img.status === "done" || img.status === "error"
          ? {
              ...img,
              status: "pending" as const,
              convertedBlob: undefined,
              convertedSize: undefined,
              error: undefined,
            }
          : img
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, maxWidth, abortConversions]);

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

    try {
      // New extraction invalidates previous conversion requests
      abortConversions();

      // New extraction => previous upload mapping is unsafe
      setImagesSessionId((s) => s + 1);
      setLastUploadedSessionId(null);
      setLastUploadedUrls({});
      onUploadedUrlsChange?.({});
      setReplacementDone(false);

      const imgElements = editorRef.current.querySelectorAll("img");

      if (imgElements.length === 0) {
        log("❌ Зображення не знайдено");
        clearImagesAndRevoke();
        onVisibilityChange(false);
        isExtractingRef.current = false;
        return;
      }

      const eligible = Array.from(imgElements).filter(
        (img) => img.src && !isSignatureImageAlt(img.getAttribute("alt"))
      );

      if (eligible.length === 0) {
        log("✅ Зображень не знайдено (тільки підписи або порожні)");
        clearImagesAndRevoke();
        onVisibilityChange(false);
        isExtractingRef.current = false;
        return;
      }

      log(
        `✅ Знайдено ${eligible.length} зображень` +
          (eligible.length < imgElements.length
            ? ` (пропущено ${imgElements.length - eligible.length} підписів)`
            : "")
      );

      const newImages: ProcessedImage[] = [];

      for (let i = 0; i < eligible.length; i++) {
        const img = eligible[i];
        const src = img.src;

        const id = `${Date.now()}-${i}`;
        const name = `image-${i + 1}`;

        const hasTransparency = await detectTransparency(src);

        newImages.push({
          id,
          src,
          previewUrl: src,
          originalSize: 0,
          status: "pending" as const,
          name,
          hasTransparency,
          formatOverride: "auto",
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
    }
  }, [editorRef, log, autoProcess, onVisibilityChange, clearImagesAndRevoke]);

  const convertImage = useCallback(
    async (
      src: string,
      targetFormat: ImageFormat,
      opts: { quality: number; maxWidth: number },
      signal?: AbortSignal
    ): Promise<{ blob: Blob; originalSize: number }> => {
      const { quality: q, maxWidth: mw } = opts;
      const isCrossOriginUrl = isCrossOrigin(src);

      if (isCrossOriginUrl && isApiAvailable()) {
        const convertRes = await fetch(`${API_URL}/api/image-converter/convert-from-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            url: src,
            format: targetFormat,
            quality: q,
            preset: mw,
            resizeMode: "preset",
            preserveAspectRatio: "true",
            compressionMode: "balanced",
          }),
        });
        if (convertRes.ok) {
          const originalSizeHeader = convertRes.headers.get("x-original-size");
          const originalSize = originalSizeHeader ? Number(originalSizeHeader) : 0;
          const blob = await convertRes.blob();
          return { blob, originalSize: Number.isFinite(originalSize) ? originalSize : 0 };
        }
        const errData = await convertRes.json().catch(() => ({}));
        throw new Error(errData.error || `convert-from-url: ${convertRes.status}`);
      }
      if (isCrossOriginUrl) {
        throw new Error(
          "Зображення з іншого домену: потрібен backend (npm run dev) для конвертації, або вставте як data URL."
        );
      }

      // For PNG, use server-side conversion to properly handle compression
      if (targetFormat === "png") {
        try {
          const response = await fetch(src, { signal });
          if (!response.ok) throw new Error("Failed to fetch image");

          const originalBlob = await response.blob();
          const originalSize = originalBlob.size;
          const file = new File([originalBlob], "image.png", { type: "image/png" });

          const formData = new FormData();
          formData.append("image", file);
          formData.append("format", "png");
          formData.append("quality", q.toString());
          formData.append("resizeMode", "preset");
          formData.append("preset", mw.toString());
          formData.append("preserveAspectRatio", "true");
          formData.append("compressionMode", "balanced");

          if (!isApiAvailable()) {
            throw new Error(
              "Backend server is not available. Please configure VITE_API_URL environment variable."
            );
          }

          const convertResponse = await fetch(`${API_URL}/api/image-converter/convert`, {
            method: "POST",
            body: formData,
            signal,
          });

          if (!convertResponse.ok) {
            const errorData = await convertResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "Server conversion failed");
          }

          const optimizedBlob = await convertResponse.blob();
          return { blob: optimizedBlob, originalSize };
        } catch (error) {
          // Fallback to client-side conversion if server fails
        }
      }

      // Client-side conversion for JPEG or PNG fallback
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            if (signal?.aborted) {
              reject(new DOMException("Aborted", "AbortError"));
              return;
            }
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            let width = img.width;
            let height = img.height;
            const maxDim = Math.max(width, height);
            if (maxDim > mw) {
              const scale = mw / maxDim;
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }

            canvas.width = width;
            canvas.height = height;

            const outputFormat: ImageFormat = targetFormat;

            if (outputFormat === "jpeg") {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
            } else {
              ctx.clearRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            let originalSize = 0;
            if (img.src.startsWith("data:")) {
              const base64 = img.src.split(",")[1];
              originalSize = base64 ? Math.ceil((base64.length * 3) / 4) : 0;
            }

            canvas.toBlob(
              (blob) => {
                if (signal?.aborted) {
                  reject(new DOMException("Aborted", "AbortError"));
                  return;
                }
                if (blob) resolve({ blob, originalSize });
                else reject(new Error("Failed to create blob"));
              },
              `image/${outputFormat}`,
              q / 100
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          reject(new Error("Failed to load image"));
        };
        img.src = src;
      });
    },
    []
  );

  const processImage = useCallback(
    async (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) {
        log(`⚠️ Зображення з id ${id} не знайдено в state`);
        return;
      }

      // Ensure there is an active controller for in-flight conversions
      if (!convertAbortControllerRef.current || convertAbortControllerRef.current.signal.aborted) {
        convertAbortControllerRef.current = new AbortController();
      }
      const signal = convertAbortControllerRef.current.signal;

      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, status: "processing" as const } : img))
      );

      // Determine format for this specific image
      const imageFormat = getImageFormat(image, format);

      try {
        const result = await convertImage(image.src, imageFormat, { quality, maxWidth }, signal);
        const originalSize = result.originalSize || image.originalSize;

        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? {
                  ...img,
                  status: "done" as const,
                  convertedBlob: result.blob,
                  convertedSize: result.blob.size,
                  originalSize,
                }
              : img
          )
        );

        if (originalSize > 0) {
          const saved = ((1 - result.blob.size / originalSize) * 100).toFixed(0);
          log(
            `✅ ${image.name}: ${formatSize(originalSize)} → ${formatSize(result.blob.size)} (-${saved}%)`
          );
        } else {
          log(`✅ ${image.name}: оброблено → ${formatSize(result.blob.size)}`);
        }
      } catch (error) {
        if (isAbortError(error)) {
          // Silent cancel: keep as pending (no error spam) so user can restart.
          setImages((prev) =>
            prev.map((img) =>
              img.id === id
                ? {
                    ...img,
                    status: "pending" as const,
                    convertedBlob: undefined,
                    convertedSize: undefined,
                    error: undefined,
                  }
                : img
            )
          );
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, status: "error" as const, error: message } : img
          )
        );
        log(`❌ Помилка: ${image.name}`);
      }
    },
    [images, format, convertImage, log, quality, maxWidth]
  );

  const handleDownloadSingle = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);

      if (!img || img.status !== "done" || !img.convertedBlob) {
        log("❌ Зображення не готове для завантаження");
        return;
      }

      const imageFormat = getImageFormat(img, format);
      const ext = getFileExtension(imageFormat);
      const filename = `${img.name}${ext}`;
      saveAs(img.convertedBlob, filename);
      log(`✅ Завантажено: ${filename}`);
    },
    [images, format, log]
  );

  const handleUploadToStorage = useCallback(
    async (
      category: string,
      folderName: string,
      customNames: Record<string, string> = {},
      fileOrder?: string[]
    ): Promise<{
      results: Array<{ filename: string; url: string; success: boolean; error?: string }>;
      category: string;
      folderName: string;
    }> => {
      let completed = images.filter(
        (img) =>
          (img.status === "done" && img.convertedBlob) ||
          (img.status === "pending" && isCrossOrigin(img.src))
      );

      // Sort by order if provided
      if (fileOrder && fileOrder.length > 0) {
        completed = completed.sort((a, b) => {
          const indexA = fileOrder.indexOf(a.id);
          const indexB = fileOrder.indexOf(b.id);
          return indexA - indexB;
        });
      }

      if (completed.length === 0) {
        throw new Error("Немає зображень для завантаження (оброблені з blob або cross-origin URL)");
      }

      if (!isApiAvailable()) {
        throw new Error(
          "Для завантаження на storage потрібен backend.\n\nЗапустіть: npm run dev\nабо налаштуйте VITE_API_URL на існуючий backend."
        );
      }

      // Prevent multiple simultaneous uploads
      if (isUploading) {
        throw new Error("Завантаження вже виконується");
      }

      // Starting a new upload invalidates any previous "replace in output" action
      // until we get a fresh mapping for the current extracted images session.
      const sessionIdAtStart = imagesSessionId;
      setLastUploadedSessionId(null);
      setLastUploadedUrls({});
      setReplacementDone(false);
      onUploadedUrlsChange?.({});

      setIsUploading(true);
      uploadAbortControllerRef.current = new AbortController();

      log(`🚀 Початок завантаження ${completed.length} зображень на storage...`);

      const uploadedUrls: Record<string, string> = {};
      const results: Array<{ filename: string; url: string; success: boolean; error?: string }> =
        [];
      let successCount = 0;

      const fatalError = (message: string) => {
        const err = new Error(message) as Error & { fatal?: boolean };
        err.fatal = true;
        return err;
      };

      const prepareTimeout = () =>
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: сервер не відповідає (30s)")),
            UPLOAD_CONFIG.PREPARE_TIMEOUT
          )
        );

      const getTempPath = async (image: ProcessedImage, fname: string): Promise<string> => {
        const signal = uploadAbortControllerRef.current?.signal;
        if (image.convertedBlob) {
          const formData = new FormData();
          formData.append("file", image.convertedBlob, fname);
          formData.append("category", category);
          formData.append("folderName", folderName);
          const res = await Promise.race([
            fetch(`${API_URL}/api/storage-upload/prepare`, {
              method: "POST",
              body: formData,
              signal,
            }),
            prepareTimeout(),
          ]);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          return data.tempPath;
        }
        const res = await Promise.race([
          fetch(`${API_URL}/api/storage-upload/prepare-from-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: image.src, filename: fname }),
            signal,
          }),
          prepareTimeout(),
        ]);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `prepare-from-url: ${res.status}`);
        }
        const data = await res.json();
        return data.tempPath;
      };

      try {
        for (let i = 0; i < completed.length; i++) {
          const img = completed[i];
          const baseName = customNames[img.id] || img.name;
          const imageFormat = img.convertedBlob ? getImageFormat(img, format) : "png";
          const ext = img.convertedBlob
            ? getFileExtension(imageFormat)
            : `.${/\.(png|jpe?g|webp|gif)(?=\?|$)/i.exec(img.src)?.[1] || "png"}`;
          const filename = `${baseName}${ext}`;

          // Check if upload was cancelled
          if (uploadAbortControllerRef.current?.signal.aborted) {
            log(`⚠️ Завантаження скасовано користувачем`);
            throw new Error("Завантаження скасовано");
          }

          try {
            log(`📤 [${i + 1}/${completed.length}] Завантаження ${filename}...`);

            const tempPath = await getTempPath(img, filename);

            // Upload to storage with longer timeout (for slow internet)
            const storageResponse = await Promise.race([
              fetch(`${API_URL}/api/storage-upload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  filePath: tempPath,
                  provider: storageProvider,
                  category,
                  folderName,
                  skipConfirmation: true,
                }),
                signal: uploadAbortControllerRef.current.signal,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Timeout: storage не відповідає (180s)")),
                  UPLOAD_CONFIG.STORAGE_TIMEOUT
                )
              ),
            ]);

            if (!storageResponse.ok) {
              const errorData = await storageResponse.json().catch(() => ({}));
              const msg = errorData.error || `Storage HTTP ${storageResponse.status}`;
              if (storageResponse.status === 401 || storageResponse.status === 499) {
                throw fatalError(msg);
              }
              throw new Error(msg);
            }

            const result = await storageResponse.json();
            if (result.filePath) {
              // Map original src to uploaded URL
              const fullUrl = result.publicUrl || `${STORAGE_URL_PREFIX}${result.filePath}`;
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

            if ((error as { fatal?: boolean } | null)?.fatal) {
              throw error;
            }

            // Add failed result
            results.push({
              filename,
              url: "",
              success: false,
              error:
                errorMsg.includes("Failed to fetch") || errorMsg === "Network request failed"
                  ? "Немає з'єднання з сервером"
                  : errorMsg,
            });

            // Distinguish between network errors and other errors
            if (errorMsg === "Завантаження скасовано") {
              throw error;
            }

            const displayMsg =
              errorMsg.includes("Failed to fetch") || errorMsg === "Network request failed"
                ? "Немає з'єднання з сервером"
                : errorMsg;

            log(`❌ ${filename}: ${displayMsg}`);

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

        // Save uploaded URLs for manual replacement and copy to clipboard
        if (Object.keys(uploadedUrls).length > 0) {
          setLastUploadedUrls(uploadedUrls);
          setLastUploadedSessionId(sessionIdAtStart);
          setReplacementDone(false);
          onUploadedUrlsChange?.(uploadedUrls);
          const urlsList = Object.values(uploadedUrls).join("\n");
          const ok = await copyToClipboard(urlsList);
          log(ok ? "📋 URLs скопійовано в буфер" : `📋 URLs: ${urlsList.split("\n").join(", ")}`);
        }

        const providerCfg =
          STORAGE_PROVIDERS_CONFIG.providers[storageProvider] ||
          STORAGE_PROVIDERS_CONFIG.providers.default;

        // Final summary
        const errorCount = results.filter((r) => !r.success).length;
        if (successCount === completed.length) {
          log(`🎉 Успішно завантажено всі ${successCount} зображень`);

          // Close Brave tab once after full batch success
          if (providerCfg.closeTabAfterBatch && !uploadAbortControllerRef.current?.signal.aborted) {
            try {
              const finalizeRes = await Promise.race([
                fetch(`${API_URL}/api/storage-upload/finalize`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ provider: storageProvider }),
                  signal: uploadAbortControllerRef.current?.signal,
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Timeout: finalize (10s)")), 10000)
                ),
              ]);
              if (!finalizeRes.ok) {
                const err = await finalizeRes.json().catch(() => ({}));
                log(`⚠️ finalize: ${err.error || `HTTP ${finalizeRes.status}`}`);
              }
            } catch (e) {
              log(`⚠️ finalize: ${e instanceof Error ? e.message : "failed"}`);
            }
          }
        } else if (successCount > 0) {
          log(
            `⚠️ Завантажено ${successCount} з ${completed.length} зображень (${errorCount} помилок)`
          );
        } else {
          log(`❌ Не вдалося завантажити жодного зображення`);
        }

        return { results, category, folderName };
      } finally {
        setIsUploading(false);
        uploadAbortControllerRef.current = null;
      }
    },
    [images, format, log, editorRef, isUploading, storageProvider, imagesSessionId]
  );

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleFormatChange = useCallback((id: string, newFormat: ImageFormatOverride) => {
    setImages((prev) => {
      return prev.map((img) =>
        img.id === id
          ? {
              ...img,
              formatOverride: newFormat,
              status: "pending" as const,
              convertedBlob: undefined,
              convertedSize: undefined,
            }
          : img
      );
    });
  }, []);

  const handleClear = useCallback(() => {
    abortConversions();
    abortUploads();
    clearImagesAndRevoke();
    setLastUploadedUrls({});
    setLastUploadedSessionId(null);
    setReplacementDone(false);
    setImagesSessionId((s) => s + 1);
    onUploadedUrlsChange?.({});
    onVisibilityChange(false);
    log("🗑️ Очищено");
  }, [abortConversions, abortUploads, clearImagesAndRevoke, log, onVisibilityChange, onUploadedUrlsChange]);

  const handleReplaceInOutput = useCallback(() => {
    if (isUploading) {
      showSnackbar("⏳ Дочекайтесь завершення завантаження на storage", "info");
      return;
    }

    if (lastUploadedSessionId !== imagesSessionId) {
      showSnackbar(
        "⚠️ Немає актуальних URLs для поточного контенту. Спочатку зробіть Upload.",
        "warning"
      );
      return;
    }

    const n = Object.keys(lastUploadedUrls).length;
    if (onReplaceUrls && n > 0) {
      onReplaceUrls(lastUploadedUrls);
      setReplacementDone(true);
      log(`✅ Замінено ${n} посилань в Output`);
      showSnackbar(`🔄 Замінено ${n} посилань в Output HTML/MJML`, "success");
    }
  }, [
    isUploading,
    lastUploadedSessionId,
    imagesSessionId,
    lastUploadedUrls,
    onReplaceUrls,
    log,
    showSnackbar,
  ]);

  const handleProcessAll = useCallback(() => {
    const pendingImages = images.filter((img) => img.status === "pending");
    if (pendingImages.length === 0) {
      log("⚠️ Всі зображення вже оброблені");
      return;
    }
    pendingImages.forEach((img) => processImage(img.id));
  }, [images, log, processImage]);

  // Listen for extraction trigger
  useEffect(() => {
    if (triggerExtract > 0 && visible) {
      extractImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerExtract, visible]);

  useEffect(() => {
    if (!autoProcess || images.length === 0) return;

    const pendingImages = images.filter((img) => img.status === "pending");
    if (pendingImages.length > 0) {
      pendingImages.forEach((img) => processImage(img.id));
    }
  }, [images, autoProcess, processImage]);

  useEffect(() => {
    if (!visible && images.length > 0) {
      clearImagesAndRevoke();
    }
  }, [visible, images.length, clearImagesAndRevoke]);

  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
  const uploadable = (img: ProcessedImage) =>
    (img.status === "done" && img.convertedBlob) ||
    (img.status === "pending" && isCrossOrigin(img.src));
  const doneCount = images.filter(uploadable).length;
  const pendingCount = images.filter((img) => img.status === "pending").length;
  const currentUploadedUrls =
    lastUploadedSessionId === imagesSessionId ? lastUploadedUrls : ({} as Record<string, string>);
  const lastUploadedCount = Object.keys(currentUploadedUrls).length;

  const actionButtonSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    borderRadius: `${borderRadius.md}px`,
  };

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
          componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
      }}
    >
      <Stack spacing={spacingMUI.base}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography
            variant='subtitle2'
            fontWeight={600}
          >
            Обробка зображень
          </Typography>
          {images.length > 0 && (
            <Typography
              variant='caption'
              color='text.secondary'
            >
              {doneCount}/{images.length} готово
            </Typography>
          )}
        </Box>

        {/* Settings Row */}
        <Stack
          direction='row'
          spacing={spacingMUI.lg}
          alignItems='flex-start'
          flexWrap='wrap'
        >
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              mb={spacingMUI.xs}
            >
              <Typography
                variant='caption'
                color='text.secondary'
              >
                Якість:
              </Typography>
              <Typography
                variant='caption'
                fontWeight={600}
                color='primary.main'
              >
                {quality}%
              </Typography>
            </Stack>
            <Slider
              value={quality}
              onChange={(_, val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (typeof v === "number") setQuality(v);
              }}
              min={60}
              max={100}
              size='small'
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              mb={spacingMUI.xs}
            >
              <Typography
                variant='caption'
                color='text.secondary'
              >
                Макс. ширина:
              </Typography>
              <Typography
                variant='caption'
                fontWeight={600}
                color='primary.main'
              >
                {maxWidth}px
              </Typography>
            </Stack>
            <Slider
              value={maxWidth}
              onChange={(_, val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (typeof v === "number") setMaxWidth(v);
              }}
              min={300}
              max={1200}
              step={100}
              size='small'
            />
          </Box>
        </Stack>

        {/* Images List */}
        {images.length > 0 && (
          <Box>
            <Stack
              direction='row'
              spacing={spacingMUI.sm}
              sx={{ overflowX: "auto", pb: spacingMUI.xs }}
            >
              {images.map((img) => {
                const imgFormat = getImageFormat(img, format);

                // Distinct colors by output format (updates when user changes format)
                const badgeBg =
                  imgFormat === "png" ? theme.palette.success.main : theme.palette.warning.dark;

                return (
                  <Stack
                    key={img.id}
                    spacing={0.5}
                    alignItems='center'
                  >
                    <Box
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

                      {/* Format Badge — color by imgFormat so it updates on toggle */}
                      <Chip
                        key={`${img.id}-${imgFormat}`}
                        label={imgFormat.toUpperCase()}
                        size='small'
                        sx={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          height: 16,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          backgroundColor: badgeBg,
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.4)",
                          "& .MuiChip-label": { px: 0.5 },
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
                        <Tooltip title='Завантажити'>
                          <IconButton
                            size='small'
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
                      <Tooltip title='Видалити'>
                        <IconButton
                          size='small'
                          onClick={() => handleRemove(img.id)}
                          sx={{
                            position: "absolute",
                            bottom: 2,
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

                    {/* Format Selector */}
                    <ToggleButtonGroup
                      value={img.formatOverride || "auto"}
                      exclusive
                      onChange={(_, val) =>
                        val && handleFormatChange(img.id, val as ImageFormatOverride)
                      }
                      size='small'
                      sx={{
                        height: 20,
                        "& .MuiToggleButton-root": {
                          fontSize: "0.65rem",
                          px: 0.5,
                          py: 0.25,
                          minWidth: 28,
                          lineHeight: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        },
                      }}
                    >
                      <ToggleButton value='auto'>
                        <Tooltip title='Авто (прозорість → PNG)'>
                          <span>Auto</span>
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value='jpeg'>JPG</ToggleButton>
                      <ToggleButton value='png'>PNG</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                );
              })}
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
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  💾 {formatSize(totalOriginal)} → {formatSize(totalConverted)} (
                  {totalOriginal > 0
                    ? `-${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%`
                    : "0%"}
                  )
                </Typography>
              </Box>
            )}

            {/* Actions */}
            <Stack
              direction='row'
              spacing={spacingMUI.sm}
              mt={spacingMUI.sm}
            >
              {pendingCount > 0 && !autoProcess && (
                <Button
                  variant='outlined'
                  startIcon={<ProcessIcon />}
                  onClick={handleProcessAll}
                  fullWidth
                  sx={actionButtonSx}
                >
                  Обробити все ({pendingCount})
                </Button>
              )}
              <Button
                variant='contained'
                color='primary'
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
                disabled={doneCount === 0}
                fullWidth
                sx={actionButtonSx}
              >
                Upload to Storage ({doneCount})
              </Button>
              {lastUploadedCount > 0 && (
                <Tooltip
                  title={
                    !hasOutput
                      ? "Спочатку експортуйте HTML або MJML"
                      : isUploading
                        ? "Йде завантаження на storage — заміну буде доступно після завершення"
                        : replacementDone
                          ? "URLs вже замінені в Output"
                          : "Замінити зображення на storage URLs"
                  }
                  arrow
                >
                  <span style={{ width: "100%" }}>
                    <Button
                      variant={replacementDone ? "contained" : "outlined"}
                      color={replacementDone ? "success" : "secondary"}
                      startIcon={replacementDone ? <CheckIcon /> : <ReplaceIcon />}
                      onClick={handleReplaceInOutput}
                      disabled={replacementDone || !hasOutput || isUploading}
                      fullWidth
                      sx={actionButtonSx}
                    >
                      {replacementDone
                        ? `✓ Замінено в Output (${lastUploadedCount})`
                        : `Замінити в Output (${lastUploadedCount})`}
                    </Button>
                  </span>
                </Tooltip>
              )}

              <Button
                variant='outlined'
                onClick={handleClear}
                sx={actionButtonSx}
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
        storageProvider={storageProvider}
        files={images
          .filter(uploadable)
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
        imageAnalysisSettings={imageAnalysisSettings}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={UI_TIMINGS.SNACKBAR_DURATION}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
