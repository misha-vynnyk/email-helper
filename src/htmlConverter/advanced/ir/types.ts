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
  headingLevel?: number;     // original H1–H6 tag level; used by classify to map to components
  accent?: boolean;          // bold accent line → template prepends ▸ (tokens.accentBullet)
  lines: Run[][];            // each line = array of runs; lines joined with <br>
}

export interface ImageNode {
  type: "img";
  src: string;
  alt?: string;
}

export interface CellNode {
  type: "cell";
  colspan?: number;
  bg?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  children: StructuralNode[];
}

export interface RowNode {
  type: "row";
  cells: CellNode[];
}

export interface TableNode {
  type: "table";
  rows: RowNode[];
  colWidths?: number[];  // relative widths from <colgroup><col> (raw px values, any sum)
}

/** Collector for non-fatal conversion issues (silently-dropped/flattened content). */
export type WarnFn = (message: string) => void;

export type StructuralNode = TableNode | RowNode | CellNode | Paragraph | ImageNode;

// ── Stage 2: Semantic IR (classified, renderable) ────────────────────────────

export type ComponentKind =
  | "alertBand"
  | "paragraph"
  | "buttonBand"
  | "calloutLeft"
  | "statsGrid"
  | "recordRow"
  | "image"
  | "spacer";

export interface ComponentNode {
  kind: ComponentKind;
  props: Record<string, unknown>;  // normalized data for house-template
  children?: ComponentNode[];      // for containers (calloutBox, statsGrid…)
}
