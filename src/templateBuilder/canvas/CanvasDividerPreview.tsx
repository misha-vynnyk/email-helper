import { Minus } from "lucide-react";
import { memo } from "react";

import { renderDivider } from "../render/renderDivider";
import { useBuilderNode } from "../state/builderStore";
import type { DividerBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasDividerPreviewProps {
  id: string;
}

/** Real WYSIWYG preview for a Divider leaf (canva-plan-v2.md Stage 5) — reuses `renderDivider`
 * verbatim. See CanvasTextPreview for why `paddingBottomPx` is always 0 here. */
export const CanvasDividerPreview = memo(function CanvasDividerPreview({ id }: CanvasDividerPreviewProps) {
  const block = useBuilderNode(id) as DividerBlock | undefined;
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={Minus}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderDivider(block, 0) }} />
      </table>
    </CanvasChipShell>
  );
});
