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
  tightBefore?: boolean;     // true if this paragraph's raw HTML STARTED with a user-typed
                              // § marker — the mirror of tightNext, for when the author places
                              // § at the start of the next paragraph instead of the end of the
                              // previous one. "no gap before ME".
  zeroTopMargin?: boolean;    // source <p> explicitly declared margin-top:0 — one half of the
                              // pairwise zero-gap signal (see pushMerged): the author set the
                              // doc's paragraph spacing to nothing, so Enter LOOKS like a plain
                              // line break. Absence of a margin declaration is NOT zero.
  zeroBottomMargin?: boolean; // mirror: explicit margin-bottom:0 on the source <p>
  gapBefore?: boolean;        // an author-typed blank line (top-level <br> between blocks)
                              // immediately precedes this paragraph — an explicit "I want a gap
                              // here", vetoes convention-based tight merging (except §, which
                              // is the stronger explicit marker)
}

export interface ImageNode {
  type: "img";
  src: string;
  alt?: string;
}

export interface BorderSide {
  color: string;  // normalized via canonicalizeBg (§5)
  /** Author-declared width, quantized to whole px (pt → px × 96/72, clamped to [1, 12]).
   *  Absent when the source declared no width — renderers fall back to the width token.
   *  Quantizing (instead of ignoring width entirely) keeps the author's thin-line vs
   *  heavy-bar intent while avoiding fractional pt values email clients render unreliably. */
  widthPx?: number;
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
  /**
   * Two roles, same field: (1) INPUT, propagated straight from the source Paragraph
   * (fromDom.ts) when the author's raw HTML started with § — one of pushMerged's
   * merge-eligibility signals, same as tightNext. (2) OUTPUT: when pushMerged can't
   * merge this paragraph with its predecessor (different size/align/variant — e.g. a
   * headline followed by body text can't share one <span>'s formatting) but the "no
   * gap" intent still applies, pushMerged sets/confirms it here so the renderer zeroes
   * THIS paragraph's top padding. Paired with tightAfter (set on the PREVIOUS
   * paragraph, zeroing its bottom padding) to approximate a single-<br> gap between
   * two separately-styled blocks.
   */
  tightBefore?: boolean;
  /** Render-only, set by pushMerged — see tightBefore. Zeroes THIS paragraph's bottom padding. */
  tightAfter?: boolean;
  /** Input-only merge signals propagated from the source Paragraph (fromDom.ts) —
   *  consumed by pushMerged, never read at render time. See Paragraph for semantics. */
  zeroTopMargin?: boolean;
  zeroBottomMargin?: boolean;
  gapBefore?: boolean;
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
  /**
   * Nested tables that resolve to their own colored band (e.g. a dark pseudo-button
   * cell inside a dark bordered CTA box) — kept as separate colored rows instead of
   * being flattened to plain text, which would silently drop the inner bg. Same
   * `atLine` convention as `buttons`.
   */
  bands?: { atLine: number; props: AlertBandProps }[];
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
  /** Author-declared left-border width (see BorderSide.widthPx); token fallback when absent. */
  accentWidthPx?: number;
  paraBreaks?: Set<number>;
  bg?: string;
}

export interface CalloutBoxProps {
  border: BorderSpec;
  bg?: string;
}

export interface TextDividerProps {
  lines: Run[][];
  align?: Align;
  paraBreaks?: Set<number>;
  ruleColor: string;
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
  /** § contract around images: a paragraph ending with § right before this image
   *  (or starting with § right after it) zeroes the adjacent image padding, same
   *  approximation as the cross-style paragraph path in pushMerged. */
  tightBefore?: boolean;
  tightAfter?: boolean;
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
  | { kind: "textDivider"; props: TextDividerProps }
  | { kind: "statsGrid"; props: StatsGridProps; children: ComponentNode[] }
  | { kind: "recordRow"; props: RecordRowProps }
  | { kind: "splitRow"; props: SplitRowProps }
  | { kind: "image"; props: ImageProps }
  | { kind: "spacer"; props: SpacerProps };

export type ComponentKind = ComponentNode["kind"];
