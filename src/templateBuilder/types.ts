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

/**
 * Кожен вузол дерева канви (лист чи контейнер) — плаский запис у нормалізованій мапі
 * `BuilderState.nodes`, що знає свого батька за id. Дерево існує лише логічно, через
 * `parentId`/`childIds`-покажчики — жодних вкладених об'єктів. `parentId: null` означає
 * "вузол лежить прямо в корені" (`BuilderState.rootIds`).
 */
export interface BaseNode {
  id: string;
  parentId: string | null;
  /** Subset of responsiveUtilityCatalog.ts's UTILITY_CLASS_CATALOG className values, applied to
   * this node's own primary rendered element. Only classes actually referenced anywhere in the
   * tree get emitted in the exported document's <style> — see render/collectResponsiveUsage.ts. */
  responsiveClassNames?: string[];
}

export interface TextBlock extends BaseNode {
  type: "text";
  contentHtml: string;
  fontFamily?: string;
  fontSizePx: number;
  fontWeight: number;
  color: string;
  align: TextAlign;
  href?: string;
}

export interface ImageBlock extends BaseNode {
  type: "image";
  src: string;
  alt: string;
  widthPx: number;
  href?: string;
}

/** "auto" shrinks to label content, "full" fills the container (width:100%), a number is a fixed px width. */
export type ButtonWidth = "auto" | "full" | number;

export interface ButtonBlock extends BaseNode {
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

export interface DividerBlock extends BaseNode {
  type: "divider";
  color: string;
  thicknessPx: number;
  widthPercent: number;
}

export interface SpacerBlock extends BaseNode {
  type: "spacer";
  heightPx: number;
}

export type BuilderLeafBlock = TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock;

/**
 * A fixed, battle-tested HTML snippet (see readyMadeCatalog.ts) that only exposes a handful of
 * named slots for editing — the opposite of a fully-modeled leaf like Text/Image/Button, which
 * has many typed, independently-editable fields. Not part of `BuilderLeafBlock` (which is
 * specifically the fully-modeled types); behaves like a leaf in the tree (no `childIds`,
 * `isContainerNode` returns false for it) but is its own kind everywhere else.
 */
export interface ReadyMadeBlock extends BaseNode {
  type: "ready-made";
  /** Which readyMadeCatalog.ts ReadyMadeDefinition this instance renders. */
  definitionId: string;
  /** slot key -> current value, seeded from the definition's slots on insert. */
  values: Record<string, string>;
}

/** Одна секція — контейнер-вузол, може лежати в корені або бути вкладеним у будь-який інший контейнер. */
export interface SectionBlock extends BaseNode {
  type: "section";
  padding: ContainerPadding;
  /** undefined = вкладений інстанс: не рендерить max-width-кеп, тягнеться на 100% наявного місця в предку. */
  widthPx?: number;
  gapPx: number;
  fill?: string;
  border?: ContainerBorder;
  cornerRadius?: number;
  shadow?: ContainerShadow;
  childIds: string[];
}

/** Одна колонка ряду — повноцінний вузол дерева (не вбудований масив), щоб мати ту саму
 * уніфіковану адресацію "контейнер за id", що й Section/Row. Завжди вкладена (parentId — це Row). */
export interface RowColumnBlock extends BaseNode {
  type: "row-column";
  widthPercent: number;
  childIds: string[];
}

/** Явний ряд на N колонок (Variant 1 — користувач сам додає з палітри, не авто-визначення). */
export interface RowBlock extends BaseNode {
  type: "row";
  padding: ContainerPadding;
  widthPx?: number;
  /** id-и RowColumnBlock-вузлів, у порядку показу. */
  childIds: string[];
}

export const MIN_ROW_COLUMNS = 1;
export const MAX_ROW_COLUMNS = 4;

export type ContainerNode = SectionBlock | RowBlock | RowColumnBlock;
/** Every node kind with no `childIds` — patchable as flat fields via `updateNodeFields`. */
export type NonContainerNode = BuilderLeafBlock | ReadyMadeBlock;
export type BuilderNode = NonContainerNode | ContainerNode;

export function isContainerNode(node: BuilderNode): node is ContainerNode {
  return node.type === "section" || node.type === "row" || node.type === "row-column";
}

// Deliberately NOT imported from htmlConverter/advanced/config/tokens.ts's
// `tokens.placeholderImageSrc` even though it looks like the same value at a glance: that token
// resolves to `config.storageUrl` (bare "https://storage.5th-elementagency.com/", no path), while
// this one includes the "files/" path segment matching the default storage provider's real
// bucket layout (automation/config.json's `publicBaseUrl` + `publicPathPrefix`). Verified these
// are two intentionally different values, not an accidental duplication — importing the other
// token would silently change every new templateBuilder image's default src.
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

/**
 * `parentId === null` (топ-рівневий спавн з палітри на canvas-root) отримує реальні
 * placeholder-паддінг/ширину; будь-який інший `parentId` (вкладений спавн) дефолтить на
 * `padding: 0`/`widthPx: undefined` — предок уже обмежує layout, другий реальний
 * padding/width лише задвоївся б.
 */
export function createDefaultSectionBlock(id: string, parentId: string | null): SectionBlock {
  const nested = parentId !== null;
  return {
    id,
    parentId,
    type: "section",
    padding: nested ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 32, right: 20, bottom: 24, left: 20 },
    widthPx: nested ? undefined : 552,
    gapPx: 14,
    childIds: [],
  };
}

export function evenWidthPercents(count: number): number[] {
  const base = Math.round(100 / count);
  const percents = Array.from({ length: count }, () => base);
  percents[percents.length - 1] = 100 - base * (count - 1);
  return percents;
}

export function createDefaultRowBlock(id: string, parentId: string | null): RowBlock {
  const nested = parentId !== null;
  return {
    id,
    parentId,
    type: "row",
    padding: nested ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 32, right: 20, bottom: 24, left: 20 },
    widthPx: nested ? undefined : 552,
    childIds: [],
  };
}

export function createDefaultRowColumnBlock(id: string, parentId: string, widthPercent: number): RowColumnBlock {
  return {
    id,
    parentId,
    type: "row-column",
    widthPercent,
    childIds: [],
  };
}

export function createDefaultTextBlock(id: string, parentId: string | null): TextBlock {
  return {
    id,
    parentId,
    type: "text",
    contentHtml: "New text block",
    fontSizePx: 18,
    fontWeight: 400,
    color: "#000000",
    align: "left",
  };
}

export function createDefaultImageBlock(id: string, parentId: string | null): ImageBlock {
  return {
    id,
    parentId,
    type: "image",
    src: PLACEHOLDER_IMAGE_SRC,
    alt: "Image",
    widthPx: 552,
  };
}

export function createDefaultButtonBlock(id: string, parentId: string | null): ButtonBlock {
  return {
    id,
    parentId,
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

export function createDefaultDividerBlock(id: string, parentId: string | null): DividerBlock {
  return {
    id,
    parentId,
    type: "divider",
    color: "#e2e2e2",
    thicknessPx: 1,
    widthPercent: 100,
  };
}

export function createDefaultSpacerBlock(id: string, parentId: string | null): SpacerBlock {
  return {
    id,
    parentId,
    type: "spacer",
    heightPx: 24,
  };
}
