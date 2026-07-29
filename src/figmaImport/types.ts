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

export interface TextNode extends BaseNode {
  type: "text";
  defaultStyle: TextStyle;
  runs: TextRun[];
  align?: "left" | "center" | "right";
}

export interface ImageNode extends BaseNode {
  type: "image";
  altDescription: string;
  aspectRatio?: number;
  href?: string;
}

export interface ButtonIcon extends ImageNode {
  side: "left" | "right";
  gapPx: number;
  widthPx: number; // a button icon is a small fixed-size glyph, not a fill-container image like
  heightPx: number; // plain ImageNode (renderImage always renders width:100%) — confirmed against
  // the real button-with-icon-* example (20x20px icon) in content-blocks-template.html.
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

export type DesignNode =
  | FrameNode
  | TextNode
  | ImageNode
  | ButtonNode
  | DividerNode
  | DividerLogoNode
  | HeaderImageNode
  | SpacerNode
  | PromoCopyNode;
