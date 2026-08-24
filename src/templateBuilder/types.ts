export interface ShellConfig {
  title: string;
  fontFamily: string;
  fontMatchSelector?: string;
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

export type BuilderLeafBlock = TextBlock | ImageBlock;

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
  columns: RowColumn[];
}

export type CanvasBlock = SectionBlock | RowBlock;

export const PLACEHOLDER_IMAGE_SRC = "https://storage.5th-elementagency.com/files/";

export function createDefaultShellConfig(): ShellConfig {
  return {
    title: "Title",
    fontFamily: "'Roboto', Arial, Helvetica, sans-serif",
    fontMatchSelector: "Roboto",
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

function evenWidthPercents(count: number): number[] {
  const base = Math.round(100 / count);
  const percents = Array.from({ length: count }, () => base);
  percents[percents.length - 1] = 100 - base * (count - 1);
  return percents;
}

export function createDefaultRowBlock(id: string, columnIds: string[], columnCount: 2 | 3): RowBlock {
  const widths = evenWidthPercents(columnCount);
  return {
    id,
    type: "row",
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
