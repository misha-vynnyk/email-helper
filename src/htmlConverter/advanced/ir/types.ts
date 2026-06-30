// ── Stage 1: Structural IR (dumb DOM mapping) ────────────────────────────────

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;      // already normalized (§5)
  href?: string;
}

export interface Paragraph {
  type: "p";
  align?: "left" | "center" | "right";
  size: "body" | "small" | "headline";   // role, not px (§6)
  accent?: boolean;          // bold accent line → template prepends ▸ (tokens.accentBullet)
  lines: Run[][];            // each line = array of runs; lines joined with <br>
}

export interface ImageNode {
  type: "img";
  src: string;
  alt?: string;
}

export interface BorderSide {
  width: number;  // px
  color: string;  // normalized hex
}

export interface BorderSpec {
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
}

export interface CellNode {
  type: "cell";
  colspan?: number;
  bg?: string;
  border?: BorderSpec;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  colWidthPct?: number;  // relative column width from <col> elements (for statsGrid/recordRow detection)
  children: StructuralNode[];
}

export interface RowNode {
  type: "row";
  cells: CellNode[];
}

export interface TableNode {
  type: "table";
  rows: RowNode[];
  colWidths?: number[];  // relative widths from <colgroup><col>, sum = 100
}

export type StructuralNode = TableNode | RowNode | CellNode | Paragraph | ImageNode;

// ── Stage 2: Semantic IR (classified, renderable) ────────────────────────────

export type ComponentKind =
  | "alertBand"
  | "header"
  | "divider"
  | "paragraph"
  | "buttonBand"
  | "calloutLeft"
  | "calloutBox"
  | "statsGrid"
  | "recordRow"
  | "authorBlock"
  | "warningLine"
  | "spacer";

export interface ComponentNode {
  kind: ComponentKind;
  props: Record<string, unknown>;  // normalized data for house-template
  children?: ComponentNode[];      // for containers (calloutBox, statsGrid…)
}
