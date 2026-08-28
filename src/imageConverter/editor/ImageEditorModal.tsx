/**
 * Per-file image editor modal — opened from the file card. Always crops against the
 * pristine original (`file.edit?.originalFile ?? file.file`), never against a
 * previously-cropped result, so the stored crop rect and "reset to original" stay
 * meaningful across repeated edits.
 *
 * Crop and background removal used to live on separate tabs, each swapping out the
 * entire canvas. They're now one persistent stage (EditorStage) with a single tool
 * switcher (EditorToolbar: Crop / Wand / Eraser) — switching tools no longer hides
 * the other edit's result, so a crop can be framed against an already-cut-out
 * subject and vice versa.
 */

import { Crop, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BackgroundEditState, BackgroundOperation, BackgroundReplaceMode, CropRect, ImageEditState, ImageFile } from "../types";
import { detectImageFormat } from "../utils/imageFormatDetector";
import { applyCropToImage } from "./applyEditToImage";
import BackgroundOptions from "./BackgroundOptions";
import { applyBackgroundRemoval } from "./bgRemoval/applyBackgroundRemoval";
import BeforeAfterPreview from "./BeforeAfterPreview";
import { defaultCropRect, isFullRect } from "./cropMath";
import EditorStage, { EditorTool } from "./EditorStage";
import EditorToolbar from "./EditorToolbar";

const DEFAULT_BRUSH_RADIUS = 0.03;

interface ImageEditorModalProps {
  file: ImageFile;
  onApply: (newFile: File, edit: ImageEditState | undefined) => void;
  onClose: () => void;
}

export default function ImageEditorModal({ file, onApply, onClose }: ImageEditorModalProps) {
  const baseFile = file.edit?.originalFile ?? file.file;

  // Object URLs must be created AND revoked inside the same effect instance — React
  // StrictMode's dev-only mount→cleanup→mount dance would otherwise revoke a URL
  // created during render (or in a cleanup-only effect) before it's ever painted.
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(baseFile);
    setBaseImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [baseFile]);

  const [rect, setRect] = useState<CropRect>(file.edit?.crop ?? defaultCropRect());
  const [background, setBackground] = useState<BackgroundEditState | undefined>(file.edit?.background);
  const [activeTool, setActiveTool] = useState<EditorTool>("crop");
  const [eraserMode, setEraserMode] = useState<"erase" | "restore">("erase");
  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_RADIUS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [review, setReview] = useState<{ file: File; url: string } | null>(null);

  // GIF background removal is Phase 4 — the Wand/Eraser tools are hidden entirely
  // for GIFs rather than rendered-but-disabled, since there's nothing to wire them to yet.
  const isGif = detectImageFormat(baseFile.name, baseFile.type) === "gif";

  const bgImageUrlRef = useRef(background?.replaceImageUrl);
  useEffect(() => () => {
    if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
  }, []);

  // Only needs to fire on the component's real unmount — reading via ref (rather than
  // depending on `review`) sidesteps the same StrictMode cleanup-timing issue.
  const reviewRef = useRef(review);
  reviewRef.current = review;
  useEffect(() => () => { if (reviewRef.current) URL.revokeObjectURL(reviewRef.current.url); }, []);

  const operations = background?.operations ?? [];
  const hasBackgroundEdit = !isGif && operations.length > 0;

  const updateBackground = (patch: Partial<BackgroundEditState>) =>
    setBackground((prev) => ({ operations: [], replaceMode: "transparent", ...prev, ...patch }));

  const handleCommitOperation = (operation: BackgroundOperation) => updateBackground({ operations: [...operations, operation] });
  const handleUndoLastOperation = () => updateBackground({ operations: operations.slice(0, -1) });
  const handleReplaceModeChange = (mode: BackgroundReplaceMode) => updateBackground({ replaceMode: mode });
  const handleReplaceColorChange = (hex: string) => updateBackground({ replaceColor: hex });
  const handleReplaceImageFile = (imageFile: File | undefined) => {
    if (!imageFile) return;
    if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
    const url = URL.createObjectURL(imageFile);
    bgImageUrlRef.current = url;
    updateBackground({ replaceImageUrl: url });
  };

  const handleReset = () => {
    if (activeTool === "crop") {
      setRect(defaultCropRect());
    } else {
      if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
      bgImageUrlRef.current = undefined;
      setBackground(undefined);
    }
  };

  const handleApply = async () => {
    const hasCrop = !isFullRect(rect);

    if (!hasCrop && !hasBackgroundEdit) {
      onApply(baseFile, undefined);
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      // Background removal runs first and never changes dimensions, so the crop
      // rect's (0–1 normalized) coordinate space is unaffected by doing it first.
      let working = baseFile;

      if (hasBackgroundEdit) {
        setStatusText("Removing background…");
        working = await applyBackgroundRemoval(working, background!);
      }

      if (hasCrop) {
        setStatusText("Applying crop…");
        working = isGif
          ? await (await import("./gif/applyCropToGif")).applyCropToGif(working, rect)
          : await applyCropToImage(working, rect);
      }

      setReview({ file: working, url: URL.createObjectURL(working) });
    } finally {
      setIsProcessing(false);
      setStatusText(null);
    }
  };

  const handleBackToEdit = () => {
    if (review) URL.revokeObjectURL(review.url);
    setReview(null);
  };

  const handleConfirm = () => {
    if (!review) return;
    onApply(review.file, { crop: rect, background, isEdited: true, originalFile: baseFile });
    onClose();
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-lg p-4 md:p-8' onClick={onClose}>
      <div className='relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between p-5 pb-3'>
          <div>
            <h3 className='text-lg font-bold text-foreground'>{review ? "Review changes" : "Edit image"}</h3>
            <p className='text-[10px] text-muted-foreground mt-0.5 truncate max-w-xs' title={file.file.name}>
              {file.file.name}
            </p>
          </div>
          <button onClick={onClose} className='w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all'>
            <X size={16} />
          </button>
        </div>

        <div className='p-5 pt-3 overflow-y-auto flex flex-col items-center gap-4 min-h-[200px] justify-center'>
          {!baseImageUrl ? (
            <div className='text-sm text-muted-foreground'>Loading…</div>
          ) : review ? (
            <BeforeAfterPreview beforeSrc={baseImageUrl} afterSrc={review.url} />
          ) : (
            <>
              <EditorToolbar tool={activeTool} onChange={setActiveTool} showBackgroundTools={!isGif} />

              <EditorStage
                imageUrl={baseImageUrl}
                tool={activeTool}
                rect={rect}
                onRectChange={setRect}
                operations={operations}
                eraserMode={eraserMode}
                brushRadius={brushRadius}
                onCommit={handleCommitOperation}
                onUndoLast={handleUndoLastOperation}
              />

              {!isGif && (
                <BackgroundOptions
                  tool={activeTool}
                  hasOperations={operations.length > 0}
                  eraserMode={eraserMode}
                  onEraserModeChange={setEraserMode}
                  brushRadius={brushRadius}
                  onBrushRadiusChange={setBrushRadius}
                  replaceMode={background?.replaceMode ?? "transparent"}
                  onReplaceModeChange={handleReplaceModeChange}
                  replaceColor={background?.replaceColor}
                  onReplaceColorChange={handleReplaceColorChange}
                  replaceImageUrl={background?.replaceImageUrl}
                  onReplaceImageFile={handleReplaceImageFile}
                />
              )}
            </>
          )}
        </div>

        <div className='px-5 pb-5 pt-2 flex items-center justify-between'>
          {review ? (
            <>
              <button onClick={handleBackToEdit} className='text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors'>
                Back to edit
              </button>
              <button onClick={handleConfirm} className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-5 py-2 rounded-xl transition-all active:scale-95'>
                Confirm
              </button>
            </>
          ) : (
            <>
              <button onClick={handleReset} className='flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors'>
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className='flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold text-sm px-5 py-2 rounded-xl transition-all active:scale-95'
              >
                <Crop size={14} />
                {isProcessing ? statusText ?? "Applying…" : "Apply"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
