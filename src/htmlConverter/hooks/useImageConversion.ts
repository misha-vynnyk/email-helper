import { useState, useCallback, useEffect, useRef } from "react";
import { STORAGE_KEYS, IMAGE_DEFAULTS } from "../constants";
import type { ProcessedImage, ImageFormat, ImageSettings } from "../types";
import { isCrossOrigin, detectTransparency, getImageFormat, isSignatureImageAlt } from "../imageUtils";
import API_URL, { isApiAvailable } from "../../config/api";

export interface UseImageConversionProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  onVisibilityChange: (visible: boolean) => void;
  autoProcessProp?: boolean;
}

function loadSettings(): ImageSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Silently fallback
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
    // Silently ignore
  }
}

export function useImageConversion({ editorRef, onLog, onVisibilityChange, autoProcessProp }: UseImageConversionProps) {
  const savedSettings = loadSettings();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [format, setFormat] = useState<ImageFormat>(savedSettings.format);
  const [quality, setQuality] = useState(savedSettings.quality);
  const [maxWidth, setMaxWidth] = useState(savedSettings.maxWidth);
  const [autoProcess, setAutoProcess] = useState(autoProcessProp ?? savedSettings.autoProcess);

  // Session tracking to invalidate old uploads
  const [sessionId, setSessionId] = useState(0);

  const convertAbortControllerRef = useRef<AbortController | null>(null);
  const isExtractingRef = useRef(false);

  const log = useCallback(
    (message: string) => {
      if (onLog) onLog(message);
    },
    [onLog]
  );

  const abortConversions = useCallback(() => {
    if (convertAbortControllerRef.current) {
      convertAbortControllerRef.current.abort();
      convertAbortControllerRef.current = null;
    }
  }, []);

  const clearImagesAndRevoke = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  }, []);

  // Sync autoProcess prop
  useEffect(() => {
    if (autoProcessProp !== undefined && autoProcessProp !== autoProcess) {
      setAutoProcess(autoProcessProp);
    }
  }, [autoProcessProp, autoProcess]);

  // Save settings
  useEffect(() => {
    saveSettings({
      format,
      quality,
      maxWidth,
      autoProcess,
      preserveFormat: IMAGE_DEFAULTS.PRESERVE_FORMAT,
    });
  }, [format, quality, maxWidth, autoProcess]);

  // Convert single image
  const convertImage = useCallback(async (src: string, targetFormat: ImageFormat, opts: { quality: number; maxWidth: number }, signal?: AbortSignal): Promise<{ blob: Blob; originalSize: number }> => {
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
      throw new Error("Зображення з іншого домену: потрібен backend (npm run dev) для конвертації, або вставте як data URL.");
    }

    // For PNG, use server-side conversion to properly handle compression if available?
    // Use fallback otherwise.
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

        if (isApiAvailable()) {
          const convertResponse = await fetch(`${API_URL}/api/image-converter/convert`, {
            method: "POST",
            body: formData,
            signal,
          });

          if (convertResponse.ok) {
            const optimizedBlob = await convertResponse.blob();
            return { blob: optimizedBlob, originalSize };
          }
        }
        // Fallback to client-side
      } catch (error) {
        // Fallback
      }
    }

    // Client-side conversion
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
  }, []);

  const processImage = useCallback(
    async (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) {
        log(`⚠️ Зображення з id ${id} не знайдено в state`);
        return;
      }

      if (!convertAbortControllerRef.current || convertAbortControllerRef.current.signal.aborted) {
        convertAbortControllerRef.current = new AbortController();
      }
      const signal = convertAbortControllerRef.current.signal;

      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, status: "processing" as const } : img)));

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
      } catch (error) {
        if ((error as any).name === "AbortError") return;
        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? {
                  ...img,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Error",
                }
              : img
          )
        );
      }
    },
    [images, format, quality, maxWidth, convertImage, log]
  );

  const processAllPending = useCallback(async () => {
    const pending = images.filter((img) => img.status === "pending");
    if (pending.length === 0) return;

    for (const img of pending) {
      await processImage(img.id);
    }
  }, [images, processImage]);

  // Re-process on settings change
  useEffect(() => {
    abortConversions();
    setImages((prev) => {
      const hasProcessed = prev.some((img) => img.status === "done" || img.status === "error");
      if (!hasProcessed) return prev;
      return prev.map((img) => (img.status === "done" || img.status === "error" ? { ...img, status: "pending" as const, convertedBlob: undefined, convertedSize: undefined, error: undefined } : img));
    });
  }, [quality, maxWidth, abortConversions]);

  // Auto process
  useEffect(() => {
    if (autoProcess) {
      const pending = images.filter((img) => img.status === "pending");
      if (pending.length > 0 && !convertAbortControllerRef.current?.signal.aborted) {
        pending.forEach((img) => processImage(img.id));
      }
    }
  }, [autoProcess, images, processImage]);

  // Extract
  const extractImages = useCallback(async () => {
    if (!editorRef.current) return;
    if (isExtractingRef.current) return;
    isExtractingRef.current = true;

    try {
      abortConversions();
      setSessionId((s) => s + 1); // Invalidate session

      const imgElements = editorRef.current.querySelectorAll("img");
      if (imgElements.length === 0) {
        log("❌ Зображення не знайдено");
        clearImagesAndRevoke();
        onVisibilityChange(false);
        isExtractingRef.current = false;
        return;
      }

      const eligible = Array.from(imgElements).filter((img) => img.src && !isSignatureImageAlt(img.getAttribute("alt")));
      if (eligible.length === 0) {
        log("✅ Зображень не знайдено (тільки підписи або порожні)");
        clearImagesAndRevoke();
        onVisibilityChange(false);
        isExtractingRef.current = false;
        return;
      }

      log(`✅ Знайдено ${eligible.length} зображень` + (eligible.length < imgElements.length ? ` (пропущено ${imgElements.length - eligible.length} підписів)` : ""));

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
          status: "pending",
          name,
          hasTransparency,
          formatOverride: "auto",
        });
      }
      setImages(newImages);
      onVisibilityChange(true);

      // Auto process immediately if enabled
      if (autoProcess) {
        // We need to process them.
        // Since setImages is async, we can't iterate 'images' yet.
        // We iterate 'newImages'.
        // But processImage needs 'images' state to be updated...
        // OR processImage takes image object?
        // My processImage implementation uses 'images.find'.
        // So we must wait for state update.
        // Best to use a Effect to trigger processing if pending exists and autoProcess is true.
      } else {
        log("⏸️ Автообробка вимкнена. Натисніть 'Обробити все'");
      }
    } catch (e: any) {
      log(`❌ Помилка витягування: ${e.message}`);
    } finally {
      isExtractingRef.current = false;
    }
  }, [editorRef, log, autoProcess, onVisibilityChange, clearImagesAndRevoke, abortConversions]);

  // Clean up
  useEffect(() => {
    return () => {
      abortConversions();
    };
  }, [abortConversions]);

  return {
    images,
    setImages,
    settings: { format, quality, maxWidth, autoProcess },
    setSettings: { setFormat, setQuality, setMaxWidth, setAutoProcess },
    actions: { extractImages, processImage, processAllPending, clearImagesAndRevoke, abortConversions },
    sessionId,
  };
}
