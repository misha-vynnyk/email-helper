/**
 * Sortable Image Item — wrapper for drag-and-drop with @dnd-kit.
 * Props-based. Tailwind styling.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ImageFile } from "../types";
import ImageGridItem from "./ImageGridItem";

interface SortableImageItemProps {
  file: ImageFile;
  index: number;
  onDownload: () => void;
  onRemove: () => void;
  onToggleSelection: () => void;
}

export default function SortableImageItem({
  file,
  index,
  onDownload,
  onRemove,
  onToggleSelection,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className='col-span-1'
    >
      <ImageGridItem
        file={file}
        onDownload={onDownload}
        onRemove={onRemove}
        onToggleSelection={onToggleSelection}
        index={index}
        dragListeners={listeners}
      />
    </div>
  );
}
