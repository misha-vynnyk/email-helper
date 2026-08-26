import { Image as ImageIcon, type LucideIcon, Minus, MousePointerClick, MoveVertical, Type } from "lucide-react";
import { memo } from "react";

import { useBuilderNode } from "../state/builderStore";
import type { BuilderLeafBlock } from "../types";
import { CanvasChipShell } from "./CanvasChipShell";

function leafPreviewText(leaf: BuilderLeafBlock): string {
  switch (leaf.type) {
    case "image":
      return leaf.alt || "Image";
    case "button":
      return leaf.label || "Button";
    case "divider":
      return "Divider";
    case "spacer":
      return `Spacer (${leaf.heightPx}px)`;
    case "text": {
      const stripped = leaf.contentHtml.replace(/<[^>]+>/g, "").trim();
      return stripped || "Text block";
    }
  }
}

const LEAF_ICON: Record<BuilderLeafBlock["type"], LucideIcon> = {
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  divider: Minus,
  spacer: MoveVertical,
};

interface CanvasLeafChipProps {
  id: string;
}

export const CanvasLeafChip = memo(function CanvasLeafChip({ id }: CanvasLeafChipProps) {
  const leaf = useBuilderNode(id) as BuilderLeafBlock | undefined;
  if (!leaf) return null;

  return <CanvasChipShell id={id} parentId={leaf.parentId} icon={LEAF_ICON[leaf.type]} label={leafPreviewText(leaf)} />;
});
