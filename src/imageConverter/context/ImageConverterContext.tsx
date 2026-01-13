import React, { createContext, useCallback, useContext, useState } from "react";

import {
  DEFAULT_AUTO_CONVERT,
  DEFAULT_AUTO_QUALITY,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COMPRESSION_MODE,
  DEFAULT_FORMAT,
  DEFAULT_PRESERVE_EXIF,
  DEFAULT_PRESERVE_FORMAT,
  DEFAULT_PROCESSING_MODE,
  DEFAULT_QUALITY,
} from "../constants";
import { LIMITS, TIMING } from "../constants/limits";
import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../utils/storageKeys";
import { ConversionResult, ConversionSettings, ImageFile, ImageFormat } from "../types";
import { convertImageClient } from "../utils/clientConverter";
import { extractExif, insertExif } from "../utils/exifPreserver";
import { detectImageFormat, getExtensionForFormat } from "../utils/imageFormatDetector";
import { HistoryManager } from "../utils/historyManager";
import { imageCache } from "../utils/imageCache";
import { convertImageServer } from "../utils/imageConverterApi";
import { performanceMonitor } from "../utils/performanceMonitor";
import { calculateOptimalQuality } from "../utils/qualityOptimizer";
import { WorkerPool } from "../workers/workerPool";

interface ImageConverterContextType {
  files: ImageFile[];
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  convertFile: (id: string) => Promise<void>;
  convertAll: () => void;
  downloadFile: (id: string) => void;
  downloadAll: () => void;
  reorderFiles: (oldIndex: number, newIndex: number) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  removeSelected: () => void;
  downloadSelected: () => void;
  convertSelected: () => void;
  selectedCount: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ImageConverterContext = createContext<ImageConverterContextType | undefined>(undefined);

export const useImageConverter = () => {
  const context = useContext(ImageConverterContext);
  if (!context) {
    throw new Error("useImageConverter must be used within ImageConverterProvider");
  }
  return context;
};

export const ImageConverterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage
  const loadSettings = (): ConversionSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_CONVERTER_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          resize: parsed.resize || {
            mode: "original",
            preserveAspectRatio: true,
          },
          targetFileSize: parsed.targetFileSize,
          gifFrameResize: parsed.gifFrameResize || {
            enabled: false,
            preserveAspectRatio: true,
          },
        };
      }
    } catch (error) {
      logger.error('ImageConverter', 'Failed to load settings', error);
    }

    // Default settings
    return {
      format: DEFAULT_FORMAT,
      quality: DEFAULT_QUALITY,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      resize: {
        mode: "original",
        preserveAspectRatio: true,
      },
      processingMode: DEFAULT_PROCESSING_MODE,
      compressionMode: DEFAULT_COMPRESSION_MODE,
      autoConvert: DEFAULT_AUTO_CONVERT,
      preserveFormat: DEFAULT_PRESERVE_FORMAT,
      autoQuality: DEFAULT_AUTO_QUALITY,
      preserveExif: DEFAULT_PRESERVE_EXIF,
      targetFileSize: undefined,
      gifFrameResize: {
        enabled: false,
        preserveAspectRatio: true,
      },
    };
  };

  const [files, setFiles] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>(loadSettings());
  const [conversionQueue, setConversionQueue] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const filesRef = React.useRef<ImageFile[]>([]);
  const workerPool = React.useRef<WorkerPool | null>(null);
  const historyManager = React.useRef<HistoryManager>(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const USE_WORKERS = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

  // Keep filesRef in sync with files
  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Initialize worker pool if supported
  React.useEffect(() => {
    if (USE_WORKERS && !workerPool.current) {
      workerPool.current = new WorkerPool(LIMITS.MAX_CONCURRENT_CONVERSIONS);
          workerPool.current.init().catch((error) => {
            logger.error('ImageConverter', 'Failed to initialize worker pool', error);
            workerPool.current = null;
          });
    }

    return () => {
      if (workerPool.current) {
        workerPool.current.terminate();
        workerPool.current = null;
      }
    };
  }, [USE_WORKERS]);

  const updateSettings = useCallback((newSettings: Partial<ConversionSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Persist to localStorage
          try {
            localStorage.setItem(STORAGE_KEYS.IMAGE_CONVERTER_SETTINGS, JSON.stringify(updated));
          } catch (error) {
            logger.error('ImageConverter', 'Failed to save settings', error);
          }

      return updated;
    });
  }, []);

  const convertFile = useCallback(
    async (id: string) => {
      // Get file from ref (always current)
      const fileToConvert = filesRef.current.find((f) => f.id === id);

      if (!fileToConvert) {
        return;
      }

      // Check if already processing or done
      if (fileToConvert.status === "done" || fileToConvert.status === "processing") {
        return;
      }

      // Update status to processing with start time
      setFiles((currentFiles) =>
        currentFiles.map((f) =>
          f.id === id ? { ...f, status: "processing" as const, progress: 0, startTime: Date.now(), eta: undefined } : f
        )
      );

      try {
        // Start performance tracking
        const startTime = performanceMonitor.startConversion(id);

        // Calculate optimal quality if autoQuality is enabled
        let effectiveSettings = settings;
        if (settings.autoQuality) {
          const qualityRec = await calculateOptimalQuality(fileToConvert.file);
          effectiveSettings = { ...settings, quality: qualityRec.quality };
        }

        // Extract EXIF if preservation is enabled
        const exifData = effectiveSettings.preserveExif
          ? await extractExif(fileToConvert.file)
          : { data: null, hasExif: false };

        // Generate cache key (includes file size and lastModified for uniqueness)
        const cacheKey = imageCache.generateKey(
          fileToConvert.file.name,
          effectiveSettings.format,
          effectiveSettings.quality,
          {
            width: effectiveSettings.resize.mode === 'preset' ? effectiveSettings.resize.preset : effectiveSettings.resize.width,
            height: effectiveSettings.resize.height,
          },
          effectiveSettings.compressionMode,
          fileToConvert.file.size,
          fileToConvert.file.lastModified
        );

        // Progress callback to update UI with ETA
        const onProgress = (progress: number) => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id !== id) return f;

              // Calculate ETA
              let eta: number | undefined;
              if (f.startTime && progress > 5) {
                const elapsed = (Date.now() - f.startTime) / 1000; // seconds
                const estimatedTotal = (elapsed / progress) * 100;
                eta = Math.max(0, Math.round(estimatedTotal - elapsed));
              }

              return {
                ...f,
                progress: Math.min(Math.max(progress, 0), 100),
                eta,
              };
            })
          );
        };

        // Check cache first
        onProgress(5);
        const cachedBlob = await imageCache.get(cacheKey);

        let result: ConversionResult;
        let usedCache = false;

        if (cachedBlob) {
          // Use cached result
          performanceMonitor.recordCacheHit();
          usedCache = true;
          result = { blob: cachedBlob, size: cachedBlob.size };

          // Smooth progress animation for cached results
          for (let p = 10; p <= 100; p += 10) {
            onProgress(p);
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        } else {
          performanceMonitor.recordCacheMiss();
          // Not in cache, convert
          onProgress(10);

          if (effectiveSettings.processingMode === "client") {
            // Use Web Workers if available and supported
            if (USE_WORKERS && workerPool.current) {
              try {
                onProgress(15);
                const blob = await workerPool.current.process(
                  fileToConvert!.file,
                  effectiveSettings,
                  onProgress
                );
                result = { blob, size: blob.size };
                onProgress(85);
                  } catch (error) {
                    // Fallback to main thread if worker fails
                    logger.warn('ImageConverter', 'Worker failed, falling back to main thread', error);
                    onProgress(30);
                    result = await convertImageClient(fileToConvert!.file, effectiveSettings);
                    onProgress(85);
                  }
            } else {
              // Fallback to main thread conversion
              onProgress(25);
              result = await convertImageClient(fileToConvert!.file, effectiveSettings);
              onProgress(85);
            }
          } else {
            // Server-side processing with simulated progress
            onProgress(15);

            // Simulate smooth progress during server processing
            const progressInterval = setInterval(() => {
              setFiles((prev) =>
                prev.map((f) => {
                  if (f.id !== id || f.progress >= 75) return f;
                  return { ...f, progress: Math.min(f.progress + 5, 75) };
                })
              );
            }, 200);

            try {
              const blob = await convertImageServer(fileToConvert!.file, effectiveSettings);
              clearInterval(progressInterval);
              onProgress(85);
              result = { blob, size: blob.size };
            } catch (error) {
              clearInterval(progressInterval);
              throw error;
            }
          }

          // Re-insert EXIF if it was preserved
          onProgress(90);
          if (exifData.hasExif && exifData.data && effectiveSettings.preserveExif) {
            try {
              result.blob = await insertExif(result.blob, exifData.data);
              result.size = result.blob.size;
            } catch (error) {
              logger.warn('ImageConverter', 'Failed to insert EXIF, continuing without it', error);
            }
          }

          // Cache the result
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

        // Determine format used for conversion
        const usedFormat = effectiveSettings.preserveFormat
          ? detectImageFormat(fileToConvert!.file)
          : effectiveSettings.format;

        // Record performance metrics (only for non-cached conversions)
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
            logger.error('ImageConverter', 'Conversion error', error);

            const currentFile = filesRef.current.find((f) => f.id === id);
        const retryCount = (currentFile?.retryCount || 0) + 1;

        // Automatic retry with exponential backoff
        if (retryCount <= LIMITS.MAX_RETRIES) {
          const backoffDelay = Math.pow(2, retryCount - 1) * TIMING.RETRY_BASE_MS; // 1s, 2s, 4s

          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "pending" as const,
                    retryCount,
                    error: `Retry ${retryCount}/${LIMITS.MAX_RETRIES}...`,
                  }
                : f
            )
          );

          // Schedule retry
          setTimeout(() => {
            setConversionQueue((prev) => [...prev, id]);
          }, backoffDelay);
        } else {
          // Max retries reached, mark as error
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
    [settings]
  );

  // Process conversion queue with parallel processing
  React.useEffect(() => {
    if (conversionQueue.length === 0) return;

        const processParallel = async () => {
          // Calculate how many we can process now
          const availableSlots = LIMITS.MAX_CONCURRENT_CONVERSIONS - processingIds.size;
      if (availableSlots <= 0) return;

      // Get next batch to process
      const toProcess = conversionQueue
        .filter(id => !processingIds.has(id))
        .slice(0, availableSlots);

      if (toProcess.length === 0) return;

      // Mark as processing
      setProcessingIds(prev => {
        const next = new Set(prev);
        toProcess.forEach(id => next.add(id));
        return next;
      });

      // Remove from queue
      setConversionQueue(prev => prev.filter(id => !toProcess.includes(id)));

      // Process in parallel
      const results = await Promise.allSettled(
        toProcess.map(id => convertFile(id))
      );

      // Remove from processing set
      setProcessingIds(prev => {
        const next = new Set(prev);
        toProcess.forEach(id => next.delete(id));
        return next;
      });

          // Log any failures for debugging
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              logger.error('ImageConverter', `Conversion failed for ${toProcess[index]}`, result.reason);
            }
          });
    };

    processParallel();
  }, [conversionQueue, processingIds, convertFile]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const imageFiles: ImageFile[] = newFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        originalSize: file.size,
        status: "pending",
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...imageFiles]);

      // Auto-convert if enabled - add to queue after state update
      if (settings.autoConvert) {
        const newIds = imageFiles.map((f) => f.id);
        // Use setTimeout to ensure files state is updated first
        setTimeout(() => {
          setConversionQueue((prev) => [...prev, ...newIds]);
        }, TIMING.QUEUE_DELAY_MS);
      }
    },
    [settings.autoConvert]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      const newState = prev.filter((f) => f.id !== id);
      historyManager.current.push(newState, 'Removed file');
      return newState;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles((currentFiles) => {
      currentFiles.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      });
      return [];
    });
  }, []);

  const reorderFiles = useCallback((oldIndex: number, newIndex: number) => {
    setFiles((currentFiles) => {
      const newFiles = [...currentFiles];
      const [removed] = newFiles.splice(oldIndex, 1);
      newFiles.splice(newIndex, 0, removed);
      historyManager.current.push(newFiles, 'Reordered files');
      return newFiles;
    });
  }, []);

  const undo = useCallback(() => {
    const previousState = historyManager.current.undo();
    if (previousState) {
      setFiles(previousState);
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());
    }
  }, []);

  const redo = useCallback(() => {
    const nextState = historyManager.current.redo();
    if (nextState) {
      setFiles(nextState);
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());
    }
  }, []);

  // Update undo/redo state when files change
  React.useEffect(() => {
    setCanUndo(historyManager.current.canUndo());
    setCanRedo(historyManager.current.canRedo());
  }, [files]);

  const toggleSelection = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  }, []);

  const selectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  }, []);

  const downloadFile = useCallback(
    (id: string) => {
      setFiles((currentFiles) => {
        const file = currentFiles.find((f) => f.id === id);
        if (!file?.convertedBlob) return currentFiles;

        // Use preserved format if enabled, otherwise use settings format
        const usedFormat = settings.preserveFormat
          ? detectImageFormat(file.file)
          : settings.format;
        const extension = getExtensionForFormat(usedFormat);
        const filename = file.file.name.replace(/\.[^/.]+$/, "") + extension;

        const url = URL.createObjectURL(file.convertedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return currentFiles;
      });
    },
    [settings.format, settings.preserveFormat]
  );

  const downloadAll = useCallback(() => {
    setFiles((currentFiles) => {
      const completedFiles = currentFiles.filter((f) => f.status === "done" && f.convertedBlob);
      completedFiles.forEach((file) => downloadFile(file.id));
      return currentFiles;
    });
  }, [downloadFile]);

  const removeSelected = useCallback(() => {
    setFiles((prev) => {
      const toRemove = prev.filter((f) => f.selected);
      toRemove.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      });
      return prev.filter((f) => !f.selected);
    });
    setConversionQueue((prev) => {
      const selectedIds = new Set(filesRef.current.filter((f) => f.selected).map((f) => f.id));
      return prev.filter((id) => !selectedIds.has(id));
    });
    setProcessingIds((prev) => {
      const selectedIds = new Set(filesRef.current.filter((f) => f.selected).map((f) => f.id));
      const next = new Set(prev);
      selectedIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const downloadSelected = useCallback(() => {
    filesRef.current.forEach((file) => {
      if (file.selected && file.status === "done") {
        downloadFile(file.id);
      }
    });
  }, [downloadFile]);

  const convertSelected = useCallback(() => {
    const selectedIds = filesRef.current
      .filter((f) => f.selected && f.status === "pending")
      .map((f) => f.id);
    if (selectedIds.length > 0) {
      setConversionQueue((prev) => [...prev, ...selectedIds]);
    }
  }, []);

  const selectedCount = files.filter((f) => f.selected).length;

  const convertAll = useCallback(() => {
    // Get pending files and add to queue
    setFiles((currentFiles) => {
      const pendingIds = currentFiles.filter((f) => f.status === "pending").map((f) => f.id);
      if (pendingIds.length > 0) {
        // Delay to ensure state is consistent
        setTimeout(() => {
          setConversionQueue((prev) => [...prev, ...pendingIds]);
        }, TIMING.CONVERSION_DELAY_MS);
      }
      return currentFiles;
    });
  }, []);

  const contextValue: ImageConverterContextType = {
    files,
    settings,
    updateSettings,
    addFiles,
    removeFile,
    clearFiles,
    convertFile,
    convertAll,
    downloadFile,
    downloadAll,
    reorderFiles,
    toggleSelection,
    selectAll,
    deselectAll,
    removeSelected,
    downloadSelected,
    convertSelected,
    selectedCount,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return (
    <ImageConverterContext.Provider value={contextValue}>{children}</ImageConverterContext.Provider>
  );
};
