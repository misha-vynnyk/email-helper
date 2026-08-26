import { X } from "lucide-react";
import { memo } from "react";

import { removeColumn, useBuilderNode } from "../state/builderStore";
import { MIN_ROW_COLUMNS, type RowColumnBlock } from "../types";
import { NodeDropZone } from "./NodeDropZone";

interface CanvasColumnBoxProps {
  rowId: string;
  columnId: string;
  columnCount: number;
}

/** One Row-column — a real node in the tree (see types.ts), but not independently selectable in
 * the Inspector; +/− stays the only way to manage it, same as before nesting existed. Sets its
 * own width from its own `widthPercent`, so `CanvasRowBox` doesn't need to know sibling widths. */
export const CanvasColumnBox = memo(function CanvasColumnBox({ rowId, columnId, columnCount }: CanvasColumnBoxProps) {
  const column = useBuilderNode(columnId) as RowColumnBlock | undefined;
  if (!column) return null;

  return (
    <div className='relative rounded-md border border-border/40 p-1' style={{ width: `${column.widthPercent}%` }}>
      {columnCount > MIN_ROW_COLUMNS && (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            removeColumn(rowId, columnId);
          }}
          className='absolute top-1 right-1 z-10 text-muted-foreground hover:text-destructive'
          aria-label='Remove column'>
          <X size={12} />
        </button>
      )}
      <NodeDropZone parentId={columnId} childIds={column.childIds} />
    </div>
  );
});
