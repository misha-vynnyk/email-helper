import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { memo, type CSSProperties, type ReactNode } from "react";

interface CanvasBlockShellProps {
  label: ReactNode;
  isSelected: boolean;
  isDragging: boolean;
  isOver: boolean;
  style: CSSProperties;
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  onSelect: () => void;
  onRemove: () => void;
  removeAriaLabel: string;
  children: ReactNode;
}

/** Shared drag handle + select/remove header + border styling for a top-level canvas box
 * (section or row) — the two only differ in their label and body content. `isOver` also
 * highlights the box as a valid drop target when a palette/leaf item is dragged over its body,
 * not just over its inner LeafDropZone. */
export const CanvasBlockShell = memo(function CanvasBlockShell({
  label,
  isSelected,
  isDragging,
  isOver,
  style,
  setNodeRef,
  attributes,
  listeners,
  onSelect,
  onRemove,
  removeAriaLabel,
  children,
}: CanvasBlockShellProps) {
  const borderClass = isSelected ? "border-primary" : isOver ? "border-primary/50 bg-primary/5" : "border-dashed border-border/60 hover:border-border";

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative rounded-lg border-2 p-3 cursor-pointer transition-colors ${borderClass}`}>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
          <button type='button' {...attributes} {...listeners} className='cursor-grab hover:text-foreground' aria-label='Drag to reorder'>
            <GripVertical size={14} />
          </button>
          {label}
        </div>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='text-muted-foreground hover:text-destructive'
          aria-label={removeAriaLabel}>
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  );
});
