import { LayoutTemplate } from "lucide-react";
import { memo } from "react";

import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import { useBuilderNode } from "../state/builderStore";
import type { ReadyMadeBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

interface CanvasReadyMadeChipProps {
  id: string;
}

/** Same "icon + one-line preview, no WYSIWYG on canvas" convention as CanvasLeafChip — previews
 * by definition name (not any of the block's own field values), which is the only real
 * difference from CanvasLeafChip; both delegate their shared chrome to CanvasChipShell. */
export const CanvasReadyMadeChip = memo(function CanvasReadyMadeChip({ id }: CanvasReadyMadeChipProps) {
  const block = useBuilderNode(id) as ReadyMadeBlock | undefined;
  if (!block) return null;

  const definition = READY_MADE_BY_ID.get(block.definitionId);
  return <CanvasChipShell id={id} parentId={block.parentId} icon={LayoutTemplate} label={definition?.name ?? block.definitionId} />;
});
