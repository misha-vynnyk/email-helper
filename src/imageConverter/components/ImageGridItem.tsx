/**
 * Image Grid Item — Individual image card showing status, progress, and actions.
 * Props-based (no context). Tailwind styling.
 */

import { useState } from "react";
import {
  Download,
  Trash2,
  GripVertical,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import { ImageFile } from "../types";
import { formatFileSize } from "../utils/clientConverter";

interface ImageGridItemProps {
  file: ImageFile;
  onDownload: () => void;
  onRemove: () => void;
  onToggleSelection: () => void;
  index: number;
  dragListeners?: SyntheticListenerMap;
}

export default function ImageGridItem({
  file,
  onDownload,
  onRemove,
  onToggleSelection,
  dragListeners,
}: ImageGridItemProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isDone = file.status === "done";
  const isProcessing = file.status === "processing";
  const isError = file.status === "error";

  const savedPercent =
    isDone && file.convertedSize
      ? Math.round(((file.originalSize - file.convertedSize) / file.originalSize) * 100)
      : 0;

  return (
    <>
      <div
        className={`
          relative bg-card rounded-xl border overflow-hidden transition-all duration-300 group
          ${file.selected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-border"}
          ${isError ? "border-destructive/50" : ""}
          hover:shadow-lg
        `}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image Preview */}
        <div className='relative aspect-square overflow-hidden bg-background'>
          <img
            src={file.previewUrl}
            alt={file.file.name}
            className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
          />

          {/* Progress Overlay */}
          {isProcessing && (
            <div className='absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2'>
              <Loader2 size={24} className='text-white animate-spin' />
              <span className='text-white text-xs font-semibold'>{Math.round(file.progress)}%</span>
              {file.eta !== undefined && file.eta > 0 && (
                <span className='text-white/70 text-[10px]'>~{file.eta}s left</span>
              )}
            </div>
          )}

          {/* Error Overlay */}
          {isError && (
            <div className='absolute inset-0 bg-destructive/20 flex items-center justify-center'>
              <div className='text-center px-3'>
                <AlertTriangle size={24} className='text-destructive mx-auto mb-1' />
                <span className='text-destructive text-xs block'>{file.error || "Failed"}</span>
              </div>
            </div>
          )}

          {/* Done Badge */}
          {isDone && (
            <div className='absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-sm'>
              <Check size={14} className='text-white' strokeWidth={3} />
            </div>
          )}

          {/* Hover Actions */}
          {hovered && (
            <div className='absolute top-2 left-2 flex gap-1'>
              {/* Selection */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelection(); }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  file.selected
                    ? "bg-primary text-white"
                    : "bg-black/50 text-white hover:bg-primary"
                }`}
              >
                {file.selected ? <Check size={14} strokeWidth={3} /> : <div className='w-3 h-3 rounded-sm border-2 border-white' />}
              </button>

              {/* Drag handle */}
              <div
                {...dragListeners}
                className='w-6 h-6 rounded-md bg-black/50 text-white flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/70'
              >
                <GripVertical size={14} />
              </div>
            </div>
          )}

          {/* Comparison button */}
          {isDone && hovered && (
            <button
              onClick={() => setShowComparison(true)}
              className='absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 hover:bg-black/80 text-white text-xs rounded-full backdrop-blur-sm transition-all flex items-center gap-1'
            >
              <Eye size={12} />
              Compare
            </button>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/20'>
              <div
                className='h-full bg-primary transition-all duration-300 ease-out'
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div className='p-2.5'>
          <p className='text-xs font-medium text-foreground truncate' title={file.file.name}>
            {file.file.name}
          </p>
          <div className='flex items-center justify-between mt-1.5'>
            <span className='text-[10px] text-muted-foreground'>
              {formatFileSize(file.originalSize)}
              {isDone && file.convertedSize && (
                <> → <strong className={savedPercent > 0 ? "text-success" : "text-destructive"}>
                  {formatFileSize(file.convertedSize)}
                </strong></>
              )}
            </span>

            {isDone && savedPercent !== 0 && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                savedPercent > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}>
                {savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className='flex gap-1 mt-2'>
            {isDone && (
              <button
                onClick={onDownload}
                className='flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-all hover:scale-[1.02] active:scale-95'
              >
                <Download size={12} />
                Download
              </button>
            )}
            <button
              onClick={onRemove}
              className='p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors'
              title='Remove'
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Dialog */}
      {showComparison && isDone && file.convertedUrl && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
          onClick={() => setShowComparison(false)}
        >
          <div
            className='bg-card rounded-2xl border border-border/50 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-4 border-b border-border/50'>
              <h3 className='text-sm font-bold text-foreground'>Before / After Comparison</h3>
              <button
                onClick={() => setShowComparison(false)}
                className='p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground'
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className='grid grid-cols-2 gap-0.5 p-4'>
              <div className='flex flex-col items-center gap-2'>
                <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Original</span>
                <img src={file.previewUrl} alt='Original' className='max-h-[60vh] object-contain rounded-lg' />
                <span className='text-xs text-muted-foreground'>{formatFileSize(file.originalSize)}</span>
              </div>
              <div className='flex flex-col items-center gap-2'>
                <span className='text-xs font-semibold text-primary uppercase tracking-wider'>Converted</span>
                <img src={file.convertedUrl} alt='Converted' className='max-h-[60vh] object-contain rounded-lg' />
                <span className='text-xs text-muted-foreground'>
                  {file.convertedSize && formatFileSize(file.convertedSize)}
                  {savedPercent > 0 && (
                    <span className='ml-1.5 text-success font-semibold'>-{savedPercent}%</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
