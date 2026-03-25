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
    <div className='bg-card rounded-[2rem] p-6 shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300'>
      {/* Bulk Actions */}
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

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : files.length === 0
              ? "border-border/50 hover:border-primary/50 bg-background/50"
              : "border-transparent"
          }
          ${files.length === 0 ? "p-12" : "p-4 mt-4"}
        `}
        onClick={() => {
          if (files.length === 0) {
            document.getElementById("image-file-input")?.click();
          }
        }}
      >
        {/* Empty State */}
        {files.length === 0 && (
          <div className='flex flex-col items-center justify-center gap-4 text-center'>
            <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center'>
              <Upload size={28} className='text-primary' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-foreground'>Drop images here</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                or click to browse • JPEG, PNG, WebP, AVIF, GIF
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("image-file-input")?.click();
              }}
              className='flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-sm'
            >
              <ImageIcon size={16} />
              Browse Files
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
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
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

                {/* Add More Button */}
                <button
                  onClick={() => document.getElementById("image-file-input")?.click()}
                  className='aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 group'
                >
                  <Upload size={20} className='group-hover:scale-110 transition-transform' />
                  <span className='text-xs font-medium'>Add more</span>
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
