import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";

import { removeCanvasBlock, sectionContainerId } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import type { SectionBlock } from "../types";
import { CanvasBlockShell } from "./CanvasBlockShell";
import { LeafDropZone } from "./LeafDropZone";

interface CanvasSectionBoxProps {
  section: SectionBlock;
}

export const CanvasSectionBox = memo(function CanvasSectionBox({ section }: CanvasSectionBoxProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: section.id, data: { kind: "canvas-block" } });
  const isSelected = useIsSelected(section.id);
  const style = { transform: CSS.Transform.toString(transform), transition };

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
      onSelect={() => selectBlock(section.id)}
      onRemove={() => removeCanvasBlock(section.id)}
      removeAriaLabel='Remove section'>
      <LeafDropZone containerId={sectionContainerId(section.id)} leaves={section.children} />
    </CanvasBlockShell>
  );
});
