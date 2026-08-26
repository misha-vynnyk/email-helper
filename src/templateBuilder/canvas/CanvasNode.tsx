import { useBuilderNode } from "../state/builderStore";
import { CanvasLeafChip } from "./CanvasLeafChip";
import { CanvasRowBox } from "./CanvasRowBox";
import { CanvasSectionBox } from "./CanvasSectionBox";

interface CanvasNodeProps {
  id: string;
}

/** Recursive dispatcher: a leaf id renders as a CanvasLeafChip, a Section/Row id renders
 * (recursively, since CanvasSectionBox/CanvasRowBox render their own children through this same
 * component again) as its own box. Nesting depth is driven entirely by how deep the tree
 * actually goes — no depth limit here. */
export function CanvasNode({ id }: CanvasNodeProps) {
  const node = useBuilderNode(id);
  if (!node) return null;
  if (node.type === "section") return <CanvasSectionBox id={id} />;
  if (node.type === "row") return <CanvasRowBox id={id} />;
  if (node.type === "row-column") return null; // columns only ever render via CanvasRowBox, never appear in a generic child list
  return <CanvasLeafChip id={id} />;
}
