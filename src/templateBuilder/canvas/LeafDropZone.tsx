import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { DropData } from "../dnd/dragTypes";
import type { BuilderLeafBlock } from "../types";
import { CanvasLeafChip } from "./CanvasLeafChip";

interface LeafDropZoneProps {
  containerId: string;
  leaves: BuilderLeafBlock[];
}

/** Droppable+sortable зона для дітей однієї секції або однієї колонки ряду. */
export function LeafDropZone({ containerId, leaves }: LeafDropZoneProps) {
  const dropData: DropData = { kind: "container", containerId };
  const { setNodeRef, isOver } = useDroppable({ id: containerId, data: dropData });

  return (
    <div ref={setNodeRef} className={`space-y-1.5 min-h-12 rounded-md p-1.5 transition-colors ${isOver ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}>
      <SortableContext items={leaves.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {leaves.length === 0 ? <p className='text-[11px] text-muted-foreground text-center py-2'>Drop text/image here</p> : leaves.map((leaf) => <CanvasLeafChip key={leaf.id} leaf={leaf} containerId={containerId} />)}
      </SortableContext>
    </div>
  );
}
