import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, type LucideIcon, Trash2 } from "lucide-react";
import { memo, type ReactNode } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeNode } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import { registerNodeRef } from "./nodeRectRegistry";

interface CanvasChipShellProps {
  id: string;
  parentId: string | null;
  icon: LucideIcon;
  children: ReactNode;
}

/** Shared drag handle + select/remove chrome for a leaf/ready-made canvas block. Chrome (grip,
 * type icon, remove) sits in a thin header strip INSIDE the box's own border — not floating
 * outside it the way `CanvasWysiwygShell`'s `-top-6` strip does for Section/Row. That outside-chrome
 * pattern needed careful headroom math (canva-plan-v2.md Stage 1) specifically because it floats;
 * with many small leaf chips potentially stacked tightly, keeping the chrome in-flow avoids that
 * whole class of clipping/overlap bug. `children` is the block's real rendered preview
 * (canva-plan-v2.md Stage 5) — this component no longer knows or cares what it looks like. */
export const CanvasChipShell = memo(function CanvasChipShell({ id, parentId, icon: Icon, children }: CanvasChipShellProps) {
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
      className={`rounded-md border text-xs cursor-pointer transition-colors overflow-hidden ${isSelected ? "border-primary bg-primary/5" : "border-border/60 bg-background hover:bg-muted/40"}`}>
      <div className='flex items-center gap-2 border-b border-border/40 bg-muted/30 px-2 py-1'>
        <button type='button' {...attributes} {...listeners} className='cursor-grab text-muted-foreground hover:text-foreground' aria-label='Drag to move'>
          <GripVertical size={14} />
        </button>
        <Icon size={12} className='text-muted-foreground shrink-0' />
        <span className='flex-1' />
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
      <div>{children}</div>
    </div>
  );
});
