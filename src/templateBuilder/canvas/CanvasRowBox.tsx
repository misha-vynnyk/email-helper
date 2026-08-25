import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X } from "lucide-react";
import { memo } from "react";

import { addColumn, columnContainerId, removeCanvasBlock, removeColumn } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import { MAX_ROW_COLUMNS, MIN_ROW_COLUMNS, type RowBlock } from "../types";
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
      {row.columns.length < MAX_ROW_COLUMNS && (
        <div className='flex justify-end mb-1'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              addColumn(row.id);
            }}
            className='flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground'
            aria-label='Add column'>
            <Plus size={12} />
            Add column
          </button>
        </div>
      )}
      <div className='grid gap-2' style={{ gridTemplateColumns: row.columns.map((c) => `${c.widthPercent}fr`).join(" ") }}>
        {row.columns.map((column) => (
          <div key={column.id} className='relative rounded-md border border-border/40 p-1'>
            {row.columns.length > MIN_ROW_COLUMNS && (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  removeColumn(row.id, column.id);
                }}
                className='absolute top-1 right-1 z-10 text-muted-foreground hover:text-destructive'
                aria-label='Remove column'>
                <X size={12} />
              </button>
            )}
            <LeafDropZone containerId={columnContainerId(row.id, column.id)} leaves={column.children} />
          </div>
        ))}
      </div>
    </CanvasBlockShell>
  );
});
