/**
 * Batch Processor — Header bar with conversion stats and bulk actions.
 * Props-based (no context). Tailwind styling.
 */

import { Download, Trash2, Play } from "lucide-react";
import { ConversionSettings, ImageFile } from "../types";
import { useImageStats } from "../hooks/useImageStats";
import { formatFileSize } from "../utils/clientConverter";

interface BatchProcessorProps {
  files: ImageFile[];
  settings: ConversionSettings;
  convertAll: () => void;
  downloadAll: () => void;
  clearFiles: () => void;
  variant?: "default" | "compact";
}

export default function BatchProcessor({
  files,
  settings,
  convertAll,
  downloadAll,
  clearFiles,
  variant = "default",
}: BatchProcessorProps) {
  const stats = useImageStats(files);

  if (files.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className='flex items-center gap-6'>
        {/* Stats */}
        <div className='flex flex-col items-end leading-none'>
          {stats.completed > 0 ? (
            <>
              <span className='text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-1'>
                {stats.completed} / {stats.total} Ready
              </span>
              <div className='flex items-center gap-1.5'>
                <div className='w-2 h-2 rounded-full bg-success animate-pulse' />
                <span className='text-xs font-bold text-success'>
                  -{stats.savedPercent}% ({formatFileSize(stats.savedSize)})
                </span>
              </div>
            </>
          ) : (
            <span className='text-[10px] font-black uppercase tracking-tighter text-muted-foreground'>
              {stats.processing > 0 ? "Processing..." : `${stats.total} Pending`}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          {!settings.autoConvert && stats.total > stats.completed && (
            <button
              onClick={convertAll}
              disabled={stats.processing > 0}
              className='h-10 w-10 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50'
              title='Convert All'
            >
              <Play size={18} fill="currentColor" strokeWidth={0} />
            </button>
          )}

          {stats.completed > 0 && (
            <button
              onClick={downloadAll}
              className='h-10 px-4 flex items-center gap-2 bg-success hover:bg-success/90 text-white font-bold rounded-xl shadow-lg shadow-success/20 transition-all hover:-translate-y-0.5 active:scale-95'
            >
              <Download size={16} strokeWidth={3} />
              <span className='text-sm capitalize'>Save all</span>
            </button>
          )}

          <button
            onClick={clearFiles}
            className='h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl transition-all active:scale-95'
            title='Clear All'
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col md:flex-row items-center justify-between p-6 bg-white dark:bg-slate-900 border border-border/50 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300'>
      {/* Stats */}
      <div className='flex items-center gap-4 mb-4 md:mb-0'>
        <div className='w-12 h-12 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center'>
          <Play size={24} className='text-primary' />
        </div>
        <div>
          <h4 className='font-bold text-foreground'>Batch Operations</h4>
          {stats.completed > 0 ? (
            <p className='text-sm text-muted-foreground'>
              <span className='text-success font-bold'>{stats.completed}</span> images ready for download. Saved <span className='text-success font-bold'>{formatFileSize(stats.savedSize)}</span>.
            </p>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {stats.processing > 0
                ? `Processing ${stats.processing} images...`
                : `${stats.total} images ready for conversion.`}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-3 w-full md:w-auto'>
        {!settings.autoConvert && stats.total > stats.completed && (
          <button
            onClick={convertAll}
            disabled={stats.processing > 0}
            className='flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-black px-8 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50'
          >
            <Play size={18} fill="currentColor" strokeWidth={0} />
            CONVERT
          </button>
        )}

        {stats.completed > 0 && (
          <button
            onClick={downloadAll}
            className='flex-1 md:flex-none flex items-center justify-center gap-2 bg-success hover:brightness-110 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-success/20 transition-all hover:-translate-y-1 active:scale-95'
          >
            <Download size={18} strokeWidth={3} />
            DOWNLOAD ALL
          </button>
        )}

        <button
          onClick={clearFiles}
          className='p-3 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white rounded-2xl transition-all hover:scale-105 active:scale-95'
          title='Clear All'
        >
          <Trash2 size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

