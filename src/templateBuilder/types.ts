export interface ShellConfig {
  title: string;
  fontFamily: string;
  fontMatchSelector?: string;
  /** Names picked from the bundled GOOGLE_FONT_CATALOG; drives googleFontsHref via buildGoogleFontsHref. */
  googleFonts: string[];
  googleFontsHref?: string;
  outerBackground: string;
  contentBackground: string;
  contentWidthPx: number;
}

export interface ContainerPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ContainerBorder {
  widthPx: number;
  color: string;
}

export interface ContainerShadow {
  xPx: number;
  yPx: number;
  blurPx: number;
  color: string;
}

export type TextAlign = "left" | "center" | "right";

export interface TextBlock {
  id: string;
  type: "text";
  contentHtml: string;
  fontFamily?: string;
  fontSizePx: number;
  fontWeight: number;
  color: string;
  align: TextAlign;
  href?: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  src: string;
  alt: string;
  widthPx: number;
  href?: string;
}

/** "auto" shrinks to label content, "full" fills the container (width:100%), a number is a fixed px width. */
export type ButtonWidth = "auto" | "full" | number;

export interface ButtonBlock {
  id: string;
  type: "button";
  label: string;
  href: string;
  fontFamily?: string;
  bgColor?: string;
  textColor: string;
  border?: ContainerBorder;
  borderRadiusPx: number;
  align: TextAlign;
  fontSizePx: number;
  fontWeight: number;
  width: ButtonWidth;
}

export interface DividerBlock {
  id: string;
  type: "divider";
  color: string;
  thicknessPx: number;
  widthPercent: number;
}

export interface SpacerBlock {
  id: string;
  type: "spacer";
  heightPx: number;
}

export type BuilderLeafBlock = TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock;

/** Одна секція (раніше — єдиний ContainerBlock) — тепер один-із-багатьох блоків на canvas. */
export interface SectionBlock {
  id: string;
  type: "section";
  padding: ContainerPadding;
  widthPx: number;
  gapPx: number;
  fill?: string;
  border?: ContainerBorder;
  cornerRadius?: number;
  shadow?: ContainerShadow;
  children: BuilderLeafBlock[];
}

/** Одна колонка ряду — власний плаский список дітей, ширина у відсотках. */
export interface RowColumn {
  id: string;
  widthPercent: number;
  children: BuilderLeafBlock[];
}

/** Явний ряд на N колонок (Variant 1 — користувач сам додає з палітри, не авто-визначення). */
export interface RowBlock {
  id: string;
  type: "row";
  padding: ContainerPadding;
  widthPx: number;
  columns: RowColumn[];
}

export const MIN_ROW_COLUMNS = 1;
export const MAX_ROW_COLUMNS = 4;

export type CanvasBlock = SectionBlock | RowBlock;

export const PLACEHOLDER_IMAGE_SRC = "https://storage.5th-elementagency.com/files/";

export function createDefaultShellConfig(): ShellConfig {
  return {
    title: "Title",
    fontFamily: "'Roboto', Arial, Helvetica, sans-serif",
    fontMatchSelector: "Roboto",
    googleFonts: [],
    googleFontsHref: undefined,
    outerBackground: "#e8eef4",
    contentBackground: "#ffffff",
    contentWidthPx: 600,
  };
}

export function createDefaultSectionBlock(id: string): SectionBlock {
  return {
    id,
    type: "section",
    padding: { top: 32, right: 20, bottom: 24, left: 20 },
    widthPx: 552,
    gapPx: 14,
    children: [],
  };
}

export function evenWidthPercents(count: number): number[] {
  const base = Math.round(100 / count);
  const percents = Array.from({ length: count }, () => base);
  percents[percents.length - 1] = 100 - base * (count - 1);
  return percents;
}

/**
 * Row is currently always a top-level canvas block (`canvas: CanvasBlock[]` is flat, nested
 * containers don't exist yet), so it always gets the same real placeholder padding/width as
 * `createDefaultSectionBlock`. If nested rows/sections are ever introduced, a nested instance
 * should default to `padding: 0` and full-width instead — its ancestor container already
 * constrains the layout, so a second real padding/width would double up on it.
 */
export function createDefaultRowBlock(id: string, columnIds: string[], columnCount: 2 | 3): RowBlock {
  const widths = evenWidthPercents(columnCount);
  return {
    id,
    type: "row",
    padding: { top: 32, right: 20, bottom: 24, left: 20 },
    widthPx: 552,
    columns: columnIds.map((columnId, i) => ({ id: columnId, widthPercent: widths[i], children: [] })),
  };
}

export function createDefaultTextBlock(id: string): TextBlock {
  return {
    id,
    type: "text",
    contentHtml: "New text block",
    fontSizePx: 18,
    fontWeight: 400,
    color: "#000000",
    align: "left",
  };
}

export function createDefaultImageBlock(id: string): ImageBlock {
  return {
    id,
    type: "image",
    src: PLACEHOLDER_IMAGE_SRC,
    alt: "Image",
    widthPx: 552,
  };
}

export function createDefaultButtonBlock(id: string): ButtonBlock {
  return {
    id,
    type: "button",
    label: "Button",
    href: "urlhere",
    bgColor: "#333333",
    textColor: "#ffffff",
    borderRadiusPx: 4,
    align: "center",
    fontSizePx: 14,
    fontWeight: 700,
    width: "full",
  };
}

export function createDefaultDividerBlock(id: string): DividerBlock {
  return {
    id,
    type: "divider",
    color: "#e2e2e2",
    thicknessPx: 1,
    widthPercent: 100,
  };
}

export function createDefaultSpacerBlock(id: string): SpacerBlock {
  return {
    id,
    type: "spacer",
    heightPx: 24,
  };
}
