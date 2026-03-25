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
}

export default function BatchProcessor({
  files,
  settings,
  convertAll,
  downloadAll,
  clearFiles,
}: BatchProcessorProps) {
  const stats = useImageStats(files);

  if (files.length === 0) return null;

  return (
    <div className='flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-md transition-all duration-300'>
      {/* Stats */}
      <div className='flex items-center gap-3'>
        {stats.completed > 0 ? (
          <>
            <span className='text-sm text-muted-foreground'>
              <strong className='text-foreground'>{stats.completed}</strong> / {stats.total} converted
            </span>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success'>
              {formatFileSize(stats.savedSize)} saved ({stats.savedPercent}%)
            </span>
          </>
        ) : (
          <span className='text-sm text-muted-foreground'>
            {stats.processing > 0
              ? `Processing ${stats.processing} ${stats.processing === 1 ? "image" : "images"}...`
              : `Ready to convert ${stats.total} ${stats.total === 1 ? "image" : "images"}`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className='flex gap-2'>
        {!settings.autoConvert && stats.total > stats.completed && (
          <button
            onClick={convertAll}
            disabled={stats.processing > 0}
            className='flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-bold px-5 py-2 rounded-full shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 text-sm'
          >
            <Play size={14} strokeWidth={2.5} />
            Convert All
          </button>
        )}

        {stats.completed > 0 && (
          <button
            onClick={downloadAll}
            className='flex items-center gap-2 bg-success hover:brightness-110 text-white font-bold px-5 py-2 rounded-full shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-sm'
          >
            <Download size={14} strokeWidth={2.5} />
            Download All
          </button>
        )}

        {stats.total > 0 && (
          <button
            onClick={clearFiles}
            className='p-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-all hover:scale-105 active:scale-95'
            title='Clear All'
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
