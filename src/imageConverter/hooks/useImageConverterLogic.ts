/**
 * Image Converter Logic Hook (Main Orchestrator)
 * Combines all internal hooks into a single {state, actions, settings} interface.
 * Pattern: mirrors useHtmlConverterLogic from htmlConverter.
 */

import { useCallback, useEffect, useRef } from "react";

import { useConversionQueue } from "./internal/useConversionQueue";
import { useFileManager } from "./internal/useFileManager";
import { useWorkerPool } from "./internal/useWorkerPool";
import { useImageConverterSettings } from "./useImageConverterSettings";

export function useImageConverterLogic() {
  // 1. Settings
  const { settings, updateSettings } = useImageConverterSettings();

  // 2. File Manager
  const {
    files,
    setFiles,
    filesRef,
    addFiles: addFilesBase,
    removeFile,
    clearFiles,
    reorderFiles,
    toggleSelection,
    selectAll,
    deselectAll,
    removeSelected,
    downloadFile,
    downloadAll,
    downloadSelected,
    selectedCount,
  } = useFileManager(settings);

  // 3. Worker Pool
  const { workerPool, USE_WORKERS } = useWorkerPool();

  // Bumped every time conversion-affecting settings actually change; lets an
  // in-flight conversion (captured at the old version) recognize its result is
  // stale and drop it instead of overwriting a fresh run — see useConversionQueue.
  const settingsVersionRef = useRef(0);

  // 4. Conversion Queue
  const { convertFile, convertAll, convertSelected, enqueueFiles } = useConversionQueue({
    settings,
    filesRef,
    setFiles,
    workerPool,
    USE_WORKERS,
    settingsVersionRef,
  });

  // Reset done/error/processing files when conversion-affecting settings change
  const prevConversionFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    const fingerprint = JSON.stringify([
      settings.format,
      settings.quality,
      settings.compressionMode,
      settings.backgroundColor,
      settings.resize,
      settings.preserveFormat,
      settings.autoQuality,
      settings.preserveExif,
      settings.processingMode,
    ]);

    if (prevConversionFingerprintRef.current === null) {
      prevConversionFingerprintRef.current = fingerprint;
      return;
    }

    if (fingerprint === prevConversionFingerprintRef.current) return;
    prevConversionFingerprintRef.current = fingerprint;
    settingsVersionRef.current += 1;

    // "processing" must be reset too — otherwise a file mid-conversion under the
    // old settings keeps running and silently lands as "done" with stale output;
    // the settingsVersionRef bump above makes that stale result a no-op instead.
    const filesToReset = filesRef.current.filter(
      (f) => f.status === "done" || f.status === "error" || f.status === "processing"
    );

    if (filesToReset.length === 0) return;

    setFiles((prev) =>
      prev.map((f) => {
        if (f.status !== "done" && f.status !== "error" && f.status !== "processing") return f;
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
        return {
          ...f,
          status: "pending" as const,
          progress: 0,
          convertedBlob: undefined,
          convertedSize: undefined,
          convertedUrl: undefined,
          error: undefined,
          eta: undefined,
        };
      })
    );

    if (settings.autoConvert) {
      enqueueFiles(filesToReset.map((f) => f.id));
    }
  }, [settings, filesRef, setFiles, enqueueFiles]);

  // Wrap addFiles to auto-convert
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const imageFiles = addFilesBase(newFiles);
      if (settings.autoConvert && imageFiles.length > 0) {
        const newIds = imageFiles.map((f) => f.id);
        enqueueFiles(newIds);
      }
    },
    [addFilesBase, settings.autoConvert, enqueueFiles]
  );

  // Keep filesRef synced
  useEffect(() => {
    filesRef.current = files;
  }, [files, filesRef]);

  return {
    state: {
      files,
      selectedCount,
    },
    actions: {
      addFiles,
      removeFile,
      clearFiles,
      reorderFiles,
      toggleSelection,
      selectAll,
      deselectAll,
      removeSelected,
      downloadFile,
      downloadAll,
      downloadSelected,
      convertFile,
      convertAll,
      convertSelected,
    },
    settings: {
      settings,
      updateSettings,
    },
  };
}

/**
 * Convenience type for consumers
 */
export type ImageConverterLogic = ReturnType<typeof useImageConverterLogic>;
