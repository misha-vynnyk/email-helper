import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { memo } from "react";

import type { DragData } from "../dnd/dragTypes";
import { addColumn, removeNode, useBuilderNode } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import { MAX_ROW_COLUMNS, type RowBlock } from "../types";
import { CanvasBlockShell } from "./CanvasBlockShell";
import { CanvasColumnBox } from "./CanvasColumnBox";

interface CanvasRowBoxProps {
  id: string;
}

export const CanvasRowBox = memo(function CanvasRowBox({ id }: CanvasRowBoxProps) {
  const row = useBuilderNode(id) as RowBlock | undefined;
  const dragData: DragData = { kind: "node", parentId: row?.parentId ?? null };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id, data: dragData });
  const isSelected = useIsSelected(id);
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!row) return null;

  return (
    <CanvasBlockShell
      label={`ROW (${row.childIds.length} col)`}
      isSelected={isSelected}
      isDragging={isDragging}
      isOver={isOver}
      style={style}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      onSelect={() => selectBlock(id)}
      onRemove={() => removeNode(id)}
      removeAriaLabel='Remove row'>
      {row.childIds.length < MAX_ROW_COLUMNS && (
        <div className='flex justify-end mb-1'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              addColumn(id);
            }}
            className='flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground'
            aria-label='Add column'>
            <Plus size={12} />
            Add column
          </button>
        </div>
      )}
      <div className='flex gap-2'>
        {row.childIds.map((columnId) => (
          <CanvasColumnBox key={columnId} rowId={id} columnId={columnId} columnCount={row.childIds.length} />
        ))}
      </div>
    </CanvasBlockShell>
  );
});
