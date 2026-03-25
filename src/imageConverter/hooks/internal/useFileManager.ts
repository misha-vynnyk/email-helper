/**
 * File Manager Hook
 * Handles file add/remove/clear/reorder/selection/download operations.
 * Extracted from ImageConverterContext.
 */

import { useCallback, useRef, useState } from "react";

import { ConversionSettings, ImageFile } from "../../types";
import { detectImageFormat, getExtensionForFormat } from "../../utils/imageFormatDetector";
import { validateImageFiles } from "../../utils/validators";
import { MAX_FILE_SIZE_CLIENT, MAX_FILE_SIZE_SERVER } from "../../constants";

export function useFileManager(settings: ConversionSettings) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const filesRef = useRef<ImageFile[]>([]);

  // Keep ref in sync
  filesRef.current = files;

  const maxFileSize =
    settings.processingMode === "client" ? MAX_FILE_SIZE_CLIENT : MAX_FILE_SIZE_SERVER;

  const addFiles = useCallback(
    (newFiles: File[]): ImageFile[] => {
      const { validFiles, errors } = validateImageFiles(newFiles, maxFileSize);

      if (errors.length > 0) {
        // Caller can handle errors via return
        console.warn("Invalid files:", errors);
      }

      const imageFiles: ImageFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        originalSize: file.size,
        status: "pending",
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...imageFiles]);
      return imageFiles;
    },
    [maxFileSize]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      return prev.filter((f) => f.id !== id);
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
      return newFiles;
    });
  }, []);

  // Selection
  const toggleSelection = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  }, []);

  const selectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  }, []);

  const removeSelected = useCallback(() => {
    setFiles((prev) => {
      const toRemove = prev.filter((f) => f.selected);
      toRemove.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      });
      return prev.filter((f) => !f.selected);
    });
  }, []);

  // Download
  const downloadFile = useCallback(
    (id: string) => {
      const file = filesRef.current.find((f) => f.id === id);
      if (!file?.convertedBlob) return;

      const usedFormat = settings.preserveFormat ? detectImageFormat(file.file) : settings.format;
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
    },
    [settings.format, settings.preserveFormat]
  );

  const downloadAll = useCallback(() => {
    const completedFiles = filesRef.current.filter((f) => f.status === "done" && f.convertedBlob);
    completedFiles.forEach((file) => downloadFile(file.id));
  }, [downloadFile]);

  const downloadSelected = useCallback(() => {
    filesRef.current.forEach((file) => {
      if (file.selected && file.status === "done") {
        downloadFile(file.id);
      }
    });
  }, [downloadFile]);

  const selectedCount = files.filter((f) => f.selected).length;

  return {
    files,
    setFiles,
    filesRef,
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
    selectedCount,
  };
}
