import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { containerDropZoneId, type DropData } from "../dnd/dragTypes";
import { CanvasNode } from "./CanvasNode";

interface NodeDropZoneProps {
  parentId: string;
  childIds: string[];
}

/** Droppable+sortable zone for the children of one container (a Section or a Row-column).
 * Renders whatever each child actually is via `CanvasNode`, so a Section/Row landing here works
 * exactly like a leaf landing here — nesting is just "the child happens to be a container too". */
export function NodeDropZone({ parentId, childIds }: NodeDropZoneProps) {
  const dropData: DropData = { kind: "container", parentId };
  const { setNodeRef, isOver } = useDroppable({ id: containerDropZoneId(parentId), data: dropData });

  return (
    <div ref={setNodeRef} className={`space-y-1.5 min-h-12 rounded-md p-1.5 transition-colors ${isOver ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}>
      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        {childIds.length === 0 ? <p className='text-[11px] text-muted-foreground text-center py-2'>Drop a block here</p> : childIds.map((id) => <CanvasNode key={id} id={id} />)}
      </SortableContext>
    </div>
  );
}
