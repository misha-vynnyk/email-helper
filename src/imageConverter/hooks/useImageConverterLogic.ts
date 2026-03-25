/**
 * Image Converter Logic Hook (Main Orchestrator)
 * Combines all internal hooks into a single {state, actions, settings} interface.
 * Pattern: mirrors useHtmlConverterLogic from htmlConverter.
 */

import { useCallback, useEffect } from "react";


import { useImageConverterSettings } from "./useImageConverterSettings";
import { useFileManager } from "./internal/useFileManager";
import { useWorkerPool } from "./internal/useWorkerPool";
import { useConversionQueue } from "./internal/useConversionQueue";

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

  // 4. Conversion Queue
  const { convertFile, convertAll, convertSelected, enqueueFiles } = useConversionQueue({
    settings,
    filesRef,
    setFiles,
    workerPool,
    USE_WORKERS,
  });

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
