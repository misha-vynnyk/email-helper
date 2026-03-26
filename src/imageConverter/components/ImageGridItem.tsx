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
          relative bg-white dark:bg-slate-900 rounded-xl border overflow-hidden transition-all duration-300 group
          ${file.selected 
            ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/10" 
            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
          }
          ${isError ? "border-destructive/30 shadow-destructive/10" : ""}
        `}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image Preview Container */}
        <div className='relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-950/50'>
          <div className='w-full h-full overflow-hidden'>
            <img
              src={file.previewUrl}
              alt={file.file.name}
              className={`w-full h-full object-cover transition-all duration-500 ${hovered ? "scale-105" : "scale-100"}`}
            />
          </div>

          {/* Status Badge (Top-Right) */}
          <div className='absolute top-2 right-2 z-20 flex flex-col gap-1 items-end'>
            {isDone && (
              <div className='w-6 h-6 rounded-full bg-success text-white flex items-center justify-center shadow-sm'>
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            {isError && (
              <div className='w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm'>
                <AlertTriangle size={12} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className='absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2'>
              <Loader2 size={24} className='text-primary animate-spin' />
              <span className='text-[10px] font-semibold text-primary'>{Math.round(file.progress)}%</span>
            </div>
          )}

          {/* Toggle Selection & Drag Handle (Top-Left, visible on hover or if selected) */}
          <div className={`absolute top-2 left-2 z-20 flex gap-1 transition-all duration-200 ${hovered || file.selected ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelection(); }}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                file.selected
                  ? "bg-primary text-white"
                  : "bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-primary backdrop-blur-sm"
              }`}
            >
              {file.selected ? <Check size={12} strokeWidth={3} /> : <div className='w-2.5 h-2.5 rounded-full border-2 border-slate-300' />}
            </button>

            <div
              {...dragListeners}
              className='w-6 h-6 rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-400 flex items-center justify-center cursor-grab active:cursor-grabbing hover:text-primary backdrop-blur-sm'
            >
              <GripVertical size={12} />
            </div>
          </div>

          {/* Comparison / Preview Overlay (Bottom Center, hover only) */}
          {isDone && hovered && (
            <button
              onClick={() => setShowComparison(true)}
              className='absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/80 hover:bg-primary text-white text-[10px] font-semibold rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5'
            >
              <Eye size={12} />
              Compare
            </button>
          )}

          {/* Progress Bar (Bottom) */}
          {isProcessing && (
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden'>
              <div
                className='h-full bg-primary transition-all duration-300 ease-out'
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Details Footer */}
        <div className='px-3 py-2 flex flex-col gap-1'>
           <div className='flex flex-col gap-0.5'>
              <h4 className='text-xs font-semibold text-foreground truncate' title={file.file.name}>
                {file.file.name}
              </h4>
              <div className='flex items-center gap-2'>
                 <span className='text-[10px] text-muted-foreground'>{formatFileSize(file.originalSize)}</span>
              </div>
           </div>

           {/* Results / Stats */}
           <div className='flex items-center justify-between'>
              {isDone && file.convertedSize ? (
                <div className='flex items-center gap-1.5'>
                    <span className='text-[10px] text-muted-foreground'>→</span>
                    <span className='text-xs font-semibold text-foreground'>{formatFileSize(file.convertedSize)}</span>
                       {savedPercent !== 0 && (
                       <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            savedPercent > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          }`}>
                            {savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`}
                          </span>
                       )}
                </div>
              ) : (
                <span className='text-[10px] text-muted-foreground italic'>
                       {isProcessing ? "Processing…" : isError ? "Error" : "Pending"}
                </span>
              )}

              {/* Action Buttons */}
              <div className='flex gap-1 self-end'>
                 {isDone && (
                   <button
                     onClick={onDownload}
                     className='w-7 h-7 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all duration-200'
                     title='Download'
                   >
                     <Download size={14} />
                   </button>
                 )}
                 <button
                   onClick={onRemove}
                   className='w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all'
                   title='Remove'
                 >
                   <Trash2 size={14} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Comparison Modal (Luxury design) */}
      {showComparison && isDone && file.convertedUrl && (
        <div
          className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-lg p-4 md:p-8'
          onClick={() => setShowComparison(false)}
        >
          <div
            className='relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className='flex items-center justify-between p-5 pb-3'>
              <div>
                 <h3 className='text-lg font-bold text-foreground'>Before / After</h3>
                 <p className='text-[10px] text-muted-foreground mt-0.5'>Comparison</p>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className='w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all'
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-5 pt-3 overflow-y-auto max-h-[calc(90vh-120px)]'>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between px-2'>
                   <span className='text-[10px] font-semibold uppercase text-muted-foreground'>Original</span>
                   <span className='text-[10px] font-bold text-muted-foreground bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full'>{formatFileSize(file.originalSize)}</span>
                </div>
                <div className='relative aspect-square md:aspect-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>
                   <img src={file.previewUrl} alt='Original' className='w-full h-full object-contain p-2' />
                </div>
              </div>

              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between px-2'>
                   <div className='flex items-center gap-2'>
                        <span className='text-[10px] font-semibold uppercase text-primary'>Optimized</span>
                        {savedPercent > 0 && <span className='text-[10px] font-semibold bg-success text-white px-1.5 py-0.5 rounded-md'>-{savedPercent}%</span>}
                   </div>
                   <span className='text-[10px] font-bold text-muted-foreground bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full'>
                      {file.convertedSize && formatFileSize(file.convertedSize)}
                   </span>
                </div>
                <div className='relative aspect-square md:aspect-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-primary/20'>
                   <img src={file.convertedUrl} alt='Converted' className='w-full h-full object-contain p-2' />
                </div>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className='px-5 pb-4 flex justify-end'>
                <button
                   onClick={onDownload}
                   className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-5 py-2 rounded-xl transition-all active:scale-95'
                >
                   <Download size={14} />
                   Download
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

