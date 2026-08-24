import { closestCenter, CollisionDetection, DndContext, DragEndEvent, DragOverlay, DragStartEvent, type DropAnimation, KeyboardSensor, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRef, useState } from "react";

import type { DragData, DropData } from "../dnd/dragTypes";
import { addLeaf, addRow, addSection, columnContainerId, getCanvas, getContainerChildren, moveLeaf, reorderCanvasBlocks, sectionContainerId, useCanvas } from "../state/builderStore";
import { selectBlock } from "../state/selectionStore";
import type { CanvasBlock } from "../types";
import { BuilderPalette } from "./BuilderPalette";
import { CanvasRowBox } from "./CanvasRowBox";
import { CanvasSectionBox } from "./CanvasSectionBox";

/**
 * Resolves a drop target to a container id. Section/Row boxes are themselves sortable
 * (kind "canvas-block", for top-level reordering), so dropping a palette/leaf item anywhere on
 * a section's or row's body — not just precisely inside its nested LeafDropZone — must still
 * land somewhere sensible instead of silently no-opping: falls back to the section's own
 * children, or the row's first column.
 */
function resolveContainerId(overId: string | number | undefined, overData: DropData | undefined, canvas: CanvasBlock[]): string | undefined {
  if (!overData || overId === undefined) return undefined;
  if (overData.kind === "container" || overData.kind === "leaf") return overData.containerId;
  if (overData.kind === "canvas-block") {
    const block = canvas.find((b) => b.id === overId);
    if (!block) return undefined;
    return block.type === "section" ? sectionContainerId(block.id) : columnContainerId(block.id, block.columns[0].id);
  }
  return undefined;
}

/**
 * closestCenter один не розрізняє вкладені droppable-и (напр. LeafDropZone всередині
 * CanvasSectionBox, яка сама теж droppable через useSortable) — за центром часто вигравав
 * ЗОВНІШНІЙ контейнер. pointerWithin коректно надає пріоритет найглибшому/найменшому
 * droppable, у якому реально перебуває курсор; closestCenter лишається фолбеком, коли
 * курсор не потрапляє в жоден droppable (напр. точно на межі).
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

/**
 * Кореневий droppable ОБОВ'ЯЗКОВО в окремому дочірньому компоненті, не в тому самому,
 * що рендерить <BuilderPalette /> (яка сама містить useDraggable) — інакше dnd-kit
 * (щонайменше @dnd-kit/core 6.3.1) не вимірює/не знаходить цей droppable під час drag
 * (collision detection стабільно повертає over:undefined). Емпірично підтверджено
 * ізольованою репродукцією; усі інші drop-зони (LeafDropZone/CanvasSectionBox/CanvasRowBox)
 * вже й так були в окремих компонентах, тому працювали коректно.
 */
function CanvasRootDropZone({ canvas }: { canvas: CanvasBlock[] }) {
  const { setNodeRef } = useDroppable({ id: "canvas-root", data: { kind: "canvas-root" } as DropData });

  return (
    <div ref={setNodeRef} onClick={() => selectBlock(null)} className='space-y-3 min-h-[400px] rounded-lg border border-dashed border-border/40 p-3 overflow-y-auto'>
      {canvas.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-12'>Drag a Section or Row here to get started.</p>
      ) : (
        <SortableContext items={canvas.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {canvas.map((block) => (block.type === "section" ? <CanvasSectionBox key={block.id} section={block} /> : <CanvasRowBox key={block.id} row={block} />))}
        </SortableContext>
      )}
    </div>
  );
}

export function BuilderCanvas() {
  const canvas = useCanvas();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  // A palette drag spawns a brand-new block elsewhere in the canvas — the palette chip itself
  // never moves. dnd-kit's default drop animation flies the overlay back to the *origin*
  // draggable's rect, which for a spawn looks exactly like a rejected drop (the new block
  // already exists, but the ghost visibly snaps back to the palette). Reordering drags (canvas
  // blocks/leaves) keep the default animation since the origin node there really is the item's
  // last-known position, so animating "back" to it is correct. Set once at drag-start (not
  // cleared in handleDragEnd) so the value dnd-kit reads for the drop transition is the one that
  // matched THIS drag, not whatever handleDragEnd resets state to afterwards.
  const dropAnimationRef = useRef<DropAnimation | null | undefined>(undefined);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    dropAnimationRef.current = data?.kind === "palette" ? null : undefined;
    if (data?.kind === "palette") setActiveLabel(data.paletteType);
    else setActiveLabel(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DropData | undefined;
    if (!activeData) return;

    if (activeData.kind === "palette") {
      if (activeData.paletteType === "section") {
        const id = addSection();
        selectBlock(id);
        return;
      }
      if (activeData.paletteType === "row2" || activeData.paletteType === "row3") {
        const id = addRow(activeData.paletteType === "row2" ? 2 : 3);
        selectBlock(id);
        return;
      }
      // text or image — needs to land on a valid section/column container
      const containerId = resolveContainerId(over.id, overData, getCanvas());
      if (containerId) {
        const id = addLeaf(containerId, activeData.paletteType);
        selectBlock(id);
      }
      return;
    }

    if (activeData.kind === "canvas-block") {
      const canvasNow = getCanvas();
      const oldIndex = canvasNow.findIndex((b) => b.id === active.id);
      const newIndex = canvasNow.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) reorderCanvasBlocks(oldIndex, newIndex);
      return;
    }

    if (activeData.kind === "leaf") {
      const canvasNow = getCanvas();
      const targetContainerId = resolveContainerId(over.id, overData, canvasNow);
      if (!targetContainerId) return;
      const fromContainerId = activeData.containerId;
      const siblings = getContainerChildren(canvasNow, targetContainerId);
      const newIndex = overData?.kind === "leaf" ? siblings.findIndex((c) => c.id === over.id) : siblings.length;
      if (newIndex === -1) return;

      if (fromContainerId === targetContainerId) {
        const oldIndex = siblings.findIndex((c) => c.id === active.id);
        if (oldIndex !== -1 && oldIndex !== newIndex) moveLeaf(String(active.id), targetContainerId, newIndex);
      } else {
        // Cross-container: `siblings` doesn't include `active` (it still lives in
        // fromContainerId), so the hovered index needs no removal-offset adjustment.
        moveLeaf(String(active.id), targetContainerId, newIndex);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='grid grid-cols-[140px_1fr] gap-4 h-full'>
        <div>
          <h3 className='text-xs font-bold text-muted-foreground mb-2 uppercase'>Palette</h3>
          <BuilderPalette />
        </div>

        <CanvasRootDropZone canvas={canvas} />
      </div>

      <DragOverlay dropAnimation={dropAnimationRef.current}>{activeLabel ? <div className='rounded-md border border-primary bg-card px-3 py-1.5 text-xs font-semibold shadow-lg'>{activeLabel}</div> : null}</DragOverlay>
    </DndContext>
  );
}
