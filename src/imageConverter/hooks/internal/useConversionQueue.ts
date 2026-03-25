/**
 * Conversion Queue Hook
 * Manages parallel conversion processing with queue, retry, and caching.
 * Extracted from ImageConverterContext (the core conversion logic).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { LIMITS, TIMING } from "../../constants/limits";
import { logger } from "../../../utils/logger";
import { ConversionResult, ConversionSettings, ImageFile } from "../../types";
import { convertImageClient } from "../../utils/clientConverter";
import { extractExif, insertExif } from "../../utils/exifPreserver";
import { detectImageFormat } from "../../utils/imageFormatDetector";
import { imageCache } from "../../utils/imageCache";
import { convertImageServer } from "../../utils/imageConverterApi";
import { performanceMonitor } from "../../utils/performanceMonitor";
import { calculateOptimalQuality } from "../../utils/qualityOptimizer";
import { WorkerPool } from "../../workers/workerPool";

interface UseConversionQueueProps {
  settings: ConversionSettings;
  filesRef: React.MutableRefObject<ImageFile[]>;
  setFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  workerPool: React.MutableRefObject<WorkerPool | null>;
  USE_WORKERS: boolean;
}

export function useConversionQueue({
  settings,
  filesRef,
  setFiles,
  workerPool,
  USE_WORKERS,
}: UseConversionQueueProps) {
  const [conversionQueue, setConversionQueue] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const convertFile = useCallback(
    async (id: string) => {
      const fileToConvert = filesRef.current.find((f) => f.id === id);
      if (!fileToConvert) return;
      if (fileToConvert.status === "done" || fileToConvert.status === "processing") return;

      // Mark processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "processing" as const, progress: 0, startTime: Date.now(), eta: undefined }
            : f
        )
      );

      try {
        const startTime = performanceMonitor.startConversion(id);
        let effectiveSettings = settingsRef.current;

        const inputFormat = detectImageFormat(fileToConvert.file);

        // Apply preserve format if enabled
        if (effectiveSettings.preserveFormat) {
          effectiveSettings = {
            ...effectiveSettings,
            format: inputFormat,
          };
        }

        // Force server for GIF input or GIF output
        if (inputFormat === "gif" || effectiveSettings.format === "gif") {
          effectiveSettings = { ...effectiveSettings, processingMode: "server" };
        }

        // Force server for GIF output
        if (effectiveSettings.format === "gif") {
          effectiveSettings = { ...effectiveSettings, processingMode: "server" };
        }

        // Apply compression mode overrides
        switch (effectiveSettings.compressionMode) {
          case "maximum-quality":
            effectiveSettings = { ...effectiveSettings, quality: 92 };
            break;
          case "maximum-compression":
            effectiveSettings = { ...effectiveSettings, quality: 75 };
            break;
          case "lossless":
            effectiveSettings = { ...effectiveSettings, quality: 100 };
            break;
          case "balanced":
          default:
            if (effectiveSettings.autoQuality) {
              const qualityRec = await calculateOptimalQuality(fileToConvert.file);
              effectiveSettings = { ...effectiveSettings, quality: qualityRec.quality };
            }
            break;
        }

        // EXIF
        const exifData = effectiveSettings.preserveExif
          ? await extractExif(fileToConvert.file)
          : { data: null, hasExif: false };

        // Cache key
        const contentHash = await imageCache.generateContentHash(fileToConvert.file);
        
        // Dimensions for cache key
        const targetWidth = effectiveSettings.resize.mode === "preset"
          ? effectiveSettings.resize.preset
          : (effectiveSettings.resize.mode === "custom" ? effectiveSettings.resize.width : undefined);
        const targetHeight = effectiveSettings.resize.mode === "custom" ? effectiveSettings.resize.height : undefined;

        const cacheKey = imageCache.generateKey(
          fileToConvert.file.name,
          effectiveSettings.format,
          effectiveSettings.quality,
          {
            width: targetWidth,
            height: targetHeight,
          },
          `${effectiveSettings.compressionMode}-${effectiveSettings.resize.mode}`,
          contentHash
        );

        // Progress callback
        const onProgress = (progress: number) => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id !== id) return f;
              let eta: number | undefined;
              if (f.startTime && progress > 5) {
                const elapsed = (Date.now() - f.startTime) / 1000;
                const estimatedTotal = (elapsed / progress) * 100;
                eta = Math.max(0, Math.round(estimatedTotal - elapsed));
              }
              return { ...f, progress: Math.min(Math.max(progress, 0), 100), eta };
            })
          );
        };

        // Check cache
        onProgress(5);
        const cachedBlob = await imageCache.get(cacheKey);
        let result: ConversionResult;
        let usedCache = false;

        if (cachedBlob) {
          performanceMonitor.recordCacheHit();
          usedCache = true;
          result = { blob: cachedBlob, size: cachedBlob.size };
          for (let p = 10; p <= 100; p += 10) {
            onProgress(p);
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
        } else {
          performanceMonitor.recordCacheMiss();
          onProgress(10);

          if (effectiveSettings.processingMode === "client") {
            if (USE_WORKERS && workerPool.current) {
              try {
                onProgress(15);
                const blob = await workerPool.current.process(
                  fileToConvert.file,
                  effectiveSettings,
                  onProgress
                );
                result = { blob, size: blob.size };
                onProgress(85);
              } catch (error) {
                logger.warn("ImageConverter", "Worker failed, falling back to main thread", error);
                onProgress(30);
                result = await convertImageClient(fileToConvert.file, effectiveSettings);
                onProgress(85);
              }
            } else {
              onProgress(25);
              result = await convertImageClient(fileToConvert.file, effectiveSettings);
              onProgress(85);
            }
          } else {
            // Server-side
            onProgress(15);
            const progressInterval = setInterval(() => {
              setFiles((prev) =>
                prev.map((f) => {
                  if (f.id !== id || f.progress >= 75) return f;
                  return { ...f, progress: Math.min(f.progress + 5, 75) };
                })
              );
            }, 200);

            try {
              const blob = await convertImageServer(fileToConvert.file, effectiveSettings);
              clearInterval(progressInterval);
              onProgress(85);
              result = { blob, size: blob.size };
            } catch (error) {
              clearInterval(progressInterval);
              throw error;
            }
          }

          // EXIF re-insert
          onProgress(90);
          if (exifData.hasExif && exifData.data && effectiveSettings.preserveExif) {
            try {
              result.blob = await insertExif(result.blob, exifData.data);
              result.size = result.blob.size;
            } catch (error) {
              logger.warn("ImageConverter", "Failed to insert EXIF", error);
            }
          }

          // Cache
          onProgress(95);
          await imageCache.cache(cacheKey, result.blob, {
            fileName: fileToConvert.file.name,
            originalSize: fileToConvert.originalSize,
            convertedSize: result.size,
            format: effectiveSettings.format,
            quality: effectiveSettings.quality,
          });
        }

        const convertedUrl = URL.createObjectURL(result.blob);
        const usedFormat = effectiveSettings.preserveFormat
          ? detectImageFormat(fileToConvert.file)
          : effectiveSettings.format;

        if (!usedCache) {
          performanceMonitor.recordConversion(
            id,
            fileToConvert.file.name,
            fileToConvert.originalSize,
            result.size,
            startTime,
            effectiveSettings.processingMode,
            usedFormat,
            effectiveSettings.quality
          );
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "done" as const,
                  progress: 100,
                  convertedBlob: result.blob,
                  convertedSize: result.size,
                  convertedUrl,
                }
              : f
          )
        );
      } catch (error) {
        logger.error("ImageConverter", "Conversion error", error);

        const currentFile = filesRef.current.find((f) => f.id === id);
        const retryCount = (currentFile?.retryCount || 0) + 1;

        if (retryCount <= LIMITS.MAX_RETRIES) {
          const backoffDelay = Math.pow(2, retryCount - 1) * TIMING.RETRY_BASE_MS;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: "pending" as const, retryCount, error: `Retry ${retryCount}/${LIMITS.MAX_RETRIES}...` }
                : f
            )
          );
          setTimeout(() => {
            setConversionQueue((prev) => [...prev, id]);
          }, backoffDelay);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Conversion failed after retries",
                    retryCount,
                  }
                : f
            )
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [USE_WORKERS]
  );

  // Process queue in parallel
  useEffect(() => {
    if (conversionQueue.length === 0) return;

    const processParallel = async () => {
      const availableSlots = LIMITS.MAX_CONCURRENT_CONVERSIONS - processingIds.size;
      if (availableSlots <= 0) return;

      const toProcess = conversionQueue
        .filter((id) => !processingIds.has(id))
        .slice(0, availableSlots);

      if (toProcess.length === 0) return;

      setProcessingIds((prev) => {
        const next = new Set(prev);
        toProcess.forEach((id) => next.add(id));
        return next;
      });

      setConversionQueue((prev) => prev.filter((id) => !toProcess.includes(id)));

      const results = await Promise.allSettled(toProcess.map((id) => convertFile(id)));

      setProcessingIds((prev) => {
        const next = new Set(prev);
        toProcess.forEach((id) => next.delete(id));
        return next;
      });

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error("ImageConverter", `Conversion failed for ${toProcess[index]}`, result.reason);
        }
      });
    };

    processParallel();
  }, [conversionQueue, processingIds, convertFile]);

  // Queue management actions
  const enqueueFiles = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setTimeout(() => {
        setConversionQueue((prev) => [...prev, ...ids]);
      }, TIMING.QUEUE_DELAY_MS);
    }
  }, []);

  const convertAll = useCallback(() => {
    const pendingIds = filesRef.current.filter((f) => f.status === "pending").map((f) => f.id);
    if (pendingIds.length > 0) {
      setTimeout(() => {
        setConversionQueue((prev) => [...prev, ...pendingIds]);
      }, TIMING.CONVERSION_DELAY_MS);
    }
  }, [filesRef]);

  const convertSelected = useCallback(() => {
    const selectedIds = filesRef.current
      .filter((f) => f.selected && f.status === "pending")
      .map((f) => f.id);
    if (selectedIds.length > 0) {
      setConversionQueue((prev) => [...prev, ...selectedIds]);
    }
  }, [filesRef]);

  return {
    convertFile,
    convertAll,
    convertSelected,
    enqueueFiles,
  };
}
