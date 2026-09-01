import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRef } from "react";

import { containerDropZoneId, type DropData } from "../dnd/dragTypes";
import { CanvasNode } from "./CanvasNode";
import { SpacingOverlay } from "./SpacingOverlay";

interface NodeDropZoneProps {
  parentId: string;
  childIds: string[];
  /** Section's children get a real `gap` CSS layout (so `gapPx` — and the Stage 2 drag handles in
   * SpacingOverlay — actually change visible spacing); a Row-column keeps the fixed Tailwind
   * `space-y-1.5` it always had — WYSIWYG editing for Row is a later milestone, see
   * canva-plan-v1.md's "Явно поза цим планом". */
  containerKind: "section" | "column";
  /** Only read when `containerKind === "section"`. */
  gapPx?: number;
  /** Only read when `containerKind === "section"` — live gap value while a SpacingOverlay handle
   * is being dragged (`null` once released), so the caller (CanvasSectionBox) can feed it straight
   * back into this same `gapPx` prop for a WYSIWYG-ish live preview, same pattern as
   * CanvasRowBox's `previewWidths`/`onPreview` for column dividers. */
  onGapPreview?: (px: number | null) => void;
}

/** Droppable+sortable zone for the children of one container (a Section or a Row-column).
 * Renders whatever each child actually is via `CanvasNode`, so a Section/Row landing here works
 * exactly like a leaf landing here — nesting is just "the child happens to be a container too". */
export function NodeDropZone({ parentId, childIds, containerKind, gapPx, onGapPreview }: NodeDropZoneProps) {
  const dropData: DropData = { kind: "container", parentId };
  const { setNodeRef, isOver } = useDroppable({ id: containerDropZoneId(parentId), data: dropData });
  // SpacingOverlay's handles are `position: absolute` inside THIS div — it needs this exact
  // element's own rect as its positioning frame of reference, not the outer CanvasBlockShell box
  // (whose header/padding would otherwise throw off every computed offset). A local ref, not
  // nodeRectRegistry (that registry is keyed by node id for the outer shell/chip boxes only).
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSection = containerKind === "section";
  const style = isSection ? { display: "flex", flexDirection: "column" as const, gap: `${gapPx ?? 0}px` } : undefined;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        containerRef.current = el;
      }}
      style={style}
      className={`relative min-h-12 rounded-md p-1.5 transition-colors ${isSection ? "" : "space-y-1.5"} ${isOver ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}>
      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        {childIds.length === 0 ? <p className='text-[11px] text-muted-foreground text-center py-2'>Drop a block here</p> : childIds.map((id) => <CanvasNode key={id} id={id} />)}
      </SortableContext>
      {isSection && childIds.length > 1 && (
        <SpacingOverlay sectionId={parentId} containerRef={containerRef} childIds={childIds} gapPx={gapPx ?? 0} onPreview={onGapPreview ?? (() => {})} />
      )}
    </div>
  );
}
