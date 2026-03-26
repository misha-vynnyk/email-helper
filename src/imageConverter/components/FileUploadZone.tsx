/**
 * File Upload Zone — Drag-and-drop + file grid with dnd-kit sorting.
 * Props-based (no context). Tailwind styling.
 */

import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { ImageFile } from "../types";
import SortableImageItem from "./SortableImageItem";
import BulkActions from "./BulkActions";

interface FileUploadZoneProps {
  files: ImageFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  downloadFile: (id: string) => void;
  reorderFiles: (oldIndex: number, newIndex: number) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  removeSelected: () => void;
  downloadSelected: () => void;
  convertSelected: () => void;
  selectedCount: number;
}

export default function FileUploadZone({
  files,
  addFiles,
  removeFile,
  downloadFile,
  reorderFiles,
  toggleSelection,
  selectAll,
  deselectAll,
  removeSelected,
  downloadSelected,
  convertSelected,
  selectedCount,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (droppedFiles.length > 0) addFiles(droppedFiles);
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [addFiles]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = files.findIndex((f) => f.id === active.id);
        const newIndex = files.findIndex((f) => f.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderFiles(oldIndex, newIndex);
        }
      }
    },
    [files, reorderFiles]
  );

  return (
    <div className='flex flex-col gap-3'>
      {/* HEADER / BULK ACTIONS AREA */}
      <div className='flex flex-col md:flex-row md:items-center justify-between px-2'>
        <div className='flex items-center gap-3 mb-4 md:mb-0'>
          <h2 className='text-sm font-bold text-foreground tracking-tight'>Workspace</h2>
          <span className='px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold'>
            {files.length} {files.length === 1 ? "File" : "Files"}
          </span>
        </div>
        
        {files.length > 0 && (
          <BulkActions
            files={files}
            selectedCount={selectedCount}
            selectAll={selectAll}
            deselectAll={deselectAll}
            removeSelected={removeSelected}
            downloadSelected={downloadSelected}
            convertSelected={convertSelected}
          />
        )}
      </div>

      {/* DROP ZONE / CONTENT AREA */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl transition-all duration-300 overflow-hidden
          ${isDragOver ? "ring-2 ring-primary/20" : ""}
          ${files.length === 0 
            ? "border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg min-h-[280px]" 
            : "bg-transparent"
          }
        `}
      >
        {/* Empty State Overlay */}
        {files.length === 0 && (
          <div 
            className='absolute inset-0 flex flex-col items-center justify-center gap-5 text-center p-6 cursor-pointer group'
            onClick={() => document.getElementById("image-file-input")?.click()}
          >
            <div className='relative'>
              <div className='w-14 h-14 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300'>
                <Upload size={28} className='text-primary' />
              </div>
              <div className='absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-700'>
                 <ImageIcon size={14} className='text-primary' />
              </div>
            </div>
            
            <div className='space-y-1'>
              <h3 className='text-lg font-bold text-foreground tracking-tight'>Drop images here</h3>
              <p className='text-xs text-muted-foreground max-w-xs mx-auto'>
                JPEG, PNG, WebP, AVIF & GIF supported
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("image-file-input")?.click();
              }}
              className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95'
            >
              <Upload size={16} />
              Choose Files
            </button>
          </div>
        )}

        {/* File Grid */}
        {files.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={rectSortingStrategy}
            >
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3'>
                {files.map((file, i) => (
                  <SortableImageItem
                    key={file.id}
                    file={file}
                    index={i}
                    onDownload={() => downloadFile(file.id)}
                    onRemove={() => removeFile(file.id)}
                    onToggleSelection={() => toggleSelection(file.id)}
                  />
                ))}

                {/* Add More Minimalist Button */}
                <button
                  onClick={() => document.getElementById("image-file-input")?.click()}
                  className='aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all hover:bg-white dark:hover:bg-slate-900 group'
                >
                  <div className='w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200'>
                    <Upload size={18} className='group-hover:scale-110 transition-transform' />
                  </div>
                  <span className='text-[10px] font-semibold'>Add more</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        id='image-file-input'
        type='file'
        accept='image/*'
        multiple
        className='hidden'
        onChange={handleFileInput}
      />
    </div>
  );
}

