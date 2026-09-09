import { LayoutTemplate } from "lucide-react";
import { memo } from "react";

import { renderReadyMade } from "../render/renderReadyMade";
import { useBuilderNode } from "../state/builderStore";
import type { ReadyMadeBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasReadyMadePreviewProps {
  id: string;
}

/** Real WYSIWYG preview for a ready-made block (canva-plan-v2.md Stage 5) — reuses
 * `renderReadyMade` verbatim, same as the other leaf preview components, replacing the previous
 * definition-name-only label. */
export const CanvasReadyMadePreview = memo(function CanvasReadyMadePreview({ id }: CanvasReadyMadePreviewProps) {
  const block = useBuilderNode(id) as ReadyMadeBlock | undefined;
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={LayoutTemplate}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderReadyMade(block) }} />
      </table>
    </CanvasChipShell>
  );
});
