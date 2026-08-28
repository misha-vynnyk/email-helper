import { useRef } from "react";

import { getChildIds, getNode, updateColumnWidths } from "../state/builderStore";
import type { RowColumnBlock } from "../types";
import { columnWidthsAfterDividerDrag } from "./resizeMath";
import { usePointerDrag } from "./usePointerDrag";

interface CanvasColumnDividerProps {
  rowId: string;
  dividerIndex: number;
  rowRef: React.RefObject<HTMLDivElement>;
  onPreview: (widths: number[] | null) => void;
}

/** Drag handle between two adjacent columns. Reads the row's live widths imperatively at
 * `onDragStart` (not via a `useBuilderNode` subscription per column in the parent) — `CanvasRowBox`
 * can't call a per-column hook in its `.map()` since the column count is variable, and calling a
 * different NUMBER of hooks across renders of the same component instance would break the Rules
 * of Hooks. */
export function CanvasColumnDivider({ rowId, dividerIndex, rowRef, onPreview }: CanvasColumnDividerProps) {
  const baseWidthsRef = useRef<number[]>([]);

  const { isDragging, handlers } = usePointerDrag({
    cursor: "col-resize",
    onDragStart: () => {
      baseWidthsRef.current = getChildIds(rowId).map((id) => (getNode(id) as RowColumnBlock).widthPercent);
    },
    onDrag: ({ dx }) => {
      const clientWidth = rowRef.current?.clientWidth ?? 1;
      onPreview(columnWidthsAfterDividerDrag(baseWidthsRef.current, dividerIndex, (dx / clientWidth) * 100));
    },
    onDragEnd: ({ dx }) => {
      const clientWidth = rowRef.current?.clientWidth ?? 1;
      updateColumnWidths(rowId, columnWidthsAfterDividerDrag(baseWidthsRef.current, dividerIndex, (dx / clientWidth) * 100));
      onPreview(null);
    },
  });

  return (
    <div
      {...handlers}
      role='separator'
      aria-orientation='vertical'
      aria-label='Resize columns'
      className={`w-1.5 shrink-0 cursor-col-resize self-stretch rounded-sm transition-colors ${isDragging ? "bg-primary" : "bg-transparent hover:bg-primary/40"}`}
    />
  );
}
