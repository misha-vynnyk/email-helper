import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeNode, useBuilderNode } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import type { SectionBlock } from "../types";
import { CanvasBlockShell } from "./CanvasBlockShell";
import { NodeDropZone } from "./NodeDropZone";

interface CanvasSectionBoxProps {
  id: string;
}

export const CanvasSectionBox = memo(function CanvasSectionBox({ id }: CanvasSectionBoxProps) {
  const section = useBuilderNode(id) as SectionBlock | undefined;
  const dragData: DragData = { kind: "node", parentId: section?.parentId ?? null };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id, data: dragData });
  const isSelected = useIsSelected(id);
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!section) return null;

  return (
    <CanvasBlockShell
      label='SECTION'
      isSelected={isSelected}
      isDragging={isDragging}
      isOver={isOver}
      style={style}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      onSelect={() => selectBlock(id)}
      onRemove={() => removeNode(id)}
      removeAriaLabel='Remove section'>
      <NodeDropZone parentId={id} childIds={section.childIds} />
    </CanvasBlockShell>
  );
});
