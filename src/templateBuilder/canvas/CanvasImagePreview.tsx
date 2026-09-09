import { Image as ImageIcon } from "lucide-react";
import { memo } from "react";

import { renderImage } from "../render/renderImage";
import { useBuilderNode } from "../state/builderStore";
import type { ImageBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasImagePreviewProps {
  id: string;
}

/** Real WYSIWYG preview for an Image leaf (canva-plan-v2.md Stage 5) — reuses `renderImage`
 * verbatim. See CanvasTextPreview for why `paddingBottomPx` is always 0 here. */
export const CanvasImagePreview = memo(function CanvasImagePreview({ id }: CanvasImagePreviewProps) {
  const block = useBuilderNode(id) as ImageBlock | undefined;
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={ImageIcon}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderImage(block, 0) }} />
      </table>
    </CanvasChipShell>
  );
});
