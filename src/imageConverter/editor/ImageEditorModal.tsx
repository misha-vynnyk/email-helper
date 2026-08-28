/**
 * Per-file image editor modal — opened from the file card. Always crops against the
 * pristine original (`file.edit?.originalFile ?? file.file`), never against a
 * previously-cropped result, so the stored crop rect and "reset to original" stay
 * meaningful across repeated edits.
 */

import { Crop, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CropRect, ImageEditState, ImageFile } from "../types";
import { detectImageFormat } from "../utils/imageFormatDetector";
import { applyCropToImage } from "./applyEditToImage";
import BeforeAfterPreview from "./BeforeAfterPreview";
import { defaultCropRect, isFullRect } from "./cropMath";
import CropCanvas from "./CropCanvas";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [review, setReview] = useState<{ file: File; url: string } | null>(null);

  // Only needs to fire on the component's real unmount — reading via ref (rather than
  // depending on `review`) sidesteps the same StrictMode cleanup-timing issue.
  const reviewRef = useRef(review);
  reviewRef.current = review;
  useEffect(() => () => { if (reviewRef.current) URL.revokeObjectURL(reviewRef.current.url); }, []);

  const handleApply = async () => {
    if (isFullRect(rect)) {
      onApply(baseFile, undefined);
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      const isGif = detectImageFormat(baseFile.name, baseFile.type) === "gif";
      const newFile = isGif
        ? await (await import("./gif/applyCropToGif")).applyCropToGif(baseFile, rect)
        : await applyCropToImage(baseFile, rect);
      setReview({ file: newFile, url: URL.createObjectURL(newFile) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToEdit = () => {
    if (review) URL.revokeObjectURL(review.url);
    setReview(null);
  };

  const handleConfirm = () => {
    if (!review) return;
    onApply(review.file, { crop: rect, isEdited: true, originalFile: baseFile });
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
            <CropCanvas imageUrl={baseImageUrl} rect={rect} onChange={setRect} />
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
              <button onClick={() => setRect(defaultCropRect())} className='flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors'>
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className='flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold text-sm px-5 py-2 rounded-xl transition-all active:scale-95'
              >
                <Crop size={14} />
                {isProcessing ? "Applying…" : "Apply crop"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
