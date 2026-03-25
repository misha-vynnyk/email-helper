/**
 * Bulk Actions Toolbar — Selection and bulk operations.
 * Props-based (no context). Tailwind styling.
 */

import { Check, Square, Trash2, Download, Play, X } from "lucide-react";
import { ImageFile } from "../types";

interface BulkActionsProps {
  files: ImageFile[];
  selectedCount: number;
  selectAll: () => void;
  deselectAll: () => void;
  removeSelected: () => void;
  downloadSelected: () => void;
  convertSelected: () => void;
}

export default function BulkActions({
  files,
  selectedCount,
  selectAll,
  deselectAll,
  removeSelected,
  downloadSelected,
  convertSelected,
}: BulkActionsProps) {
  if (files.length === 0) return null;

  const allSelected = files.length > 0 && selectedCount === files.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const doneCount = files.filter((f) => f.selected && f.status === "done").length;
  const pendingCount = files.filter((f) => f.selected && f.status === "pending").length;
  const processingCount = files.filter((f) => f.selected && f.status === "processing").length;
  const errorCount = files.filter((f) => f.selected && f.status === "error").length;

  return (
    <div className='bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-soft transition-all duration-300'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        {/* Checkbox + Label */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => (allSelected ? deselectAll() : selectAll())}
            className='p-1 rounded hover:bg-muted transition-colors'
          >
            {allSelected ? (
              <Check size={18} className='text-primary' />
            ) : someSelected ? (
              <div className='w-[18px] h-[18px] rounded-sm border-2 border-primary bg-primary/20' />
            ) : (
              <Square size={18} className='text-muted-foreground' />
            )}
          </button>
          <span className='text-sm font-medium text-foreground'>
            {selectedCount > 0
              ? `${selectedCount} of ${files.length} selected`
              : `Select All (${files.length})`}
          </span>
        </div>

        {/* Actions */}
        {selectedCount > 0 && (
          <div className='flex items-center gap-1.5'>
            <button
              onClick={convertSelected}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border/50 rounded-lg hover:bg-muted transition-all hover:scale-105 active:scale-95'
            >
              <Play size={14} />
              Convert
            </button>
            <button
              onClick={downloadSelected}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border/50 rounded-lg hover:bg-muted transition-all hover:scale-105 active:scale-95'
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={removeSelected}
              className='p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all hover:scale-105 active:scale-95'
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={deselectAll}
              className='p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors'
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Status Chips */}
      {selectedCount > 0 && (
        <div className='mt-2 flex gap-1.5'>
          {doneCount > 0 && (
            <span className='px-2 py-0.5 text-xs rounded-full border border-success/30 text-success bg-success/10'>
              {doneCount} Done
            </span>
          )}
          {pendingCount > 0 && (
            <span className='px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground'>
              {pendingCount} Pending
            </span>
          )}
          {processingCount > 0 && (
            <span className='px-2 py-0.5 text-xs rounded-full border border-primary/30 text-primary bg-primary/10'>
              {processingCount} Processing
            </span>
          )}
          {errorCount > 0 && (
            <span className='px-2 py-0.5 text-xs rounded-full border border-destructive/30 text-destructive bg-destructive/10'>
              {errorCount} Error
            </span>
          )}
        </div>
      )}
    </div>
  );
}
