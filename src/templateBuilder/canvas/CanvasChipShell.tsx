import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, type LucideIcon, Trash2 } from "lucide-react";
import { memo } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeNode } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import { registerNodeRef } from "./nodeRectRegistry";

interface CanvasChipShellProps {
  id: string;
  parentId: string | null;
  icon: LucideIcon;
  label: string;
}

/** Shared drag handle + select/remove chrome for a single-line canvas chip — the leaf-block
 * chip (CanvasLeafChip) and the ready-made-block chip (CanvasReadyMadeChip) differ only in
 * which icon and one-line preview text they show, so both delegate everything else here instead
 * of each re-implementing useSortable/click/remove wiring. */
export const CanvasChipShell = memo(function CanvasChipShell({ id, parentId, icon: Icon, label }: CanvasChipShellProps) {
  const dragData: DragData = { kind: "node", parentId };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: dragData });
  const isSelected = useIsSelected(id);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        registerNodeRef(id, el);
      }}
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
      <span className='truncate flex-1'>{label}</span>
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
