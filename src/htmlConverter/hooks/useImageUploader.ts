import { useState, useCallback, useRef } from "react";
import API_URL, { isApiAvailable } from "../../config/api";
import { UPLOAD_CONFIG, STORAGE_URL_PREFIX, STORAGE_PROVIDERS_CONFIG } from "../constants";
import { copyToClipboard } from "../utils/clipboard";
import { getImageFormat, getFileExtension, isCrossOrigin } from "../imageUtils";
import { ProcessedImage, ImageFormat, UploadResult } from "../types";

interface UseImageUploaderProps {
  images: ProcessedImage[];
  imagesSessionId: number;
  editorRef: React.RefObject<HTMLDivElement>;
  storageProvider: string;
  format: ImageFormat;
  onLog?: (message: string) => void;
  onUploadedUrlsChange?: (urlMap: Record<string, string>) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onUploadedAltsChange?: (altMap: Record<string, string>) => void;
  showSnackbar: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
}

export function useImageUploader({ images, imagesSessionId, editorRef, storageProvider, format, onLog, onUploadedUrlsChange, onReplaceUrls, onUploadedAltsChange, showSnackbar }: UseImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedUrls, setLastUploadedUrls] = useState<Record<string, string>>({});
  const [lastUploadedSessionId, setLastUploadedSessionId] = useState<number | null>(null);

  const [replacementDone, setReplacementDone] = useState(false);

  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const abortUploads = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
  }, []);

  /** Creates a Promise that rejects after `ms` milliseconds with the given message */
  const createTimeout = (ms: number, msg: string) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

  const handleUploadToStorage = useCallback(
    async (
      category: string,
      folderName: string,
      customNames: Record<string, string> = {},
      customAlts: Record<string, string> = {},
      fileOrder?: string[],
      onProgress?: (result: { fileId: string; filename: string; url: string; success: boolean; error?: string }) => void
    ): Promise<{
      results: Array<{ filename: string; url: string; success: boolean; error?: string }>;
      category: string;
      folderName: string;
    }> => {
      let completed = images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src)));

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
        throw new Error("Для завантаження на storage потрібен backend.\n\nЗапустіть: npm run dev\nабо налаштуйте VITE_API_URL на існуючий backend.");
      }

      if (isUploading) {
        throw new Error("Завантаження вже виконується");
      }

      // Reset
      const sessionIdAtStart = imagesSessionId;
      setLastUploadedSessionId(null);
      setLastUploadedUrls({});
      setReplacementDone(false);
      onUploadedUrlsChange?.({});

      setIsUploading(true);
      uploadAbortControllerRef.current = new AbortController();

      onLog?.(`🚀 Початок завантаження ${completed.length} зображень на storage...`);

      const uploadedUrls: Record<string, string> = {};
      const results: Array<UploadResult> = [];
      let successCount = 0;

      // Local helper with closure access
      const getTempPathInner = async (image: ProcessedImage, fname: string): Promise<string> => {
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
            createTimeout(UPLOAD_CONFIG.PREPARE_TIMEOUT, "Timeout: сервер не відповідає (30s)"),
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
          createTimeout(UPLOAD_CONFIG.PREPARE_TIMEOUT, "Timeout: сервер не відповідає (30s)"),
        ]);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `prepare-from-url: ${res.status}`);
        }
        const data = await res.json();
        return data.tempPath;
      };

      const providerCfg = STORAGE_PROVIDERS_CONFIG.providers[storageProvider] || STORAGE_PROVIDERS_CONFIG.providers.default;

      try {
        for (let i = 0; i < completed.length; i++) {
          const img = completed[i];
          const baseName = customNames[img.id] || img.name;

          const fmt = img.convertedBlob ? getImageFormat(img, format) : "png";
          const ext = img.convertedBlob ? getFileExtension(fmt) : `.${/\.(png|jpe?g|webp|gif)(?=\?|$)/i.exec(img.src)?.[1] || "png"}`;
          const filename = `${baseName}${ext}`;

          if (uploadAbortControllerRef.current?.signal.aborted) {
            onLog?.(`⚠️ Завантаження скасовано користувачем`);
            throw new Error("Завантаження скасовано");
          }

          try {
            onLog?.(`📤 [${i + 1}/${completed.length}] Завантаження ${filename}...`);
            const tempPath = await getTempPathInner(img, filename);

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
              createTimeout(UPLOAD_CONFIG.STORAGE_TIMEOUT, "Timeout: storage не відповідає (180s)"),
            ]);

            let result: any = {};
            try {
              result = await storageResponse.json();
            } catch (e) {
              // ignore parse error if ok
            }

            if (!storageResponse.ok) {
              const msg = result.error || `Storage HTTP ${storageResponse.status}`;
              throw new Error(msg);
            }

            if (result.filePath) {
              const fullUrl = result.publicUrl || `${STORAGE_URL_PREFIX}${result.filePath}`;
              uploadedUrls[img.src] = fullUrl;
              successCount++;
              onLog?.(`✅ [${i + 1}/${completed.length}] ${filename} → storage`);
              const resObj = { fileId: img.id, filename, url: fullUrl, success: true };
              results.push(resObj);
              onProgress?.(resObj);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            if ((error as { fatal?: boolean } | null)?.fatal) throw error;

            const resObj = { fileId: img.id, filename, url: "", success: false, error: errorMsg };
            results.push(resObj);
            onProgress?.(resObj);

            if (errorMsg === "Завантаження скасовано") throw error;
            onLog?.(`❌ ${filename}: ${errorMsg}`);
            continue;
          }
        }

        // Replacement in Editor
        if (editorRef.current && Object.keys(uploadedUrls).length > 0) {
          const srcToId: Record<string, string> = {};
          completed.forEach((img) => (srcToId[img.src] = img.id));

          const imgElements = editorRef.current.querySelectorAll("img");
          imgElements.forEach((imgEl) => {
            if (uploadedUrls[imgEl.src]) {
              const imgId = srcToId[imgEl.src];
              // Only apply ALT if customized?
              if (imgId && customAlts[imgId]) {
                imgEl.alt = customAlts[imgId];
              }
              imgEl.src = uploadedUrls[imgEl.src];
            }
          });
          onLog?.(`🔄 Замінено ${Object.keys(uploadedUrls).length} зображень в HTML editor`);
        }

        // Update state logic
        if (Object.keys(uploadedUrls).length > 0) {
          setLastUploadedUrls(uploadedUrls);
          setLastUploadedSessionId(sessionIdAtStart);
          setReplacementDone(false);
          onUploadedUrlsChange?.(uploadedUrls);

          const altMap: Record<string, string> = {};
          completed.forEach((img) => {
            const storageUrl = uploadedUrls[img.src];
            if (customAlts[img.id] && storageUrl) altMap[storageUrl] = customAlts[img.id];
          });

          onUploadedAltsChange?.(altMap);

          const urlsList = Object.values(uploadedUrls).join("\n");
          copyToClipboard(urlsList);
        }

        const errorCount = results.filter((r) => !r.success).length;
        if (successCount === completed.length) {
          onLog?.(`🎉 Успішно завантажено всі ${successCount} зображень`);
        } else if (successCount > 0) {
          onLog?.(`⚠️ Завантажено ${successCount} з ${completed.length} зображень (${errorCount} помилок)`);
        } else {
          onLog?.(`❌ Не вдалося завантажити жодного зображення`);
        }

        return { results, category, folderName };
      } finally {
        // Always attempt to finalize (close tab) if provider requires it
        if (providerCfg.closeTabAfterBatch) {
          fetch(`${API_URL}/api/storage-upload/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: storageProvider }),
          }).catch((e) => onLog?.(`⚠️ finalize failed: ${e.message}`));
        }

        setIsUploading(false);
        uploadAbortControllerRef.current = null;
      }
    },
    [images, imagesSessionId, isUploading, storageProvider, format, onLog, editorRef, onUploadedUrlsChange, onUploadedAltsChange]
  );

  const handleReplaceInOutput = useCallback(() => {
    if (isUploading) {
      showSnackbar("⏳ Дочекайтесь завершення завантаження", "info");
      return;
    }
    if (lastUploadedSessionId !== imagesSessionId) {
      showSnackbar("⚠️ Немає актуальних URLs. Спочатку Upload.", "warning");
      return;
    }

    const n = Object.keys(lastUploadedUrls).length;
    if (onReplaceUrls && n > 0) {
      onReplaceUrls(lastUploadedUrls);
      setReplacementDone(true);
      onLog?.(`✅ Замінено ${n} посилань в Output`);
      showSnackbar(`🔄 Посилання та ALT тексти замінено (${n})`, "success");
    }
  }, [isUploading, lastUploadedSessionId, imagesSessionId, lastUploadedUrls, onReplaceUrls, onLog, showSnackbar]);

  // Expose methods to reset state
  const resetUploadState = useCallback(() => {
    setLastUploadedSessionId(null);
    setLastUploadedUrls({});
    setReplacementDone(false);
  }, []);
  const resetReplacementOnly = useCallback(() => {
    setReplacementDone(false);
  }, []);

  return {
    isUploading,
    lastUploadedUrls,
    lastUploadedSessionId,
    replacementDone,
    abortUploads,
    handleUploadToStorage,
    handleReplaceInOutput,
    resetUploadState,
    resetReplacementOnly,
  };
}
