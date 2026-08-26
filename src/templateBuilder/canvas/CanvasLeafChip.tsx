import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, type LucideIcon, Minus, MousePointerClick, MoveVertical, Trash2, Type } from "lucide-react";
import { memo } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeNode, useBuilderNode } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import type { BuilderLeafBlock } from "../types";

function leafPreviewText(leaf: BuilderLeafBlock): string {
  switch (leaf.type) {
    case "image":
      return leaf.alt || "Image";
    case "button":
      return leaf.label || "Button";
    case "divider":
      return "Divider";
    case "spacer":
      return `Spacer (${leaf.heightPx}px)`;
    case "text": {
      const stripped = leaf.contentHtml.replace(/<[^>]+>/g, "").trim();
      return stripped || "Text block";
    }
  }
}

const LEAF_ICON: Record<BuilderLeafBlock["type"], LucideIcon> = {
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  divider: Minus,
  spacer: MoveVertical,
};

interface CanvasLeafChipProps {
  id: string;
}

export const CanvasLeafChip = memo(function CanvasLeafChip({ id }: CanvasLeafChipProps) {
  const leaf = useBuilderNode(id) as BuilderLeafBlock | undefined;
  const dragData: DragData = { kind: "node", parentId: leaf?.parentId ?? null };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: dragData });
  const isSelected = useIsSelected(id);

  if (!leaf) return null;

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const Icon = LEAF_ICON[leaf.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(id);
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
          removeNode(id);
        }}
        className='text-muted-foreground hover:text-destructive'
        aria-label='Remove'>
        <Trash2 size={14} />
      </button>
    </div>
  );
});
