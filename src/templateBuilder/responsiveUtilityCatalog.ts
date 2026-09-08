export type ResponsiveTier = "base" | "sm" | "xs";

/** Fixed breakpoints, matching the production reference stylesheet this catalog was ported
 * from — not user-configurable. Source order (base -> sm -> xs) matters: at a viewport narrow
 * enough to match all three `@media (max-width: ...)` blocks at once, the LAST matching block
 * wins the cascade for any given property, so a narrower tier must always be emitted after a
 * wider one to correctly override it (see renderShell.ts's buildUtilityMediaBlocks). */
export const RESPONSIVE_BREAKPOINT_PX: Record<ResponsiveTier, number> = { base: 602, sm: 464, xs: 380 };
export const RESPONSIVE_TIER_ORDER: ResponsiveTier[] = ["base", "sm", "xs"];

const TIER_PREFIX: Record<ResponsiveTier, string> = { base: "", sm: "sm-", xs: "xs-" };

export interface UtilityClassEntry {
  className: string;
  tier: ResponsiveTier;
  /** Drives the Inspector's grouped checklist (Display/Width/Padding Top/.../Misc). */
  group: string;
  declaration: string;
  /** Every CSS property this class's declaration touches — source of truth for
   * `useResponsiveConflict`, NOT parsed back out of `declaration` (that would risk drifting from
   * the actual rule text, the same class of transcription slip `spacingScale` below already
   * guards against for values). An entry touching more than one property (e.g. `px-*`/`py-*`
   * touch two sides, `w-full` touches width/max-width/min-width) lists all of them. */
  properties: string[];
}

function cls(tier: ResponsiveTier, group: string, suffix: string, declaration: string, properties: string[]): UtilityClassEntry {
  return { className: `${TIER_PREFIX[tier]}${suffix}`, tier, group, declaration, properties };
}

/** One entry per `px` step, single CSS property (or several, e.g. px/py touch two sides) —
 * covers the padding scales, which are almost all of this catalog's bulk and otherwise the
 * easiest place for a hand-typed transcription slip (e.g. pt-24 accidentally getting pb-24's
 * value). `properties` is `cssProps` passed straight through, not re-typed by hand at each call
 * site — the same values already drive the declaration text, so there's nothing to transcribe. */
function spacingScale(tier: ResponsiveTier, group: string, prefix: string, cssProps: string[], steps: number[]): UtilityClassEntry[] {
  return steps.map((px) => cls(tier, group, `${prefix}-${px}`, cssProps.map((p) => `${p}: ${px}px !important;`).join(" "), cssProps));
}

const PADDING_TOP: Record<ResponsiveTier, number[]> = {
  base: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48],
  sm: [0, 4, 8, 12, 16, 20, 24, 32],
  xs: [0, 4, 8, 12, 16, 24],
};
const PADDING_BOTTOM: Record<ResponsiveTier, number[]> = {
  base: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  sm: [0, 4, 8, 12, 16, 20, 24, 32, 40],
  xs: [0, 4, 8, 12, 16, 24, 32],
};
const PADDING_LEFT: Record<ResponsiveTier, number[]> = { base: [0, 8, 16, 24], sm: [0, 8, 16], xs: [0, 8] };
const PADDING_RIGHT: Record<ResponsiveTier, number[]> = { base: [0, 8, 16, 24], sm: [0, 8, 16], xs: [0, 8] };
const PADDING_X: Record<ResponsiveTier, number[]> = { base: [0, 8, 12, 16, 20, 24], sm: [0, 8, 16, 20], xs: [0, 8, 12] };
const PADDING_Y: Record<ResponsiveTier, number[]> = { base: [8, 16, 24, 32, 40], sm: [8, 16, 24, 32], xs: [8, 16, 24] };

const FONT_SIZE: Record<ResponsiveTier, Array<[string, number]>> = {
  base: [
    ["xs", 12],
    ["sm", 14],
    ["base", 16],
    ["lg", 18],
    ["xl", 20],
    ["2xl", 24],
    ["3xl", 28],
    ["4xl", 32],
  ],
  sm: [
    ["xs", 12],
    ["sm", 14],
    ["base", 16],
    ["lg", 18],
    ["xl", 20],
    ["2xl", 24],
    ["3xl", 28],
  ],
  xs: [
    ["xs", 11],
    ["sm", 13],
    ["base", 15],
    ["lg", 17],
    ["xl", 20],
    ["2xl", 22],
  ],
};

const LINE_HEIGHT: Record<ResponsiveTier, Array<[string, number]>> = {
  base: [
    ["tight", 1.2],
    ["snug", 1.35],
    ["normal", 1.5],
    ["relaxed", 1.75],
  ],
  sm: [
    ["tight", 1.2],
    ["normal", 1.5],
  ],
  xs: [
    ["tight", 1.2],
    ["normal", 1.5],
  ],
};

const TEXT_ALIGN: Record<ResponsiveTier, string[]> = { base: ["left", "center", "right"], sm: ["left", "center", "right"], xs: ["left", "center"] };
const VERTICAL_ALIGN: Record<ResponsiveTier, string[]> = { base: ["top", "middle", "bottom"], sm: ["top", "middle"], xs: ["top"] };
const DISPLAY: Record<ResponsiveTier, string[]> = { base: ["block", "hidden", "inline-block", "table", "table-cell"], sm: ["block", "hidden", "inline-block"], xs: ["block", "hidden", "inline-block"] };

const DISPLAY_DECLARATION: Record<string, string> = {
  block: "display: block !important;",
  hidden: "display: none !important;",
  "inline-block": "display: inline-block !important;",
  table: "display: table !important;",
  "table-cell": "display: table-cell !important;",
};

function buildPaddingGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return [
    ...spacingScale(tier, "Padding Top", "pt", ["padding-top"], PADDING_TOP[tier]),
    ...spacingScale(tier, "Padding Bottom", "pb", ["padding-bottom"], PADDING_BOTTOM[tier]),
    ...spacingScale(tier, "Padding Left", "pl", ["padding-left"], PADDING_LEFT[tier]),
    ...spacingScale(tier, "Padding Right", "pr", ["padding-right"], PADDING_RIGHT[tier]),
    ...spacingScale(tier, "Padding X", "px", ["padding-left", "padding-right"], PADDING_X[tier]),
    ...spacingScale(tier, "Padding Y", "py", ["padding-top", "padding-bottom"], PADDING_Y[tier]),
  ];
}

function buildDisplayGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return DISPLAY[tier].map((name) => cls(tier, "Display", name, DISPLAY_DECLARATION[name], ["display"]));
}

function buildWidthGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  if (tier === "base") {
    return [
      cls(tier, "Width", "w-full", "width: 100% !important; max-width: 100% !important; min-width: 100% !important;", ["width", "max-width", "min-width"]),
      cls(tier, "Width", "w-half", "width: 50% !important;", ["width"]),
      cls(tier, "Width", "w-third", "width: 33.33% !important;", ["width"]),
      cls(tier, "Width", "w-two-thirds", "width: 66.66% !important;", ["width"]),
      cls(tier, "Width", "w-auto", "width: auto !important;", ["width"]),
      cls(tier, "Width", "max-w-full", "max-width: 100% !important;", ["max-width"]),
      cls(tier, "Width", "min-w-full", "min-width: 100% !important;", ["min-width"]),
    ];
  }
  const entries = [
    cls(tier, "Width", "w-full", "width: 100% !important; max-width: 100% !important; min-width: 100% !important;", ["width", "max-width", "min-width"]),
    cls(tier, "Width", "w-auto", "width: auto !important;", ["width"]),
    cls(tier, "Width", "max-w-full", "max-width: 100% !important;", ["max-width"]),
  ];
  if (tier === "sm") entries.splice(1, 0, cls(tier, "Width", "w-half", "width: 50% !important;", ["width"]));
  return entries;
}

function buildFontSizeGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return FONT_SIZE[tier].map(([name, px]) => cls(tier, "Font Size", `text-${name}`, `font-size: ${px}px !important;`, ["font-size"]));
}

function buildLineHeightGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return LINE_HEIGHT[tier].map(([name, value]) => cls(tier, "Line Height", `leading-${name}`, `line-height: ${value} !important;`, ["line-height"]));
}

function buildTextAlignGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return TEXT_ALIGN[tier].map((name) => cls(tier, "Text Align", `text-${name}`, `text-align: ${name} !important;`, ["text-align"]));
}

function buildVerticalAlignGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return VERTICAL_ALIGN[tier].map((name) => cls(tier, "Vertical Align", `align-${name}`, `vertical-align: ${name} !important;`, ["vertical-align"]));
}

/** `footer-button`/`spacer-hide`/`no-radius` used to sit in renderShell.ts's old always-on
 * `UTILITY_MEDIA_BLOCKS` constant, but no renderer ever actually emitted those classes — dead
 * CSS shipped in every export. They move here as ordinary opt-in `base`-tier entries: same
 * declarations, now reachable by picking them per block instead of silently unreachable. */
function buildMiscGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  if (tier === "base") {
    return [
      cls(tier, "Misc", "footer-button", "display: block !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important;", ["display", "width", "max-width", "min-width"]),
      cls(tier, "Misc", "spacer-hide", "display: none !important;", ["display"]),
      cls(tier, "Misc", "no-radius", "border-radius: 0 !important;", ["border-radius"]),
      cls(tier, "Misc", "no-shadow", "box-shadow: none !important;", ["box-shadow"]),
      cls(tier, "Misc", "no-border", "border: none !important;", ["border"]),
      cls(tier, "Misc", "img-full", "width: 100% !important; height: auto !important; max-width: 100% !important;", ["width", "height", "max-width"]),
      cls(tier, "Misc", "bg-transparent", "background-color: transparent !important;", ["background-color"]),
      cls(tier, "Misc", "float-none", "float: none !important;", ["float"]),
    ];
  }
  return [
    cls(tier, "Misc", "no-radius", "border-radius: 0 !important;", ["border-radius"]),
    ...(tier === "sm" ? [cls(tier, "Misc", "no-shadow", "box-shadow: none !important;", ["box-shadow"])] : []),
    cls(tier, "Misc", "img-full", "width: 100% !important; height: auto !important;", ["width", "height"]),
    cls(tier, "Misc", "bg-transparent", "background-color: transparent !important;", ["background-color"]),
    ...(tier === "sm" ? [cls(tier, "Misc", "float-none", "float: none !important;", ["float"])] : []),
  ];
}

function buildHeightGroup(tier: ResponsiveTier): UtilityClassEntry[] {
  return [cls(tier, "Height", "h-auto", "height: auto !important;", ["height"])];
}

function buildTier(tier: ResponsiveTier): UtilityClassEntry[] {
  return [
    ...buildDisplayGroup(tier),
    ...buildWidthGroup(tier),
    ...buildHeightGroup(tier),
    ...buildPaddingGroup(tier),
    ...buildFontSizeGroup(tier),
    ...buildLineHeightGroup(tier),
    ...buildTextAlignGroup(tier),
    ...buildVerticalAlignGroup(tier),
    ...buildMiscGroup(tier),
  ];
}

/** Full utility-class catalog, ported from a production reference stylesheet (3 fixed
 * breakpoints, Tailwind-style single-purpose classes) — bundled up front like
 * `googleFontCatalog.ts`, not grown one class at a time. Nothing here is emitted in an exported
 * template's `<style>` unless a block on the canvas actually references it — see
 * `render/collectResponsiveUsage.ts` and `renderShell.ts`'s `buildUtilityMediaBlocks`. */
export const UTILITY_CLASS_CATALOG: UtilityClassEntry[] = RESPONSIVE_TIER_ORDER.flatMap(buildTier);
