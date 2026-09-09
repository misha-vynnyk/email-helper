import { useBuilderNode } from "../state/builderStore";
import { CanvasButtonPreview } from "./CanvasButtonPreview";
import { CanvasDividerPreview } from "./CanvasDividerPreview";
import { CanvasImagePreview } from "./CanvasImagePreview";
import { CanvasReadyMadePreview } from "./CanvasReadyMadePreview";
import { CanvasRowBox } from "./CanvasRowBox";
import { CanvasSectionBox } from "./CanvasSectionBox";
import { CanvasSpacerPreview } from "./CanvasSpacerPreview";
import { CanvasTextPreview } from "./CanvasTextPreview";

interface CanvasNodeProps {
  id: string;
}

/** Recursive dispatcher, mirroring `render/renderNode.ts`'s own switch: a leaf/ready-made id
 * renders as its real WYSIWYG preview (canva-plan-v2.md Stage 5), a Section/Row id renders
 * (recursively, since CanvasSectionBox/CanvasRowBox render their own children through this same
 * component again) as its own box. Nesting depth is driven entirely by how deep the tree
 * actually goes — no depth limit here. */
export function CanvasNode({ id }: CanvasNodeProps) {
  const node = useBuilderNode(id);
  if (!node) return null;
  switch (node.type) {
    case "section":
      return <CanvasSectionBox id={id} />;
    case "row":
      return <CanvasRowBox id={id} />;
    case "row-column":
      return null; // columns only ever render via CanvasRowBox, never appear in a generic child list
    case "ready-made":
      return <CanvasReadyMadePreview id={id} />;
    case "text":
      return <CanvasTextPreview id={id} />;
    case "image":
      return <CanvasImagePreview id={id} />;
    case "button":
      return <CanvasButtonPreview id={id} />;
    case "divider":
      return <CanvasDividerPreview id={id} />;
    case "spacer":
      return <CanvasSpacerPreview id={id} />;
  }
}
