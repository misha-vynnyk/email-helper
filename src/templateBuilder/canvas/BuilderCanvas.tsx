import { closestCenter, CollisionDetection, DndContext, DragEndEvent, DragOverlay, DragStartEvent, type DropAnimation, KeyboardSensor, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRef, useState } from "react";

import type { DragData, DropData } from "../dnd/dragTypes";
import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import { addContainer, addLeaf, addReadyMade, getChildIds, moveNode, useRootIds } from "../state/builderStore";
import { selectBlock } from "../state/selectionStore";
import { BuilderPalette } from "./BuilderPalette";
import { CanvasNode } from "./CanvasNode";

/** Resolves a drag-over target to the container it addresses. `over.data.current` is either the
 * hovered container's own droppable payload (`DropData`, kind "container" — its background) or,
 * when hovering a specific sibling node, that node's own `DragData` (every sortable item's
 * `useSortable` registers the same object for both drag and drop) — both shapes carry
 * `parentId` directly, no id-string parsing needed either way. `undefined` = unresolvable
 * (dropped somewhere with no recognizable payload). */
function resolveParentId(overData: DropData | DragData | undefined): string | null | undefined {
  if (!overData) return undefined;
  if (overData.kind === "container" || overData.kind === "node") return overData.parentId;
  return undefined;
}

/**
 * closestCenter один не розрізняє вкладені droppable-и (напр. NodeDropZone всередині
 * CanvasSectionBox, яка сама теж droppable через useSortable) — за центром часто вигравав
 * ЗОВНІШНІЙ контейнер. pointerWithin коректно надає пріоритет найглибшому/найменшому
 * droppable, у якому реально перебуває курсор — depth-agnostic, перевірено й на вкладених
 * рівнях; closestCenter лишається фолбеком, коли курсор не потрапляє в жоден droppable.
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
 * ізольованою репродукцією; усі інші drop-зони в модулі вже й так були в окремих
 * компонентах, тому працювали коректно.
 */
function CanvasRootDropZone({ rootIds }: { rootIds: string[] }) {
  const dropData: DropData = { kind: "container", parentId: null };
  const { setNodeRef } = useDroppable({ id: "canvas-root", data: dropData });

  return (
    <div ref={setNodeRef} onClick={() => selectBlock(null)} className='space-y-3 min-h-[400px] rounded-lg border border-dashed border-border/40 p-3 overflow-y-auto'>
      {rootIds.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-12'>Drag any block here to get started.</p>
      ) : (
        <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
          {rootIds.map((id) => (
            <CanvasNode key={id} id={id} />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

export function BuilderCanvas() {
  const rootIds = useRootIds();
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
    dropAnimationRef.current = data?.kind === "palette" || data?.kind === "ready-made" ? null : undefined;
    if (data?.kind === "palette") setActiveLabel(data.paletteType);
    else if (data?.kind === "ready-made") setActiveLabel(READY_MADE_BY_ID.get(data.definitionId)?.name ?? data.definitionId);
    else setActiveLabel(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DropData | DragData | undefined;
    if (!activeData) return;

    if (activeData.kind === "palette") {
      if (activeData.paletteType === "section" || activeData.paletteType === "row2" || activeData.paletteType === "row3") {
        const parentId = resolveParentId(overData) ?? null;
        const id = activeData.paletteType === "section" ? addContainer(parentId, "section") : addContainer(parentId, "row", activeData.paletteType === "row2" ? 2 : 3);
        selectBlock(id);
        return;
      }
      // text/image/button/divider/spacer — same root fallback as Section/Row above: dropping
      // directly on the empty canvas (or its background, not a specific Section/column) spawns
      // it at the top level instead of requiring a wrapping Section first.
      const parentId = resolveParentId(overData) ?? null;
      const id = addLeaf(parentId, activeData.paletteType);
      selectBlock(id);
      return;
    }

    if (activeData.kind === "ready-made") {
      // Same root fallback as leaves — a ready-made block behaves like a leaf in the tree.
      const parentId = resolveParentId(overData) ?? null;
      const id = addReadyMade(parentId, activeData.definitionId);
      selectBlock(id);
      return;
    }

    if (activeData.kind === "node") {
      const targetParentId = resolveParentId(overData);
      if (targetParentId === undefined) return;
      const siblings = getChildIds(targetParentId);
      const newIndex = overData?.kind === "node" ? siblings.indexOf(String(over.id)) : siblings.length;
      if (newIndex === -1) return;
      // moveNode itself rejects (no-ops) a drop that would place a container inside its own
      // descendant or itself — no separate cycle-check needed here.
      moveNode(String(active.id), targetParentId, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='grid grid-cols-[140px_1fr] gap-4 h-full'>
        <div>
          <h3 className='text-xs font-bold text-muted-foreground mb-2 uppercase'>Palette</h3>
          <BuilderPalette />
        </div>

        <CanvasRootDropZone rootIds={rootIds} />
      </div>

      <DragOverlay dropAnimation={dropAnimationRef.current}>{activeLabel ? <div className='rounded-md border border-primary bg-card px-3 py-1.5 text-xs font-semibold shadow-lg'>{activeLabel}</div> : null}</DragOverlay>
    </DndContext>
  );
}
