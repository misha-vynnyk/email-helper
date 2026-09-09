import { MoveVertical } from "lucide-react";
import { memo } from "react";

import { renderSpacer } from "../render/renderSpacer";
import { useBuilderNode } from "../state/builderStore";
import type { SpacerBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasSpacerPreviewProps {
  id: string;
}

/** Real WYSIWYG preview for a Spacer leaf (canva-plan-v2.md Stage 5) — reuses `renderSpacer`
 * verbatim, so the chip's visible height on canvas matches `heightPx` exactly, same as export. */
export const CanvasSpacerPreview = memo(function CanvasSpacerPreview({ id }: CanvasSpacerPreviewProps) {
  const block = useBuilderNode(id) as SpacerBlock | undefined;
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={MoveVertical}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderSpacer(block) }} />
      </table>
    </CanvasChipShell>
  );
});
