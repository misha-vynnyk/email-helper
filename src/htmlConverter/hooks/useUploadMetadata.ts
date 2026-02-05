import { useState, useEffect, useCallback } from "react";
import { STORAGE_PROVIDERS_CONFIG } from "../constants";
import type { StorageProviderKey } from "../constants";
import type { ImageAnalysisSettings } from "../types";

interface FileItem {
  id: string;
  name: string;
  path?: string;
}

interface UseUploadMetadataProps {
  files: FileItem[];
  open: boolean;
  storageProvider: StorageProviderKey;
  initialFolderName?: string;
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export function useUploadMetadata({ files, open, storageProvider, initialFolderName }: UseUploadMetadataProps) {
  // Config
  const providerCfg = STORAGE_PROVIDERS_CONFIG.providers[storageProvider] || STORAGE_PROVIDERS_CONFIG.providers.default;
  const showCategory = providerCfg.usesCategory;
  const categories = showCategory && providerCfg.categories && providerCfg.categories.length > 0 ? providerCfg.categories : STORAGE_PROVIDERS_CONFIG.providers.default.categories || ["finance", "health"];
  const defaultCategory = (showCategory && providerCfg.defaultCategory) || STORAGE_PROVIDERS_CONFIG.providers.default.defaultCategory || categories[0] || "finance";

  // State
  const [category, setCategory] = useState<string>(defaultCategory);
  const [folderName, setFolderName] = useState<string>("");
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [customAlts, setCustomAlts] = useState<Record<string, string[]>>({});
  const [orderedFiles, setOrderedFiles] = useState<FileItem[]>(files);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync orderedFiles
  useEffect(() => {
    setOrderedFiles(files);
  }, [files]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setCustomNames({});
    setCustomAlts({});
    // Folder name logic is separate below
  }, [open]);

  // Reset category on provider change
  useEffect(() => {
    if (!showCategory) return;
    setCategory((prev) => (categories.includes(prev) ? prev : defaultCategory));
  }, [storageProvider, showCategory, categories, defaultCategory]);

  // Folder Name Autofill
  useEffect(() => {
    if (open) {
      if (initialFolderName && /[a-zA-Z]+\d+/.test(initialFolderName)) {
        setFolderName(initialFolderName);
        return;
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (/[a-zA-Z]+\d+/.test(text.trim())) {
              setFolderName(text.trim());
            }
          })
          .catch(() => {});
      }
    }
  }, [open, initialFolderName]);

  // Drag Handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // Re-implementing DragOver nicely
  const handleDragOverAction = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newFiles = [...orderedFiles];
      const draggedItem = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, draggedItem);

      setOrderedFiles(newFiles);
      setDraggedIndex(index);
    },
    [draggedIndex, orderedFiles]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return {
    category,
    setCategory,
    folderName,
    setFolderName,
    customNames,
    setCustomNames,
    customAlts,
    setCustomAlts,
    orderedFiles,
    setOrderedFiles,
    draggedIndex,
    handleDragStart,
    handleDragOver: handleDragOverAction,
    handleDragEnd,
    showCategory,
    categories,
    providerCfg,
  };
}
