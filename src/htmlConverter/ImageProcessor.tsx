/**
 * Compact Image Processor for HTML Converter
 * Extracts and processes images from HTML content
 */

import React, { useState, useEffect } from "react";
import { Play as ProcessIcon, Upload as UploadIcon, Replace as ReplaceIcon, Check as CheckIcon, X as CloseIcon } from "lucide-react";
import { saveAs } from "file-saver";
import StorageUploadDialog from "./StorageUploadDialog";
import { formatSize, extractFolderName } from "./utils/formatters";
import { getFileExtension, getImageFormat, isCrossOrigin } from "./imageUtils"; // getImageFormat needed for download
import type { ImageAnalysisSettings, ImageFormatOverride } from "./types";
import { useImageConversion } from "./hooks/useImageConversion";
import { useImageUploader } from "./hooks/useImageUploader";
import { ImageGrid } from "./components/ImageGrid";

interface ImageProcessorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onLog?: (message: string) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  triggerExtract?: number;
  fileName?: string;
  onHistoryAdd?: (category: string, folderName: string, results: Array<{ filename: string; url: string; success: boolean }>, customAlts?: Record<string, string>) => void;
  onReplaceUrls?: (urlMap: Record<string, string>) => void;
  onUploadedUrlsChange?: (urlMap: Record<string, string>) => void;
  onUploadedAltsChange?: (altMap: Record<string, string>) => void;
  onResetReplacement?: (resetFn: () => void) => void;
  hasOutput?: boolean;
  autoProcess?: boolean;
  storageProvider?: "default" | "alphaone";
  imageAnalysisSettings?: ImageAnalysisSettings;
}

export default function ImageProcessor({ editorRef, onLog, visible, onVisibilityChange, triggerExtract = 0, fileName = "", onHistoryAdd, onReplaceUrls, onUploadedUrlsChange, onUploadedAltsChange, onResetReplacement, hasOutput = false, autoProcess: autoProcessProp, storageProvider = "default", imageAnalysisSettings }: ImageProcessorProps) {
  // 1. Conversion Logic
  const {
    images,
    setImages, // needed for download/remove/format overrides
    settings: { format, quality, maxWidth, autoProcess },
    setSettings: { setQuality, setMaxWidth },
    actions: { extractImages, processAllPending, clearImagesAndRevoke, abortConversions },
    sessionId,
  } = useImageConversion({ editorRef, onLog, onVisibilityChange, autoProcessProp });

  // Snackbar local state (shared usage)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({ open: false, message: "", severity: "success" });

  const showSnackbar = (message: string, severity: "success" | "info" | "warning" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // 2. Upload Logic
  const {
    isUploading,
    lastUploadedUrls, // used for stats/ui
    replacementDone,
    handleUploadToStorage,
    handleReplaceInOutput,
    abortUploads,
    resetUploadState,
    resetReplacementOnly,
  } = useImageUploader({
    images,
    imagesSessionId: sessionId,
    editorRef,
    storageProvider,
    format,
    onLog,
    onUploadedUrlsChange,
    onReplaceUrls,
    onUploadedAltsChange,
    showSnackbar,
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const initialFolderName = extractFolderName(fileName);

  // Handlers for UI
  const handleDownloadSingle = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img || !img.convertedBlob) return;
    const imgFormat = getImageFormat(img, format);
    const ext = getFileExtension(imgFormat);
    saveAs(img.convertedBlob, `${img.name}${ext}`);
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) onVisibilityChange(false);
      return next;
    });
  };

  const handleFormatChange = (id: string, fmt: ImageFormatOverride) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return {
          ...img,
          formatOverride: fmt,
          // If format changes, reset status to allow re-processing?
          // Or user has to click "Process Again"?
          // Old code didn't reset status. It just updated prop.
          // But 'getImageFormat' would change result.
          // ProcessImage uses current state.
          status: img.status === "done" ? "pending" : img.status,
          convertedBlob: undefined,
          convertedSize: undefined,
        };
      })
    );
  };

  const handleClear = () => {
    abortConversions();
    abortUploads();
    clearImagesAndRevoke();
    resetUploadState();
    onVisibilityChange(false);
    onLog && onLog("🗑️ Очищено");
  };

  // Integration Effects
  useEffect(() => {
    if (triggerExtract > 0 && visible) {
      extractImages();
    }
  }, [triggerExtract, visible, extractImages]);

  useEffect(() => {
    if (onResetReplacement) {
      onResetReplacement(() => resetReplacementOnly());
    }
  }, [onResetReplacement, resetReplacementOnly]);

  useEffect(() => {
    if (!visible && images.length > 0) {
      clearImagesAndRevoke();
      resetUploadState();
    }
  }, [visible, images.length, clearImagesAndRevoke, resetUploadState]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      abortConversions();
      abortUploads();
    };
  }, [abortConversions, abortUploads]);

  // Derived
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
  const doneCount = images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src))).length; // approximation
  const pendingCount = images.filter((img) => img.status === "pending").length;
  const lastUploadedCount = Object.keys(lastUploadedUrls).length;

  return (
    <div className='bg-card rounded-2xl p-5 shadow-soft border border-border/50 flex flex-col gap-4 relative overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-foreground'>Обробка зображень</h3>
        {images.length > 0 && (
          <span className='text-xs text-muted-foreground'>
            {doneCount}/{images.length} готово
          </span>
        )}
      </div>

      {/* Settings Row */}
      <div className='flex flex-wrap gap-6 items-start'>
        <div className='flex-1 min-w-[150px]'>
          <div className='flex justify-between items-center mb-1.5'>
            <span className='text-xs text-muted-foreground'>Якість:</span>
            <span className='text-xs font-semibold text-primary'>{quality}%</span>
          </div>
          <input type='range' min='60' max='100' value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className='w-full accent-primary cursor-pointer' />
        </div>
        <div className='flex-1 min-w-[150px]'>
          <div className='flex justify-between items-center mb-1.5'>
            <span className='text-xs text-muted-foreground'>Макс. ширина:</span>
            <span className='text-xs font-semibold text-primary'>{maxWidth}px</span>
          </div>
          <input type='range' min='300' max='1200' step='100' value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))} className='w-full accent-primary cursor-pointer' />
        </div>
      </div>

      <ImageGrid images={images} globalFormat={format} onDownload={handleDownloadSingle} onRemove={handleRemove} onFormatChange={handleFormatChange} />

      {/* Stats */}
      {doneCount > 0 && (
        <div className='mt-2 p-2 rounded-lg bg-muted/30 border border-border/50'>
          <span className='text-xs text-muted-foreground'>
            💾 {formatSize(totalOriginal)} → {formatSize(totalConverted)} ({totalOriginal > 0 ? `-${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%` : "0%"})
          </span>
        </div>
      )}

      {/* Actions */}
      <div className='flex flex-row gap-2 mt-2'>
        {pendingCount > 0 && !autoProcess && (
          <button onClick={processAllPending} className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-lg border border-border/50 font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm'>
            <ProcessIcon size={16} />
            Обробити все ({pendingCount})
          </button>
        )}

        <button onClick={() => setUploadDialogOpen(true)} disabled={doneCount === 0} className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'>
          <UploadIcon size={16} />
          Upload to Storage ({doneCount})
        </button>

        {lastUploadedCount > 0 && (
          <button
            title={!hasOutput ? "Спочатку експортуйте HTML або MJML" : isUploading ? "Йде завантаження..." : replacementDone ? "URLs вже замінені" : "Замінити зображення на storage URLs"}
            onClick={handleReplaceInOutput}
            disabled={replacementDone || !hasOutput || isUploading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${replacementDone ? "bg-success text-white" : "bg-card border border-border/50 text-foreground hover:bg-muted"}`}>
            {replacementDone ? <CheckIcon size={16} /> : <ReplaceIcon size={16} />}
            {replacementDone ? `✓ Замінено (${lastUploadedCount})` : `Замінити (${lastUploadedCount})`}
          </button>
        )}

        <button onClick={handleClear} className='flex items-center justify-center px-4 py-2 bg-card border border-border/50 hover:bg-muted text-foreground rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm'>
          Очистити
        </button>
      </div>

      <StorageUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        storageProvider={storageProvider}
        files={images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src))).map((img) => ({ id: img.id, name: img.name, path: img.previewUrl, size: img.convertedSize ?? img.originalSize }))}
        onUpload={handleUploadToStorage}
        onCancel={() => {
          abortUploads();
          onLog && onLog("⚠️ Завантаження скасовано користувачем");
        }}
        initialFolderName={initialFolderName}
        onHistoryAdd={onHistoryAdd}
        onAltsUpdate={onUploadedAltsChange}
        imageAnalysisSettings={imageAnalysisSettings}
      />

      {/* Tailwind Custom Snackbar/Toast */}
      {snackbar.open && (
        <div className='fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5'>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${snackbar.severity === "success" ? "bg-success/10 border-success/20 text-success" : snackbar.severity === "error" ? "bg-destructive/10 border-destructive/20 text-destructive" : snackbar.severity === "warning" ? "bg-warning/10 border-warning/20 text-warning-foreground" : "bg-card border-border text-foreground"}`}>
            <span className='text-sm font-medium'>{snackbar.message}</span>
            <button onClick={() => setSnackbar((p) => ({ ...p, open: false }))} className='text-current/60 hover:text-current'>
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
