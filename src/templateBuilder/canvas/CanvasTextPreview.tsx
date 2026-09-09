import { Type } from "lucide-react";
import { memo } from "react";

import { renderText } from "../render/renderText";
import { useBuilderNode, useShellConfig } from "../state/builderStore";
import type { TextBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasTextPreviewProps {
  id: string;
}

/** Real WYSIWYG preview for a Text leaf (canva-plan-v2.md Stage 5) — reuses `renderText` verbatim
 * (the same function export uses), so canvas and export can never visually diverge.
 * `paddingBottomPx` is always 0 here: inter-block gap on canvas comes from the parent
 * container's own layout (NodeDropZone's flex `gap`/`space-y-1.5`), not from this fragment's own
 * padding — passing the real gap here too would double it. */
export const CanvasTextPreview = memo(function CanvasTextPreview({ id }: CanvasTextPreviewProps) {
  const block = useBuilderNode(id) as TextBlock | undefined;
  const shell = useShellConfig();
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={Type}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderText(block, shell.fontFamily, 0) }} />
      </table>
    </CanvasChipShell>
  );
});
