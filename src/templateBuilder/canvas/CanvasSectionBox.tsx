import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useEffect, useState } from "react";

import type { DragData } from "../dnd/dragTypes";
import { removeNode, useBuilderNode, useShellConfig } from "../state/builderStore";
import { selectBlock, useIsSelected } from "../state/selectionStore";
import { computeSectionBox, toReactStyle } from "../styling/sectionBoxStyle";
import type { SectionBlock } from "../types";
import { CanvasWysiwygShell } from "./CanvasWysiwygShell";
import { NodeDropZone } from "./NodeDropZone";
import { registerNodeRef } from "./nodeRectRegistry";

interface CanvasSectionBoxProps {
  id: string;
}

export const CanvasSectionBox = memo(function CanvasSectionBox({ id }: CanvasSectionBoxProps) {
  const section = useBuilderNode(id) as SectionBlock | undefined;
  const shell = useShellConfig();
  const dragData: DragData = { kind: "node", parentId: section?.parentId ?? null };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id, data: dragData });
  const isSelected = useIsSelected(id);
  const style = { transform: CSS.Transform.toString(transform), transition };
  // Live preview of a SpacingOverlay gap-handle drag — same pattern as CanvasRowBox's
  // previewWidths for column dividers: fed straight back into NodeDropZone's real `gap` CSS so
  // the drag looks live, committed to the store only on release (via updateSectionStyle).
  const [previewGapPx, setPreviewGapPx] = useState<number | null>(null);
  // Same guard CanvasRowBox has for previewWidths: a child added/removed elsewhere (e.g. an undo
  // firing) while a gap-handle drag is somehow still active would otherwise leave this preview
  // stuck showing a value the store never actually committed.
  useEffect(() => setPreviewGapPx(null), [section?.childIds.length]);

  if (!section) return null;

  // undefined widthPx = a nested instance (types.ts's own convention) — stretch to 100% of the
  // parent instead of rendering computed.ownWidthPx, which for a nested Section is only a
  // fallback used for the childrenAvailableWidthPx math, not a real own-width to paint.
  const widthMode = section.widthPx !== undefined ? "fixed" : "fill";
  const computed = computeSectionBox(section, shell.contentWidthPx);

  return (
    <CanvasWysiwygShell
      label='SECTION'
      computedStyle={toReactStyle(computed, { widthMode })}
      isSelected={isSelected}
      isDragging={isDragging}
      isOver={isOver}
      positionStyle={style}
      setNodeRef={(el) => {
        setNodeRef(el);
        registerNodeRef(id, el);
      }}
      attributes={attributes}
      listeners={listeners}
      onSelect={() => selectBlock(id)}
      onRemove={() => removeNode(id)}
      removeAriaLabel='Remove section'>
      <NodeDropZone parentId={id} childIds={section.childIds} containerKind='section' gapPx={previewGapPx ?? section.gapPx} onGapPreview={setPreviewGapPx} />
    </CanvasWysiwygShell>
  );
});
