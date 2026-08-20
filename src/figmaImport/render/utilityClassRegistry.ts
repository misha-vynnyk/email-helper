/**
 * Structured mirror of the three commented-out `@media` utility-class tiers in
 * `figma-to-html/master-shell-reference.html` / `masterShell.ts`'s `BEFORE_CONTENT` — same
 * breakpoints, same class names, same values. Deliberately a SEPARATE, literal transcription
 * rather than a refactor of `masterShell.ts` to generate that giant commented string from this
 * data: `masterShell.ts`'s existing `assembleDocument()` path is already shipping and covered by
 * `masterShell.test.ts`'s snapshot, and de-duplicating the two representations is a real (but
 * lower-risk, revisitable) refactor left for later — see figma-import-status.md.
 *
 * This registry is what `mergeDesignTrees.ts` resolves a desktop/mobile leaf-value diff against:
 * an exact match reuses the existing class name; no match mints a new one following the same
 * naming convention (see `matchOrMintClass`) so a template's real values are never silently
 * dropped just because they don't land on a pre-existing scale tick.
 */

export type Tier = "base" | "sm" | "xs";

export interface TierConfig {
  maxWidthPx: number;
  prefix: string; // class name prefix; "base" tier has none
}

export const TIERS: Record<Tier, TierConfig> = {
  base: { maxWidthPx: 602, prefix: "" },
  sm: { maxWidthPx: 464, prefix: "sm-" },
  xs: { maxWidthPx: 380, prefix: "xs-" },
};

export type PaddingSide = "pt" | "pb" | "pl" | "pr" | "px" | "py";

// One entry per side per tier — value 0 is always included (every tier defines a `-0` class for
// each side in the reference file) even though it renders a no-op declaration, so a diff that
// resolves to "the mobile value is 0" still gets a real class instead of silently falling through
// to "unsupported".
const PADDING_SCALES: Record<Tier, Record<PaddingSide, number[]>> = {
  base: {
    pt: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48],
    pb: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    pl: [0, 8, 16, 24],
    pr: [0, 8, 16, 24],
    px: [0, 8, 12, 16, 20, 24],
    py: [0, 8, 16, 24, 32, 40],
  },
  sm: {
    pt: [0, 4, 8, 12, 16, 20, 24, 32],
    pb: [0, 4, 8, 12, 16, 20, 24, 32, 40],
    pl: [0, 8, 16],
    pr: [0, 8, 16],
    px: [0, 8, 16, 20],
    py: [0, 8, 16, 24, 32],
  },
  xs: {
    pt: [0, 4, 8, 12, 16, 24],
    pb: [0, 4, 8, 12, 16, 24, 32],
    pl: [0, 8],
    pr: [0, 8],
    px: [0, 8, 12],
    py: [0, 8, 16, 24],
  },
};

const PADDING_CSS_PROPERTY: Record<PaddingSide, string> = {
  pt: "padding-top",
  pb: "padding-bottom",
  pl: "padding-left",
  pr: "padding-right",
  px: "padding-left/padding-right",
  py: "padding-top/padding-bottom",
};

// Fluid width categories — a numeric px `FrameNode.width` has no scale here (see the module doc
// on mergeDesignTrees.ts): only "fill"/"hug" widths, which already map onto one of these named
// fractions/keywords in the source layout, are diffable this way.
export type WidthKeyword = "full" | "half" | "third" | "twoThirds" | "auto";

const WIDTH_CLASS_SUFFIX: Record<WidthKeyword, string> = {
  full: "w-full",
  half: "w-half",
  third: "w-third",
  twoThirds: "w-two-thirds",
  auto: "w-auto",
};

// Which width keywords each tier actually defines (base has all five; sm/xs drop third/two-thirds
// — confirmed against the reference file, not an oversight).
const WIDTH_AVAILABLE: Record<Tier, WidthKeyword[]> = {
  base: ["full", "half", "third", "twoThirds", "auto"],
  sm: ["full", "half", "auto"],
  xs: ["full", "auto"],
};

// Named font-size scale — the xs tier is a DISTINCT scale (11/13/15/17/20/22), not just the base
// scale reused under an `xs-` prefix, and only carries 6 of the base tier's 8 steps.
const TEXT_SIZE_SCALE: Record<Tier, Array<{ name: string; px: number }>> = {
  base: [
    { name: "xs", px: 12 },
    { name: "sm", px: 14 },
    { name: "base", px: 16 },
    { name: "lg", px: 18 },
    { name: "xl", px: 20 },
    { name: "2xl", px: 24 },
    { name: "3xl", px: 28 },
    { name: "4xl", px: 32 },
  ],
  sm: [
    { name: "xs", px: 12 },
    { name: "sm", px: 14 },
    { name: "base", px: 16 },
    { name: "lg", px: 18 },
    { name: "xl", px: 20 },
    { name: "2xl", px: 24 },
    { name: "3xl", px: 28 },
  ],
  xs: [
    { name: "xs", px: 11 },
    { name: "sm", px: 13 },
    { name: "base", px: 15 },
    { name: "lg", px: 17 },
    { name: "xl", px: 20 },
    { name: "2xl", px: 22 },
  ],
};

const LINE_HEIGHT_SCALE: Record<Tier, Array<{ name: string; value: number }>> = {
  base: [
    { name: "tight", value: 1.2 },
    { name: "snug", value: 1.35 },
    { name: "normal", value: 1.5 },
    { name: "relaxed", value: 1.75 },
  ],
  sm: [
    { name: "tight", value: 1.2 },
    { name: "normal", value: 1.5 },
  ],
  xs: [
    { name: "tight", value: 1.2 },
    { name: "normal", value: 1.5 },
  ],
};

export type TextAlignValue = "left" | "center" | "right";

// Which alignments each tier defines for `text-*`/`align-*` (vertical) — base has all of both;
// sm drops vertical `bottom`; xs drops vertical `middle`/`bottom` entirely (top only).
const TEXT_ALIGN_AVAILABLE: Record<Tier, TextAlignValue[]> = {
  base: ["left", "center", "right"],
  sm: ["left", "center", "right"],
  xs: ["left", "center"],
};

export type VerticalAlignValue = "top" | "middle" | "bottom";

const VERTICAL_ALIGN_AVAILABLE: Record<Tier, VerticalAlignValue[]> = {
  base: ["top", "middle", "bottom"],
  sm: ["top", "middle"],
  xs: ["top"],
};

export type DisplayValue = "block" | "hidden" | "inline-block" | "table" | "table-cell";

// base defines all five; sm/xs only the first three (no table/table-cell variants at those tiers
// in the reference file).
const DISPLAY_AVAILABLE: Record<Tier, DisplayValue[]> = {
  base: ["block", "hidden", "inline-block", "table", "table-cell"],
  sm: ["block", "hidden", "inline-block"],
  xs: ["block", "hidden", "inline-block"],
};

const DISPLAY_CSS: Record<DisplayValue, string> = {
  block: "block",
  hidden: "none",
  "inline-block": "inline-block",
  table: "table",
  "table-cell": "table-cell",
};

export type MiscFlag = "noRadius" | "noShadow" | "noBorder" | "imgFull" | "bgTransparent" | "floatNone" | "heightAuto";

const MISC_CLASS_SUFFIX: Record<MiscFlag, string> = {
  noRadius: "no-radius",
  noShadow: "no-shadow",
  noBorder: "no-border",
  imgFull: "img-full",
  bgTransparent: "bg-transparent",
  floatNone: "float-none",
  heightAuto: "h-auto",
};

const MISC_CSS: Record<MiscFlag, string> = {
  noRadius: "border-radius: 0",
  noShadow: "box-shadow: none",
  noBorder: "border: none",
  imgFull: "width: 100%; height: auto; max-width: 100%",
  bgTransparent: "background-color: transparent",
  floatNone: "float: none",
  heightAuto: "height: auto",
};

// `no-radius`/`footer-button`/`footer-button-pad`/`spacer-hide` are already unconditionally
// included at the base tier in masterShell.ts's BEFORE_CONTENT (see the "always-on" comment
// there) — `noRadius` at sm/xs is the only tier where it's still commented-out-by-default and
// needs to go through matchOrMintClass like everything else.
const MISC_AVAILABLE: Record<Tier, MiscFlag[]> = {
  base: ["noShadow", "noBorder", "imgFull", "bgTransparent", "floatNone", "heightAuto"],
  sm: ["noRadius", "noShadow", "imgFull", "bgTransparent", "floatNone", "heightAuto"],
  xs: ["noRadius", "imgFull", "bgTransparent", "heightAuto"],
};

export interface ResolvedClass {
  className: string;
  cssRule: string; // full `.class { decl !important; }` rule, ready to append verbatim
  isNew: boolean; // true when minted (not one of the reference file's own pre-defined classes)
}

function cls(tier: Tier, suffix: string): string {
  return `${TIERS[tier].prefix}${suffix}`;
}

function rule(className: string, declarations: string): string {
  return `.${className} { ${declarations} !important; }`;
}

export function resolvePadding(tier: Tier, side: PaddingSide, valuePx: number): ResolvedClass {
  const scale = PADDING_SCALES[tier][side];
  const suffix = `${side}-${valuePx}`;
  const className = cls(tier, suffix);
  const declarations =
    side === "px"
      ? `padding-left: ${valuePx}px; padding-right: ${valuePx}px`
      : side === "py"
        ? `padding-top: ${valuePx}px; padding-bottom: ${valuePx}px`
        : `${PADDING_CSS_PROPERTY[side]}: ${valuePx}px`;
  return { className, cssRule: rule(className, declarations), isNew: !scale.includes(valuePx) };
}

export function resolveWidth(tier: Tier, keyword: WidthKeyword): ResolvedClass | undefined {
  if (!WIDTH_AVAILABLE[tier].includes(keyword)) return undefined;
  const className = cls(tier, WIDTH_CLASS_SUFFIX[keyword]);
  const declarations: Record<WidthKeyword, string> = {
    full: "width: 100%; max-width: 100%; min-width: 100%",
    half: "width: 50%",
    third: "width: 33.33%",
    twoThirds: "width: 66.66%",
    auto: "width: auto",
  };
  return { className, cssRule: rule(className, declarations[keyword]), isNew: false };
}

// Matches by target px value against the tier's own named scale (e.g. mobile fontSizePx: 14 at
// the `sm` tier hits `sm-text-sm`); no exact match mints `${prefix}text-${px}px` — deliberately
// not reusing the `xs`/`sm`/... naming scheme for minted sizes since those names are only
// meaningful for values already on someone's designed scale.
export function resolveTextSize(tier: Tier, px: number): ResolvedClass {
  const hit = TEXT_SIZE_SCALE[tier].find((entry) => entry.px === px);
  if (hit) {
    const className = cls(tier, `text-${hit.name}`);
    return { className, cssRule: rule(className, `font-size: ${px}px`), isNew: false };
  }
  const className = cls(tier, `text-${px}px`);
  return { className, cssRule: rule(className, `font-size: ${px}px`), isNew: true };
}

export function resolveLineHeight(tier: Tier, value: number): ResolvedClass {
  const hit = LINE_HEIGHT_SCALE[tier].find((entry) => entry.value === value);
  if (hit) {
    const className = cls(tier, `leading-${hit.name}`);
    return { className, cssRule: rule(className, `line-height: ${value}`), isNew: false };
  }
  const className = cls(tier, `leading-${String(value).replace(".", "_")}`);
  return { className, cssRule: rule(className, `line-height: ${value}`), isNew: true };
}

export function resolveTextAlign(tier: Tier, value: TextAlignValue): ResolvedClass | undefined {
  if (!TEXT_ALIGN_AVAILABLE[tier].includes(value)) return undefined;
  const className = cls(tier, `text-${value}`);
  return { className, cssRule: rule(className, `text-align: ${value}`), isNew: false };
}

export function resolveVerticalAlign(tier: Tier, value: VerticalAlignValue): ResolvedClass | undefined {
  if (!VERTICAL_ALIGN_AVAILABLE[tier].includes(value)) return undefined;
  const className = cls(tier, `align-${value}`);
  return { className, cssRule: rule(className, `vertical-align: ${value}`), isNew: false };
}

export function resolveDisplay(tier: Tier, value: DisplayValue): ResolvedClass {
  const suffix = value === "hidden" ? "hidden" : value;
  const className = cls(tier, suffix);
  const isNew = !DISPLAY_AVAILABLE[tier].includes(value);
  return { className, cssRule: rule(className, `display: ${DISPLAY_CSS[value]}`), isNew };
}

export function resolveMisc(tier: Tier, flag: MiscFlag): ResolvedClass {
  const className = cls(tier, MISC_CLASS_SUFFIX[flag]);
  const isNew = !MISC_AVAILABLE[tier].includes(flag);
  return { className, cssRule: rule(className, MISC_CSS[flag]), isNew };
}
