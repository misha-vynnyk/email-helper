import { useCallback, useRef,useState } from "react";

import { getApiBase, isApiAvailable } from "../../config/api";
import { getElectronAPI } from "../../hooks/useElectronAPI";
import { STORAGE_PROVIDERS_CONFIG,STORAGE_URL_PREFIX, UPLOAD_CONFIG } from "../constants";
import { ImageFormat, ProcessedImage, UploadResult, UploadSession } from "../types";
import { copyToClipboard } from "../utils/clipboard";
import { getFileExtension, getImageFormat, isCrossOrigin } from "../utils/imageUtils";
import type { UploadMode } from "./useHtmlConverterLogic";

function findImageInHistory(folderName: string, filename: string, baseName: string, index: number, uploadHistory: UploadSession[]) {
  let existingUrl: string | null = null;
  let existingAlt: string | undefined = undefined;

  for (const session of uploadHistory) {
    const sessionFolder = session.folderName || session.files?.[0]?.folderName;
    if (sessionFolder?.trim().toUpperCase() === folderName.trim().toUpperCase()) {
      let existingFile = session.files.find((f) => f.filename === filename);
      if (!existingFile) existingFile = session.files.find((f) => f.filename.replace(/\.[^/.]+$/, "") === baseName);
      if (!existingFile && index < session.files.length) existingFile = session.files[index];

      if (existingFile) {
        existingUrl = existingFile.url;
        existingAlt = existingFile.alt;
        break;
      }
    }
  }

  return { existingUrl, existingAlt };
}

interface UseImageUploaderProps {
  images: ProcessedImage[];
  imagesSessionId: number;
  storageProvider: string;
  format: ImageFormat;
  onLog?: (message: string) => void;
  onUploadedUrlsChange?: (urlMap: Record<string, string>) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onUploadedAltsChange?: (altMap: Record<string, string>) => void;
  showSnackbar: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
  uploadHistory?: UploadSession[];
  uploadMode?: UploadMode;
  browserExecutablePath?: string;
}

export function useImageUploader({ images, imagesSessionId, storageProvider, format, onLog, onUploadedUrlsChange, onReplaceUrls, onUploadedAltsChange, showSnackbar, uploadHistory, uploadMode = "playwright", browserExecutablePath }: UseImageUploaderProps) {
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
      takeFromHistory: boolean = false,
      onProgress?: (result: { fileId: string; filename: string; url: string; success: boolean; error?: string }) => void
    ): Promise<{
      results: Array<{ filename: string; url: string; success: boolean; error?: string }>;
      category: string;
      folderName: string;
    }> => {
      let completed = takeFromHistory ? images : images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src)));

      if (fileOrder && fileOrder.length > 0) {
        // Filter to only include images in the requested order
        const requestedIds = new Set(fileOrder);
        completed = completed.filter((img) => requestedIds.has(img.id));

        // Then sort...
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
      let skippedCount = 0;

      // Local helper with closure access
      const getTempPathInner = async (image: ProcessedImage, fname: string): Promise<string> => {
        const signal = uploadAbortControllerRef.current?.signal;
        if (image.convertedBlob) {
          const formData = new FormData();
          formData.append("file", image.convertedBlob, fname);
          formData.append("category", category);
          formData.append("folderName", folderName);
          const res = await Promise.race([
            fetch(`${getApiBase()}/api/storage-upload/prepare`, {
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
          fetch(`${getApiBase()}/api/storage-upload/prepare-from-url`, {
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

          if (takeFromHistory && uploadHistory) {
            const { existingUrl, existingAlt } = findImageInHistory(folderName, filename, baseName, i, uploadHistory);

            if (existingUrl) {
              onLog?.(`🔁 [${i + 1}/${completed.length}] ${filename} знайдено в історії (реюз URLs)`);
              uploadedUrls[img.src] = existingUrl;
              if (existingAlt) customAlts[img.id] = existingAlt;
              successCount++;
              const resObj = { fileId: img.id, filename, url: existingUrl, success: true };
              results.push(resObj);
              onProgress?.(resObj);
            } else {
              onLog?.(`⚠️ [${i + 1}/${completed.length}] ${baseName} не знайдено в історії. Пропущено.`);
              const resObj = { fileId: img.id, filename, url: "", success: false, error: "Не знайдено в історії" };
              results.push(resObj);
              onProgress?.(resObj);
            }
            continue; // CRITICAL: Skip the rest of the loop so it NEVER uploads to storage!
          }

          if (uploadAbortControllerRef.current?.signal.aborted) {
            onLog?.(`⚠️ Завантаження скасовано користувачем`);
            throw new Error("Завантаження скасовано");
          }

          try {
            onLog?.(`📤 [${i + 1}/${completed.length}] Завантаження ${filename}...`);
            const tempPath = await getTempPathInner(img, filename);

            let result: { success?: boolean; filePath?: string; publicUrl?: string; error?: string; skipped?: boolean; cancelled?: boolean } = {};

            if (uploadMode === "electron") {
              const electronAPI = getElectronAPI();
              if (!electronAPI) throw new Error("Electron API недоступний");
              result = await Promise.race([
                electronAPI.uploadFile({ tempPath, provider: storageProvider, category, folderName }),
                createTimeout(UPLOAD_CONFIG.STORAGE_TIMEOUT, "Timeout: electron upload не відповідає (180s)"),
              ]);
              if (!result.success) {
                const uploadError = new Error(result.error || "Electron upload failed") as Error & { cancelled?: boolean };
                if (result.cancelled) uploadError.cancelled = true;
                throw uploadError;
              }
            } else {
              const storageResponse = await Promise.race([
                fetch(`${getApiBase()}/api/storage-upload`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    filePath: tempPath,
                    provider: storageProvider,
                    category,
                    folderName,
                    skipConfirmation: true,
                    browserExecutablePath: browserExecutablePath || undefined,
                  }),
                  signal: uploadAbortControllerRef.current.signal,
                }),
                createTimeout(UPLOAD_CONFIG.STORAGE_TIMEOUT, "Timeout: storage не відповідає (180s)"),
              ]);
              try {
                result = await storageResponse.json();
              } catch {
                // ignore parse error if ok
              }
              if (!storageResponse.ok) {
                const uploadError = new Error(result.error || `Storage HTTP ${storageResponse.status}`) as Error & { cancelled?: boolean };
                if (result.cancelled) uploadError.cancelled = true;
                throw uploadError;
              }
            }

            if (result.filePath) {
              const fullUrl = result.publicUrl || `${STORAGE_URL_PREFIX}${result.filePath}`;
              uploadedUrls[img.src] = fullUrl;
              if (result.skipped) {
                skippedCount++;
                onLog?.(`⚠️ [${i + 1}/${completed.length}] ${filename}: вже існує (пропущено)`);
                const resObj = { fileId: img.id, filename, url: fullUrl, success: true, skipped: true };
                results.push(resObj);
                onProgress?.(resObj);
              } else {
                successCount++;
                onLog?.(`✅ [${i + 1}/${completed.length}] ${filename} → storage`);
                const resObj = { fileId: img.id, filename, url: fullUrl, success: true };
                results.push(resObj);
                onProgress?.(resObj);
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            if ((error as { fatal?: boolean } | null)?.fatal) throw error;

            const resObj = { fileId: img.id, filename, url: "", success: false, error: errorMsg };
            results.push(resObj);
            onProgress?.(resObj);

            // Either the abort controller was tripped (fetch-based upload) or the
            // user closed the native upload window (Electron) — stop the batch
            // instead of opening the next file's window.
            const wasCancelled = errorMsg === "Завантаження скасовано" || (error as { cancelled?: boolean } | null)?.cancelled === true;
            if (wasCancelled) {
              uploadAbortControllerRef.current?.abort();
              throw error;
            }
            onLog?.(`❌ ${filename}: ${errorMsg}`);
            continue;
          }
        }

        // DOM Replace was intentionally removed to avoid modifying the visual editor.
        // All mapping is deferred to the output fields (`onReplaceUrls`) after HTML Conversion.

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
        const totalDone = successCount + skippedCount;
        if (successCount === completed.length) {
          onLog?.(`🎉 Успішно завантажено всі ${successCount} зображень`);
        } else if (totalDone === completed.length && skippedCount > 0) {
          onLog?.(`⚠️ Завантажено ${successCount}, пропущено (вже існують): ${skippedCount}`);
        } else if (totalDone > 0) {
          onLog?.(`⚠️ Завантажено ${successCount}, пропущено ${skippedCount}, помилок: ${errorCount}`);
        } else {
          onLog?.(`❌ Не вдалося завантажити жодного зображення`);
        }

        return { results, category, folderName };
      } finally {
        // Finalize closes the Playwright-controlled Brave tab after a batch.
        // Electron mode manages its own window lifecycle (see uploadManager.ts)
        // and never touches Brave, so calling this would launch Brave for nothing.
        if (uploadMode !== "electron" && providerCfg.closeTabAfterBatch) {
          fetch(`${getApiBase()}/api/storage-upload/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: storageProvider, browserExecutablePath: browserExecutablePath || undefined }),
          }).catch((e) => onLog?.(`⚠️ finalize failed: ${e.message}`));
        }

        setIsUploading(false);
        uploadAbortControllerRef.current = null;
      }
    },
    [images, imagesSessionId, isUploading, storageProvider, format, onLog, onUploadedUrlsChange, onUploadedAltsChange, uploadHistory, uploadMode, browserExecutablePath]
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

  const handleTakeFromHistoryLocally = useCallback(
    async (folderName: string) => {
      const completed = images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src)));
      if (completed.length === 0 || !uploadHistory) return;

      const sessionIdAtStart = imagesSessionId;
      setLastUploadedSessionId(null);
      setLastUploadedUrls({});
      setReplacementDone(false);
      onUploadedUrlsChange?.({});

      const uploadedUrls: Record<string, string> = {};
      const customAlts: Record<string, string> = {};
      let successCount = 0;

      onLog?.(`⏳ Шукаю ${completed.length} зображень в історії для папки ${folderName}...`);

      for (let i = 0; i < completed.length; i++) {
        const img = completed[i];
        const baseName = img.name;
        const fmt = img.convertedBlob ? getImageFormat(img, format) : "png";
        const ext = img.convertedBlob ? getFileExtension(fmt) : `.${/\.(png|jpe?g|webp|gif)(?=\?|$)/i.exec(img.src)?.[1] || "png"}`;
        const filename = `${baseName}${ext}`;

        const { existingUrl, existingAlt } = findImageInHistory(folderName, filename, baseName, i, uploadHistory);

        if (existingUrl) {
          onLog?.(`🔁 [${i + 1}/${completed.length}] ${filename} знайдено в історії`);
          uploadedUrls[img.src] = existingUrl;
          if (existingAlt) customAlts[img.id] = existingAlt;
          successCount++;
        } else {
          onLog?.(`⚠️ [${i + 1}/${completed.length}] ${baseName} відсутнє в історії.`);
        }
      }

      // Update States
      if (Object.keys(uploadedUrls).length > 0) {
        setLastUploadedUrls(uploadedUrls);
        setLastUploadedSessionId(sessionIdAtStart);
        onUploadedUrlsChange?.(uploadedUrls);

        const altMap: Record<string, string> = {};
        completed.forEach((img) => {
          const storageUrl = uploadedUrls[img.src];
          if (customAlts[img.id] && storageUrl) altMap[storageUrl] = customAlts[img.id];
        });
        onUploadedAltsChange?.(altMap);

        // Automatically substitute into the output files (html/mjml)
        if (onReplaceUrls) {
          onReplaceUrls(uploadedUrls);
          setReplacementDone(true);
        }

        const urlsList = Object.values(uploadedUrls).join("\n");
        copyToClipboard(urlsList);
      }

      if (successCount === completed.length) {
        onLog?.(`🎉 Успішно підставлено всі ${successCount} зображень з історії`);
        showSnackbar(`🎉 Історію відновлено: ${successCount} ${successCount === 1 ? "файл" : "файлів"}`, "success");
      } else if (successCount > 0) {
        onLog?.(`⚠️ Підставлено ${successCount} з ${completed.length} зображень`);
        showSnackbar(`⚠️ Історію відновлено частково: ${successCount} з ${completed.length}`, "warning");
      } else {
        onLog?.(`❌ Історія порожня для цих файлів`);
        showSnackbar("❌ Дані в історії для цих файлів відсутні", "error");
      }
    },
    [images, imagesSessionId, format, onLog, onUploadedUrlsChange, onUploadedAltsChange, uploadHistory, onReplaceUrls, showSnackbar]
  );

  return {
    isUploading,
    lastUploadedUrls,
    lastUploadedSessionId,
    replacementDone,
    abortUploads,
    handleUploadToStorage,
    handleTakeFromHistoryLocally,
    handleReplaceInOutput,
    resetUploadState,
    resetReplacementOnly,
  };
}
