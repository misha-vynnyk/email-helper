/**
 * Refactored Compact Image Processor for HTML Converter
 * Extracts and processes images from HTML content
 */
import React, { useState, useEffect } from "react";
import { Check as CheckIcon, X as CloseIcon } from "lucide-react";
import { saveAs } from "file-saver";

import StorageUploadDialog from "./components/StorageUploadDialog";
import { extractFolderName } from "./utils/formatters";
import { getFileExtension, getImageFormat, isCrossOrigin } from "./utils/imageUtils";
import type { ImageAnalysisSettings, ImageFormatOverride, UploadSession } from "./types";
import { useImageConversion } from "./hooks/useImageConversion";
import { useImageUploader } from "./hooks/useImageUploader";
import { useOcrAnalysis } from "./hooks/useOcrAnalysis";
import { ImageGrid } from "./components/ImageGrid";
import { ImageProcessorSettings } from "./components/ImageProcessorSettings";
import { ImageProcessorStats } from "./components/ImageProcessorStats";
import { ImageProcessorActions } from "./components/ImageProcessorActions";
import { HistoryPrompt } from "./components/HistoryPrompt";

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
  uploadHistory?: UploadSession[];
}

export default function ImageProcessor({ editorRef, onLog, visible, onVisibilityChange, triggerExtract = 0, fileName = "", onHistoryAdd, onReplaceUrls, onUploadedUrlsChange, onUploadedAltsChange, onResetReplacement, hasOutput = false, autoProcess: autoProcessProp, storageProvider = "default", imageAnalysisSettings, uploadHistory }: ImageProcessorProps) {
  // 1. Conversion Logic
  const {
    images,
    setImages,
    settings: { format, quality, maxWidth, autoProcess },
    setSettings: { setQuality, setMaxWidth },
    actions: { extractImages, processAllPending, clearImagesAndRevoke, abortConversions },
    sessionId,
  } = useImageConversion({ editorRef, onLog, onVisibilityChange, autoProcessProp });

  // Snackbar local state
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
    lastUploadedUrls,
    replacementDone,
    handleUploadToStorage,
    handleTakeFromHistoryLocally,
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
    uploadHistory,
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const initialFolderName = extractFolderName(fileName);

  // Background AI processor hook logic
  const analysisEnabled = Boolean(imageAnalysisSettings?.enabled && (imageAnalysisSettings.engine === "ocr" || imageAnalysisSettings.useAiBackend));
  
  const processedFiles = React.useMemo(() => {
    return images
      .filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src)))
      .map((img) => ({ id: img.id, name: img.name, path: img.previewUrl, size: img.convertedSize ?? img.originalSize }));
  }, [images]);

  const effectiveAnalysisSettings = React.useMemo(() => {
    if (!imageAnalysisSettings) return undefined;
    const maxFiles = (imageAnalysisSettings.autoAnalyzeMaxFiles && imageAnalysisSettings.autoAnalyzeMaxFiles > 0) 
      ? imageAnalysisSettings.autoAnalyzeMaxFiles 
      : 50;
    
    return {
      ...imageAnalysisSettings,
      autoAnalyzeMaxFiles: imageAnalysisSettings.runMode === "auto" ? maxFiles : 0
    };
  }, [imageAnalysisSettings]);

  const {
    aiById,
    analyzeFile,
    reset: resetOcrState,
  } = useOcrAnalysis({
    enabled: analysisEnabled,
    settings: effectiveAnalysisSettings,
    files: processedFiles,
  });

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
    resetOcrState();
    onVisibilityChange(false);
    onLog && onLog("🗑️ Очищено");
  };

  // Effects
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
      resetOcrState();
    }
  }, [visible, images.length, clearImagesAndRevoke, resetUploadState, resetOcrState]);

  useEffect(() => {
    return () => {
      abortConversions();
      abortUploads();
    };
  }, [abortConversions, abortUploads]);

  // Derived Values
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
  const doneCount = images.filter((img) => (img.status === "done" && img.convertedBlob) || (img.status === "pending" && isCrossOrigin(img.src))).length;
  const pendingCount = images.filter((img) => img.status === "pending").length;
  const lastUploadedCount = Object.keys(lastUploadedUrls).length;

  const matchingHistorySession = React.useMemo(() => {
    if (doneCount === 0) return null;
    const fName = extractFolderName(fileName).trim().toUpperCase();
    if (!fName || !uploadHistory) return null;
    return uploadHistory.find((session) => {
      const sessionFolder = session.folderName || session.files?.[0]?.folderName;
      return sessionFolder?.trim().toUpperCase() === fName && session.files && session.files.length > 0;
    });
  }, [fileName, uploadHistory, doneCount]);

  const handleTakeFromHistory = async () => {
    if (!matchingHistorySession) return;
    const fName = extractFolderName(fileName);
    await handleTakeFromHistoryLocally(fName);
  };

  return (
    <div className='bg-card rounded-2xl p-5 shadow-soft hover:shadow-md border border-border/50 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-foreground'>Обробка зображень</h3>
        {images.length > 0 && (
          <span className='text-xs text-muted-foreground'>
            {doneCount}/{images.length} готово
          </span>
        )}
      </div>

      <ImageProcessorSettings quality={quality} setQuality={setQuality} maxWidth={maxWidth} setMaxWidth={setMaxWidth} />

      <ImageGrid images={images} globalFormat={format} onDownload={handleDownloadSingle} onRemove={handleRemove} onFormatChange={handleFormatChange} />

      <ImageProcessorStats doneCount={doneCount} totalOriginal={totalOriginal} totalConverted={totalConverted} />

      <HistoryPrompt
        matchingHistorySession={matchingHistorySession}
        doneCount={doneCount}
        isUploading={isUploading}
        lastUploadedCount={lastUploadedCount}
        fileNameFolder={extractFolderName(fileName)}
        handleTakeFromHistory={handleTakeFromHistory}
      />

      {/* Success Feedback Banner */}
      {lastUploadedCount > 0 && (
        <div className='p-3 rounded-xl bg-success/15 border border-success/30 flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-2'>
          <div className='p-1.5 bg-success/20 rounded-full text-success shrink-0'>
            <CheckIcon className='w-4 h-4' strokeWidth={3} />
          </div>
          <p className='text-sm text-foreground font-medium'>
            <span className='font-bold text-success'>{lastUploadedCount} URL</span> {hasOutput ? "успішно підставлено у вихідний код!" : "готові в пам'яті! Зробіть експорт HTML/MJML."}
          </p>
        </div>
      )}

      <ImageProcessorActions
        pendingCount={pendingCount}
        autoProcess={autoProcess}
        processAllPending={processAllPending}
        doneCount={doneCount}
        setUploadDialogOpen={setUploadDialogOpen}
        lastUploadedCount={lastUploadedCount}
        hasOutput={hasOutput}
        isUploading={isUploading}
        replacementDone={replacementDone}
        handleReplaceInOutput={handleReplaceInOutput}
        handleClear={handleClear}
      />

      <StorageUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        storageProvider={storageProvider}
        files={processedFiles}
        onUpload={handleUploadToStorage}
        onCancel={() => {
          abortUploads();
          onLog && onLog("⚠️ Завантаження скасовано користувачем");
        }}
        initialFolderName={initialFolderName}
        onHistoryAdd={onHistoryAdd}
        onAltsUpdate={onUploadedAltsChange}
        imageAnalysisSettings={effectiveAnalysisSettings}
        aiById={aiById}
        onAnalyzeFile={analyzeFile}
      />

      {/* Tailwind Custom Snackbar */}
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
