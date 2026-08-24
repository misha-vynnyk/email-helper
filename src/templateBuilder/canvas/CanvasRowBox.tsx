import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";

import { columnContainerId, removeCanvasBlock } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import type { RowBlock } from "../types";
import { CanvasBlockShell } from "./CanvasBlockShell";
import { LeafDropZone } from "./LeafDropZone";

interface CanvasRowBoxProps {
  row: RowBlock;
}

export const CanvasRowBox = memo(function CanvasRowBox({ row }: CanvasRowBoxProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: row.id, data: { kind: "canvas-block" } });
  const isSelected = useIsSelected(row.id);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <CanvasBlockShell
      label={`ROW (${row.columns.length} col)`}
      isSelected={isSelected}
      isDragging={isDragging}
      isOver={isOver}
      style={style}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      onSelect={() => selectBlock(row.id)}
      onRemove={() => removeCanvasBlock(row.id)}
      removeAriaLabel='Remove row'>
      <div className='grid gap-2' style={{ gridTemplateColumns: row.columns.map((c) => `${c.widthPercent}fr`).join(" ") }}>
        {row.columns.map((column) => (
          <div key={column.id} className='rounded-md border border-border/40 p-1'>
            <LeafDropZone containerId={columnContainerId(row.id, column.id)} leaves={column.children} />
          </div>
        ))}
      </div>
    </CanvasBlockShell>
  );
});
