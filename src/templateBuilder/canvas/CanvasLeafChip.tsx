import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Trash2, Type } from "lucide-react";
import { memo } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeLeaf } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import type { BuilderLeafBlock } from "../types";

function leafPreviewText(leaf: BuilderLeafBlock): string {
  if (leaf.type === "image") return leaf.alt || "Image";
  const stripped = leaf.contentHtml.replace(/<[^>]+>/g, "").trim();
  return stripped || "Text block";
}

interface CanvasLeafChipProps {
  leaf: BuilderLeafBlock;
  containerId: string;
}

export const CanvasLeafChip = memo(function CanvasLeafChip({ leaf, containerId }: CanvasLeafChipProps) {
  const dragData: DragData = { kind: "leaf", containerId };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: leaf.id, data: dragData });
  const isSelected = useIsSelected(leaf.id);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const Icon = leaf.type === "image" ? ImageIcon : Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(leaf.id);
      }}
      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border/60 bg-background hover:bg-muted/40"}`}>
      <button type='button' {...attributes} {...listeners} className='cursor-grab text-muted-foreground hover:text-foreground' aria-label='Drag to move'>
        <GripVertical size={14} />
      </button>
      <Icon size={14} className='text-muted-foreground shrink-0' />
      <span className='truncate flex-1'>{leafPreviewText(leaf)}</span>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          removeLeaf(leaf.id);
        }}
        className='text-muted-foreground hover:text-destructive'
        aria-label='Remove'>
        <Trash2 size={14} />
      </button>
    </div>
  );
});
