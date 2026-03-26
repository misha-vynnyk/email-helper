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

  return (
    <div className='flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500'>
      {/* Selection Control */}
      <div className='flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm'>
        <button
          onClick={() => (allSelected ? deselectAll() : selectAll())}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            allSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          {allSelected ? <Check size={14} strokeWidth={4} /> : someSelected ? <div className='w-3 h-3 rounded-full border-2 border-primary bg-primary/20' /> : <Square size={14} />}
          {selectedCount > 0 ? `${selectedCount} Selected` : "Select All"}
        </button>
      </div>

      {/* Action Tray (Glass Mode) */}
      {selectedCount > 0 && (
        <div className='flex items-center gap-1.5 p-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none animate-in zoom-in-95 duration-300'>
          <button
            onClick={convertSelected}
            className='flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95'
            title='Convert Selected'
          >
            <Play size={14} fill="currentColor" strokeWidth={0} />
            PROCESS
          </button>
          
          <button
            onClick={downloadSelected}
            className='flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-success hover:bg-success/90 text-white rounded-xl shadow-lg shadow-success/20 transition-all hover:-translate-y-0.5 active:scale-95'
            title='Download Selected'
          >
            <Download size={14} strokeWidth={3} />
            SAVE
          </button>

          <button
            onClick={removeSelected}
            className='w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all'
            title='Remove Selected'
          >
            <Trash2 size={16} />
          </button>

          <div className='w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1' />

          <button
            onClick={deselectAll}
            className='w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all'
            title='Clear Selection'
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

