// ── Stage 1: Structural IR (dumb DOM mapping) ────────────────────────────────

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;      // already normalized (§5)
  href?: string;
  /** Internal only: set on the LINE_BREAK run for a <br data-one-br> (user-typed §
   * marker). Consumed by fromDom's splitIntoLines to detect § at a paragraph's end —
   * never present on a run that reaches rendering. */
  oneBr?: true;
}

export interface Paragraph {
  type: "p";
  align?: "left" | "center" | "right";
  size: "body" | "small" | "headline";   // role, not px (§6)
  headingLevel?: number;     // original H1–H6 tag level; used by classify to map to components
  accent?: boolean;          // bold accent line → template prepends ▸ (tokens.accentBullet)
  lines: Run[][];            // each line = array of runs; lines joined with <br>
  paraBreaks?: Set<number>;  // line indices preceded by an author-typed blank line
                              // (<br><br> inside one <p>) — rendered as <br><br>
  listItem?: boolean;        // true for a <li>-derived paragraph (real <ul>/<ol>)
  tightNext?: boolean;       // true if this paragraph's raw HTML ended with a user-typed
                              // § (ONE_BR) marker — signals "no gap before whatever follows",
                              // same tightness class as center-align/listItem in pushMerged
}

export interface ImageNode {
  type: "img";
  src: string;
  alt?: string;
}

export interface BorderSide {
  color: string;  // normalized via canonicalizeBg (§5)
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
  border?: BorderSpec;      // for classification (§4) and border color — not for metrics
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
//
// ComponentNode is a discriminated union: each `kind` carries its own typed
// `props` shape. Producers (detect/*) build these literals under compile-time
// checking; the renderer (render/toEmailHtml) narrows on `kind` and reads props
// without casts. Add a kind by extending both the union and the render switch —
// the exhaustiveness check will flag the missing case.

export type Align = "left" | "center" | "right";
export type SizeRole = "body" | "small" | "headline";

export interface ParagraphProps {
  lines: Run[][];
  size: SizeRole;
  align?: Align;
  variant?: "quote";           // h4 marker: extra horizontal indent
  paraBreaks?: Set<number>;    // line indices rendered as <br><br>
  listItem?: boolean;
  tightNext?: boolean;         // ends with § — next merged paragraph gets no gap before it
  /** statsGrid cell paragraphs only: cell background + border color */
  bg?: string;
  borderColor?: string;
}

export interface AlertBandProps {
  lines: Run[][];
  bg: string;
  paraBreaks?: Set<number>;
  border?: BorderSpec;
  /**
   * Nested tables inside the source cell that resolve to a real button (GDocs'
   * h5-in-colored-cell pattern) — rendered as actual buttons instead of being
   * flattened to text. `atLine` is the index into `lines` the button is inserted
   * before (does not itself occupy a `lines` slot).
   */
  buttons?: { atLine: number; props: ButtonBandProps }[];
  /** Text alignment from the source cell's paragraphs — defaults to left. */
  align?: Align;
}

export interface ButtonBandProps {
  runs: Run[];
  href: string;
  bg: string;
  radius?: number;             // 0 = no rounding (GDocs table-cell buttons)
  border?: BorderSpec;
}

export interface CalloutLeftProps {
  lines: Run[][];
  accentColor: string;
  paraBreaks?: Set<number>;
  bg?: string;
}

export interface CalloutBoxProps {
  border: BorderSpec;
  bg?: string;
}

export interface StatsGridProps {
  n: number;
  widths?: number[];
  borderColor?: string;
}

export interface RecordCellData {
  lines: Run[][];
  align?: Align;
  bg?: string;
  border?: BorderSpec;
  borderColor?: string;
}

export interface RecordRowData {
  bg?: string;
  cells: RecordCellData[];
}

export interface RecordRowProps {
  rows: RecordRowData[];
  widths?: number[];
  borderColor?: string;
}

export interface SplitRowProps {
  left: Run[];
  right: Run[];
}

export interface ImageProps {
  src: string;
  alt?: string;
}

export interface SpacerProps {
  heightPx?: number;
}

export type ComponentNode =
  | { kind: "paragraph"; props: ParagraphProps }
  | { kind: "alertBand"; props: AlertBandProps }
  | { kind: "buttonBand"; props: ButtonBandProps }
  | { kind: "calloutLeft"; props: CalloutLeftProps }
  | { kind: "calloutBox"; props: CalloutBoxProps; children: ComponentNode[] }
  | { kind: "statsGrid"; props: StatsGridProps; children: ComponentNode[] }
  | { kind: "recordRow"; props: RecordRowProps }
  | { kind: "splitRow"; props: SplitRowProps }
  | { kind: "image"; props: ImageProps }
  | { kind: "spacer"; props: SpacerProps };

export type ComponentKind = ComponentNode["kind"];
