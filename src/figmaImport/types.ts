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
}

export interface ButtonNode extends BaseNode {
  type: "button";
  label: string;
  href: string;
  background?: string;
  textColor?: string;
  border?: BorderSide;
  cornerRadius?: CornerRadius;
  targetHeightPx: number;
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number;
  lineHeightPx: number;
  textTransform?: TextTransform;
  icon?: ButtonIcon;
}

export interface DividerNode extends BaseNode {
  type: "divider";
  color: string;
  thicknessPx?: number;
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
  | SpacerNode
  | PromoCopyNode;
