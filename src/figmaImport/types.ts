/**
 * DesignNode schema types — see figma-to-html/FIGMA_TEMPLATE_IMPORT_PLAN.md.
 */

export type Visibility = "both" | "desktopOnly" | "mobileOnly";

export interface BaseNode {
  id: string;
  name?: string;
  visibility?: Visibility;
}

export type CornerRadius =
  | number
  | { topLeft?: number; topRight?: number; bottomRight?: number; bottomLeft?: number };

export type Fill =
  | { kind: "solid"; color: string }
  | { kind: "linearGradient"; angleDeg: number; stops: Array<{ color: string; position: number }> }
  | { kind: "radialGradient"; stops: Array<{ color: string; position: number }> };

export interface BorderSide {
  widthPx: number;
  color: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface FrameBorder {
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
}

export interface FramePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FrameShadow {
  xPx: number;
  yPx: number;
  blurPx: number;
  color: string;
}

export interface FrameNode extends BaseNode {
  type: "frame";
  direction: "row" | "column";
  children: DesignNode[];
  fill?: Fill;
  border?: FrameBorder;
  cornerRadius?: CornerRadius;
  padding: FramePadding;
  gap?: number;
  width?: number | "fill" | "hug";
  justify?: "start" | "center" | "end" | "spaceBetween";
  crossAlign?: "start" | "center" | "end";
  shadow?: FrameShadow;
}

export type TextTransform = "uppercase" | "lowercase" | "capitalize" | "none";

export interface TextStyle {
  fontSizePx?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  italic?: boolean;
  underline?: boolean;
  textTransform?: TextTransform;
  href?: string;
}

export type TextRun = Partial<TextStyle> & { text: string };

// Self-wrapping (see renderNode.ts's SELF_WRAPPING_TYPES): each of top/bottom is this node's
// own vertical rhythm — no "gap on non-last child" scheme, deliberate doubling between two
// adjacent self-wrapping siblings is accepted (2026-08-13 rewrite, see FIGMA_TEMPLATE_IMPORT_PLAN.md).
export interface VerticalPadding {
  top: number;
  bottom: number;
}

export interface TextNode extends BaseNode {
  type: "text";
  defaultStyle: TextStyle;
  runs: TextRun[];
  align?: "left" | "center" | "right";
  padding: VerticalPadding;
}

export interface ImageNode extends BaseNode {
  type: "image";
  altDescription: string;
  widthPx: number; // max-width cap in both widthMode branches
  widthMode?: "fluid" | "fixed"; // default "fluid" — shrinks to fit, capped at widthPx (needs an
  // ancestor container with its own numeric width to actually constrain it, else Android Gmail
  // stretches it full-screen). "fixed" never stretches past widthPx — for small icons.
  align?: "left" | "center" | "right"; // default "center"
  padding: VerticalPadding;
  aspectRatio?: number;
  href?: string;
}

// NOT an ImageNode — deliberately standalone (2026-08-13): a button icon is a small fixed-size
// glyph rendered inline inside the button's own markup (renderButton.ts's iconImg/iconSpan),
// never through renderImage.ts, so it has no business carrying ImageNode's row-level `padding`/
// `align`/`widthMode` fields — confirmed against the real button-with-icon-* example
// (20x20px icon) in content-blocks-template.html.
export interface ButtonIcon {
  altDescription: string;
  side: "left" | "right";
  gapPx: number;
  widthPx: number;
  heightPx: number;
}

export interface ButtonNode extends BaseNode {
  type: "button";
  label: string;
  href: string;
  background?: string;
  textColor?: string;
  border?: BorderSide;
  cornerRadius?: CornerRadius;
  widthPx: number; // own max-width cap (grow-to-fill via width:100% up to this cap) — confirmed
  // against real markup (content-blocks-template.html): a button needs its own width
  // independent of its wrapping frame, which is often fluid/100%.
  targetHeightPx: number; // fallback `height` attribute; the real visual mechanism is
  // lineHeight + explicit padding below, not a computed pair — confirmed against real markup.
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number;
  lineHeight: number; // unitless multiplier (real markup uses `line-height: 1`), not a px value
  paddingTopPx: number;
  paddingBottomPx: number;
  paddingLeftPx: number;
  paddingRightPx: number;
  textTransform?: TextTransform;
  icon?: ButtonIcon;
}

export interface DividerNode extends BaseNode {
  type: "divider";
  color: string;
  thicknessPx?: number;
}

// dedicated type, not a frame+image composition — resolved 2026-07-28 against the user's own
// filled-in "divider-logo" block (a whole snippet: two line cells + a centered icon, own width).
export interface DividerLogoNode extends BaseNode {
  type: "dividerLogo";
  widthPx: number;
  lineColor: string;
  lineThicknessPx?: number;
  iconAltDescription: string;
  iconWidthPx: number;
  iconGapPx: number; // padding on both sides of the icon cell
}

// dedicated type, not a plain ImageNode — resolved 2026-07-28: a header image caps at its own
// measured widthPx (numeric `width` attribute + max-width) and always opens in a new tab, unlike
// a generic in-frame ImageNode (renderImage.ts), which always fills its container at width:100%.
// Covers both the single-image and desktop/mobile-swap header variants identically — swap is
// purely two HeaderImageNode instances sharing an id, one per file via `visibility` (see
// "Button/Divider/Header — цілі сніпети" in FIGMA_TEMPLATE_IMPORT_PLAN.md).
export interface HeaderImageNode extends BaseNode {
  type: "headerImage";
  widthPx: number;
  altDescription: string;
  href?: string;
}

export interface SpacerNode extends BaseNode {
  type: "spacer";
  heightPx: number;
}

export interface PromoCopyNode extends BaseNode {
  type: "promoCopy";
}

// Side-by-side percentage columns meant to gracefully STACK below ~600px (the classic
// font-size:0/display:inline-block/min-width email technique) — added 2026-08-13. Not the same
// thing as FrameNode{direction:"row"}: that's for a fixed row of cells that must never collapse
// (nav bar, a spaceBetween-pushed CTA); pick RowNode whenever the layout should stack on narrow
// viewports. `minWidthPx` per column is not authored — renderRow.ts derives it from
// MASTER_CONTENT_WIDTH_PX * widthPercent, per the user's explicit "рендерер обчислює сам".
export interface RowColumn {
  widthPercent: number;
  children: DesignNode[];
}

export interface RowNode extends BaseNode {
  type: "row";
  columns: RowColumn[];
}

// A shared row of multiple side-by-side buttons (e.g. a footer's link-button row) — distinct
// from RowNode: uses the footer-button/footer-button-pad display:inline-block technique with no
// min-width/font-size:0 column-stacking, matching the user's real button-row markup. Every
// ButtonNode here renders through the no-icon path only (renderButtonCell) — an `icon` on any
// of these is silently ignored, since real footer button-rows never mix icons in (2026-08-13).
export interface ButtonRowNode extends BaseNode {
  type: "buttonRow";
  buttons: ButtonNode[];
}

// A recognized card-list "kind" carries a FIXED, hand-verified HTML skeleton per `variant` —
// only literal per-card values (padding/font/color, via a plain TextNode for each text slot)
// and text content vary, never the structure itself. Modeled after
// `src/htmlConverter/advanced/`'s classify→fixed-template mechanism (statsGrid etc., see
// FIGMA_TEMPLATE_IMPORT_PLAN.md): once a content shape is recognized, it always renders through
// the SAME template, never re-derived from scratch. Added 2026-08-14 after a real "messy vs
// clean" comparison showed repeated generic frame+text composition of the same visual pattern
// (a Sponsored-Content link list) drifting in small structural ways (stray padding, missing
// width cap) card to card — this removes that authoring freedom for recognized patterns.
// `variant` is a closed union with exactly one member today ("sponsoredLink") — extend it only
// once a NEW card pattern is confirmed against a real Figma example, never speculatively.
export interface SponsoredLinkCard {
  id: string;
  name?: string;
  padding: FramePadding;
  title: TextNode;
  secondary: TextNode;
}

export interface CardListNode extends BaseNode {
  type: "cardList";
  variant: "sponsoredLink";
  gap?: number; // vertical spacing between cards, folded into each non-last card's own bottom
  // padding — same extraBottomGapPx technique every other self-wrapping type already uses.
  cards: SponsoredLinkCard[];
}

export type DesignNode =
  | FrameNode
  | TextNode
  | ImageNode
  | ButtonNode
  | DividerNode
  | DividerLogoNode
  | HeaderImageNode
  | SpacerNode
  | PromoCopyNode
  | RowNode
  | ButtonRowNode
  | CardListNode;
