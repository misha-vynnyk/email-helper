import React, { useState, useEffect, useCallback, useRef } from "react";
import { Upload as UploadIcon, CheckCircle as SuccessIcon, AlertCircle as ErrorIcon, X as CloseIcon } from "lucide-react";

import { useOcrAnalysis } from "../hooks/useOcrAnalysis";
import { useHtmlConverterSettings } from "../hooks/useHtmlConverterSettings";
import { UI_TIMINGS, STORAGE_PROVIDERS_CONFIG, FOLDER_NAME_REGEX, STORAGE_KEYS } from "../constants";
import { copyToClipboard } from "../utils/clipboard";
import type { ImageAnalysisSettings, UploadResult } from "../types";
import type { StorageProviderKey } from "../constants";
import { UploadResults, toShortPath } from "./UploadResults";
import FileListItem from "./FileListItem";

interface StorageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  storageProvider?: StorageProviderKey;
  files: Array<{ id: string; name: string; path?: string; size?: number }>;
  onUpload: (category: string, folderName: string, customNames: Record<string, string>, customAlts: Record<string, string>, fileOrder?: string[], takeFromHistory?: boolean, onProgress?: (result: UploadResult) => void) => Promise<{ results: UploadResult[]; category: string; folderName: string }>;
  onCancel?: () => void;
  initialFolderName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: UploadResult[], customAlts?: Record<string, string>) => void;
  onAltsUpdate?: (altMap: Record<string, string>) => void;
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function StorageUploadDialog({ open, onClose, storageProvider = "default", files, onUpload, onCancel, initialFolderName = "", onHistoryAdd, onAltsUpdate, imageAnalysisSettings }: StorageUploadDialogProps) {
  const { ui } = useHtmlConverterSettings();

  const providerCfg = STORAGE_PROVIDERS_CONFIG.providers[storageProvider] || STORAGE_PROVIDERS_CONFIG.providers.default;
  const showCategory = providerCfg.usesCategory;

  const categories = (showCategory && providerCfg.categories && providerCfg.categories.length > 0 ? providerCfg.categories : STORAGE_PROVIDERS_CONFIG.providers.default.categories) || ["finance", "health"];
  const defaultCategory = (showCategory && providerCfg.defaultCategory) || STORAGE_PROVIDERS_CONFIG.providers.default.defaultCategory || categories[0] || "finance";

  const [category, setCategory] = useState<string>(defaultCategory);
  const [folderName, setFolderName] = useState<string>("");
  const [takeFromHistory] = useState(false); // Can be kept for regular flow compatibility if needed, but not exposed in UI anymore
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [customAlts, setCustomAlts] = useState<Record<string, string>>({});
  const [orderedFiles, setOrderedFiles] = useState(files);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState<{ fileId: string; tagIdx: number } | null>(null);

  // Refs for handleClose to access the latest state without closure staleness
  const latestResultsRef = useRef<UploadResult[]>(uploadResults);
  latestResultsRef.current = uploadResults;
  const latestCategoryRef = useRef<string>(category);
  latestCategoryRef.current = category;
  const latestFolderNameRef = useRef<string>(folderName);
  latestFolderNameRef.current = folderName;
  const latestAltsRef = useRef<Record<string, string>>(customAlts);
  latestAltsRef.current = customAlts;

  const analysisEnabled = Boolean(imageAnalysisSettings?.enabled && (imageAnalysisSettings.engine === "ocr" || imageAnalysisSettings.useAiBackend));
  const analysisLabel = imageAnalysisSettings?.useAiBackend ? "Analyze (AI)" : "Analyze (OCR)";

  // AI (step 1): OCR-based suggestions (configured globally in HtmlConverterPanel)
  const {
    aiById,
    analyzeFile,
    reset: resetOcrState,
    dispose: disposeOcr,
  } = useOcrAnalysis({
    enabled: analysisEnabled,
    settings: imageAnalysisSettings,
    files: orderedFiles,
  });

  const handleAnalyzeFile = useCallback(
    async (file: { id: string; name: string; path?: string; size?: number }, opts?: { force?: boolean }) => {
      await analyzeFile(file, { force: opts?.force });
    },
    [analyzeFile]
  );

  // Sync orderedFiles when files prop changes, but ONLY when dialog is closed
  useEffect(() => {
    if (!open) {
      setOrderedFiles(files);
    }
  }, [files, open]);

  // Reset per-open transient state
  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploadResults([]);
    setCopiedUrl(null);
    setCustomNames({});
    setCustomAlts({});
    setEditingTag(null);
    resetOcrState();
  }, [open]);

  // Propagate ALT text changes to parent
  useEffect(() => {
    if (onAltsUpdate) onAltsUpdate(customAlts);
  }, [customAlts, onAltsUpdate]);

  // Reset category when provider changes
  useEffect(() => {
    if (!showCategory) return;
    setCategory((prev) => (categories.includes(prev) ? prev : defaultCategory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageProvider]);

  // Auto-fill from initialFolderName or clipboard on mount
  useEffect(() => {
    if (open) {
      // Priority 1: Use initialFolderName from fileName input
      if (initialFolderName && FOLDER_NAME_REGEX.test(initialFolderName)) {
        setFolderName(initialFolderName);
        return;
      }

      // Priority 2: Try to get from clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard
          .readText()
          .then((text) => {
            // Check if clipboard contains valid format (e.g., "ABCD123")
            if (FOLDER_NAME_REGEX.test(text.trim())) {
              setFolderName(text.trim());
            }
          })
          .catch((err) => {
            // Clipboard API not available, permission denied, or document not focused
            console.debug("Clipboard read failed:", err.message || err);
          });
      }
    }
  }, [open, initialFolderName]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...orderedFiles];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);

    setOrderedFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveFile = (fileId: string) => {
    setOrderedFiles((prev) => prev.filter((f) => f.id !== fileId));
    // also remove from customNames/Alts if you want, but they're harmless
  };

  const handleUpload = async (overrideTakeFromHistory: boolean = false) => {
    setError(null);

    // Validation
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    if (!FOLDER_NAME_REGEX.test(folderName)) {
      setError("Invalid format. Expected: Letters + Numbers (e.g., ABCD123)");
      return;
    }

    setUploading(true);

    try {
      const fileOrder = orderedFiles.map((f) => f.id);
      const effectiveCategory = showCategory ? category : "finance";
      const finalTakeFromHistory = overrideTakeFromHistory || takeFromHistory;

      const response = await onUpload(effectiveCategory, folderName.trim(), customNames, customAlts, fileOrder, finalTakeFromHistory, (progressResult) => {
        setUploadResults((prev) => {
          // Replace previous attempt if exists (to maintain order), otherwise append
          const idx = prev.findIndex((r) => r.fileId === progressResult.fileId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = progressResult;
            return copy;
          }
          return [...prev, progressResult];
        });

        // Also dynamically remove from orderedFiles on success
        if (progressResult.success) {
          setOrderedFiles((prev) => prev.filter((f) => f.id !== progressResult.fileId));
        }
      });

      // Remove successful uploads from orderedFiles to prepare for potential retry of failed ones
      const successfulIds = new Set(response.results.filter((r) => r.success).map((r) => r.fileId));
      if (successfulIds.size > 0 && response.results.some((r) => !r.success)) {
        setOrderedFiles((prev) => prev.filter((f) => !successfulIds.has(f.id)));
      } else if (successfulIds.size === response.results.length) {
        // all successful, clear orderedFiles
        setOrderedFiles([]);
      }

      // Read fresh UI settings directly from localStorage to handle if user toggled it without unmounting this dialog
      const rawUi = localStorage.getItem(STORAGE_KEYS.UI_SETTINGS);
      const isAutoCloseEnabled = rawUi ? JSON.parse(rawUi).autoCloseUploadDialog !== false : ui.autoCloseUploadDialog;

      // Auto-close if all files in this batch succeeded AND the fresh setting is enabled
      if (successfulIds.size === response.results.length && isAutoCloseEnabled) {
        // Use timeout 0 to let React flush the final successful states before closing,
        // avoiding UI flashes of the success screen.
        setTimeout(() => {
          handleClose();
        }, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      // If uploading, trigger cancel instead of close
      handleCancel();
    } else {
      const currentResults = latestResultsRef.current;
      const successfulUploads = currentResults.filter((r) => r.success);

      // Save all successes in THIS dialog session to history right before closing
      if (onHistoryAdd && successfulUploads.length > 0) {
        const effectiveCategory = showCategory ? latestCategoryRef.current : "finance";
        onHistoryAdd(effectiveCategory, latestFolderNameRef.current.trim(), successfulUploads, latestAltsRef.current);
      }

      onClose();
      setError(null);
      setUploadResults([]);
      setCopiedUrl(null);
      setCustomNames({});
      setCustomAlts({});
      disposeOcr();
    }
  };

  const handleCancel = () => {
    if (uploading && onCancel) {
      onCancel();
      setError("Upload cancelled");
      setUploading(false);
    }
  };

  const handleCopyUrl = async (url: string, isShortPath = false) => {
    const textToCopy = isShortPath ? toShortPath(url) : url;

    const copiedKey = isShortPath ? `${url}-short` : url;

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedUrl(copiedKey);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  const handleCopyAllUrls = async (isShortPath = false) => {
    const urls = uploadResults
      .filter((r) => r.success)
      .map((r) => (isShortPath ? toShortPath(r.url) : r.url))
      .join("\n");

    const copiedKey = isShortPath ? "all-short" : "all";

    const success = await copyToClipboard(urls);
    if (success) {
      setCopiedUrl(copiedKey);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  // If not open, don't render anything
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity' onClick={!uploading ? handleClose : undefined} />

      {/* Dialog Container */}
      <div className='relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-soft flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border/50'>
          <div className='flex items-center gap-2'>
            {orderedFiles.length === 0 && uploadResults.length > 0 ? <SuccessIcon className='text-success' size={24} /> : <UploadIcon className='text-primary' size={24} />}
            <h2 className='text-lg font-semibold text-foreground'>{orderedFiles.length === 0 && uploadResults.length > 0 ? "Upload Complete" : uploadResults.some((r) => r.success) ? "Partial Upload Complete" : "Upload to Storage"}</h2>
          </div>
          <button onClick={handleClose} disabled={uploading} className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[70vh]'>
          <div className='flex flex-col gap-6'>
            {/* Folder Name Input (Always Visible) */}
            <div className='mb-4'>
              <label htmlFor='folderName' className='block text-sm font-semibold text-foreground mb-1.5'>
                Folder Name
              </label>
              <input
                id='folderName'
                type='text'
                placeholder='e.g., ABCD123'
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                disabled={uploading}
                autoFocus
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${folderName.trim() && !FOLDER_NAME_REGEX.test(folderName) ? "border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive placeholder:text-destructive/50" : "border-input focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"}`}
              />
              <p className={`mt-1.5 text-xs ${folderName.trim() && !FOLDER_NAME_REGEX.test(folderName) ? "text-destructive" : "text-muted-foreground"}`}>{folderName.trim() && !FOLDER_NAME_REGEX.test(folderName) ? "Invalid format. Use letters and numbers only." : "Format: Letters + Numbers (e.g., ABCD123, Finance456)"}</p>
            </div>

            {/* Hide file list via CSS rather than unmounting */}
            <div className={orderedFiles.length > 0 ? "block" : "hidden"}>
              {/* Files list with thumbnails, rename, and drag & drop */}
              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm font-medium text-muted-foreground'>Files to upload ({orderedFiles.length}):</span>
                  {analysisEnabled && orderedFiles.length > 1 && (
                    <button
                      onClick={async () => {
                        for (const f of orderedFiles) await handleAnalyzeFile(f);
                      }}
                      disabled={uploading || orderedFiles.some((f) => aiById[f.id]?.status === "running")}
                      className='px-3 py-1.5 text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed'>
                      {orderedFiles.some((f) => aiById[f.id]?.status === "running") ? "Analyzing…" : `${analysisLabel.replace("Analyze", "Analyze All")} (${orderedFiles.length})`}
                    </button>
                  )}
                </div>

                <div className='flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent'>
                  {orderedFiles.map((file, index) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      index={index}
                      uploading={uploading}
                      draggedIndex={draggedIndex}
                      customName={customNames[file.id] || ""}
                      customAltString={customAlts[file.id] || ""}
                      aiState={aiById[file.id]}
                      analysisEnabled={analysisEnabled}
                      analysisLabel={analysisLabel}
                      editingTag={editingTag}
                      useAiBackend={imageAnalysisSettings?.useAiBackend}
                      warningFileSizeKB={ui.warningFileSizeKB}
                      onNameChange={(fileId: string, value: string) => setCustomNames((prev) => ({ ...prev, [fileId]: value }))}
                      onAltChange={(fileId: string, newAltString: string) => setCustomAlts((prev) => ({ ...prev, [fileId]: newAltString }))}
                      onEditingTagChange={setEditingTag}
                      onAnalyze={handleAnalyzeFile}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onRemove={() => handleRemoveFile(file.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              {showCategory && (
                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-foreground mb-2'>Category</label>
                  <div className='flex flex-wrap gap-4'>
                    {categories.map((c) => (
                      <label key={c} className='flex items-center gap-2 cursor-pointer'>
                        <input type='radio' name='category' value={c} checked={category === c} onChange={(e) => setCategory(e.target.value)} className='w-4 h-4 text-primary border-muted focus:ring-primary/20 bg-background accent-primary' />
                        <span className='text-sm text-foreground'>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Path Preview continues below */}

              {/* Upload Path Preview */}
              {folderName && FOLDER_NAME_REGEX.test(folderName) && (
                <div className='p-3 mb-4 rounded-lg bg-info/10 text-info border border-info/20'>
                  <p className='text-xs font-mono break-all'>
                    <strong className='font-semibold mr-1'>Upload path:</strong>
                    <br />
                    {(() => {
                      const letters = folderName.replace(/[^a-zA-Z]/g, "").toLowerCase();
                      const digits = folderName.replace(/[^0-9]/g, "");
                      const parts = [providerCfg.publicRootPrefix];
                      if (showCategory) parts.push(category);
                      parts.push(letters, `lift-${digits}`);
                      return `${parts.filter(Boolean).join("/")}/`;
                    })()}
                  </p>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className='p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4'>
                  <div className='h-1.5 w-full bg-primary/20 rounded-full overflow-hidden mb-2'>
                    <div className='h-full bg-primary rounded-full w-full animate-pulse origin-left'></div>
                  </div>
                  <p className='text-xs text-center text-muted-foreground font-medium'>Uploading files...</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className='flex items-start gap-3 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20'>
                  <ErrorIcon className='shrink-0 mt-0.5' size={18} />
                  <p className='text-sm font-medium'>{error}</p>
                </div>
              )}
            </div>

            {/* Upload Results (only show successful ones when retrying) */}
            {uploadResults.some((r) => r.success) && <UploadResults results={uploadResults.filter((r) => r.success)} copiedUrl={copiedUrl} onCopyUrl={handleCopyUrl} onCopyAllUrls={handleCopyAllUrls} />}
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/20'>
          {orderedFiles.length === 0 && uploadResults.length > 0 ? (
            // After upload is fully complete (no pending files)
            <button onClick={handleClose} className='w-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-sm'>
              Done
            </button>
          ) : (
            // Before/during upload or if there are files left to process
            <>
              <button onClick={() => handleClose()} className={`px-4 py-2 text-sm rounded-lg transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${uploading ? "border border-destructive text-destructive hover:bg-destructive/10 focus-visible:ring-destructive font-semibold" : "text-muted-foreground hover:bg-muted font-medium focus-visible:ring-primary/50"}`}>
                {uploadResults.some((r: UploadResult) => r.success) ? "Close" : "Cancel"}
              </button>

              <button onClick={() => handleUpload(false)} disabled={uploading || orderedFiles.length === 0 || !folderName.trim() || !FOLDER_NAME_REGEX.test(folderName)} className='flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed'>
                <UploadIcon size={18} />
                {uploading ? "Uploading..." : uploadResults.some((r: UploadResult) => !r.success) ? "Retry Failed" : "Upload"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
