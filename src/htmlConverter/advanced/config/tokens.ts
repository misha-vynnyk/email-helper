// Single source of truth for all visual values.
// Import config so fontFamily and brand colors are never duplicated.
// Profile overrides (TTT, Alfa, …) live in advanced/profiles/*.ts and extend this object.
import { config } from "../../utils/config";

export const tokens = {
  color: {
    rootBackground: "#ffffff",
    warning:        "#cc0000",
    // Colour-classification thresholds (used only by ir/color.ts — not rendered directly)
    blackSnap:  48,
    whiteSnap:  48,
    neutralTol: 24,
    bgRedundant: 12,
    darkLuma:   0.5,
    // Brand colours — pulled from the shared config so Simple and Advanced always match
    link:   config.colors.link,    // "#0000EE"
    button: config.colors.button,  // "#28b628"
    white:  config.colors.white,
    black:  config.colors.black,
    placeholderHref: "urlhere",
  },
  font: {
    // Pulled from shared config — one place to update for all converters and profiles
    stack:      config.fontFamily,  // "'Roboto', Arial, Helvetica, sans-serif"
    lineHeight: 1.5,
    bodyPx:     18,   // matches Simple converter default paragraph size
    headlinePx: 22,   // matches Simple converter h1 / centerHeadline size
    smallPx:    12,   // matches Simple converter h6 / smallText size
    smallMaxPt: 9,    // GDocs pt ≤ this → "small" role, otherwise "body"
  },
  layout: {
    containerMaxWidth: 600,
    sidePadding:       20,
    blockPadY:         14,   // top + bottom padding per block row (matches Simple)
    spacerPx:          16,   // height of the spacer <td> between sections
    gridMinWidth:      100,
    calloutAccentPx:   10,
    gridBorder: "1px solid #E4E4E4",
  },
  button: { radius: 10, height: 51, padding: "3px 5px", innerPadding: "9px 15px", target: "_blank" },
  accentBullet: "&#9656; ",
  // CSS class names shared with the Simple converter stylesheet — do NOT rename
  classes: {
    primaryTable:  "primary-table-limit content-table",
    verticalSpace: "content-vertical-space",
    innerTable:    "content-inner-table",
    spacer:        "md-horizontal-space",
    btnWrap:       "btn-edit-p",
    imgBg:         "img-bg-block",
    inlineCell:    "inline-block-element",
  },
} as const;

export type Tokens = typeof tokens;

// Partial override accepted by convertAdvanced — each nested object is also partial.
export type TokensOverride = {
  color?:  Partial<Tokens["color"]>;
  font?:   Partial<Tokens["font"]>;
  layout?: Partial<Tokens["layout"]>;
  button?: Partial<Tokens["button"]>;
  classes?: Partial<Tokens["classes"]>;
  accentBullet?: string;
};

export function mergeTokens(base: Tokens, override: TokensOverride): Tokens {
  return {
    color:        { ...base.color,   ...override.color },
    font:         { ...base.font,    ...override.font },
    layout:       { ...base.layout,  ...override.layout },
    button:       { ...base.button,  ...override.button },
    classes:      { ...base.classes, ...override.classes },
    accentBullet: override.accentBullet ?? base.accentBullet,
  } as Tokens;
}
