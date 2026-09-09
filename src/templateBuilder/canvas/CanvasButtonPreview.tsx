import { MousePointerClick } from "lucide-react";
import { memo } from "react";

import { renderButton } from "../render/renderButton";
import { useBuilderNode, useShellConfig } from "../state/builderStore";
import type { ButtonBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasButtonPreviewProps {
  id: string;
}

/** Real WYSIWYG preview for a Button leaf (canva-plan-v2.md Stage 5) — reuses `renderButton`
 * verbatim. See CanvasTextPreview for why `paddingBottomPx` is always 0 here. */
export const CanvasButtonPreview = memo(function CanvasButtonPreview({ id }: CanvasButtonPreviewProps) {
  const block = useBuilderNode(id) as ButtonBlock | undefined;
  const shell = useShellConfig();
  if (!block) return null;

  return (
    <CanvasChipShell id={id} parentId={block.parentId} icon={MousePointerClick}>
      <table role='presentation' cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", pointerEvents: "none" }}>
        <tbody dangerouslySetInnerHTML={{ __html: renderButton(block, shell.fontFamily, 0) }} />
      </table>
    </CanvasChipShell>
  );
});
