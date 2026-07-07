// Single source of truth for all visual values.
// Import config so fontFamily and brand colors are never duplicated.
// Profile overrides (TTT, Alfa, …) live in advanced/profiles/*.ts and extend this object.
import { config } from "../../utils/config";

// Explicit interface keeps types wide (number, string) so profile overrides
// don't clash with the literal types produced by `as const`.
export interface Tokens {
  color: {
    rootBackground: string;
    warning: string;
    calloutBg: string;
    tableBorder: string;
    blackSnap: number;
    whiteSnap: number;
    neutralTol: number;
    bgRedundant: number;
    darkLuma: number;
    link: string;
    button: string;
    white: string;
    black: string;
  };
  /** Href stub rendered into links/buttons/images — real URLs are filled in manually after conversion */
  placeholderHref: string;
  font: {
    stack: string;
    lineHeight: number;
    bodyPx: number;
    headlinePx: number;
    smallPx: number;
    smallMaxPt: number;
    linkWeight: number;
    linkDecoration: string;
  };
  layout: {
    containerMaxWidth: number;
    sidePadding: number;
    blockPadY: number;
    spacerPx: number;
    gridMinWidth: number;
    quotePadX: number;
    calloutAccentPx: number;
    calloutPadX: number;
    alertBandPadH: number;
    alertBandPadV: number;
    gridCellPadY: number;
    gridCellPadX: number;
    recordCellPadY: number;
    recordCellPadX: number;
    recordBorderPx: number;
    buttonSubtitlePadTop: number;
  };
  button: {
    radius: number;
    height: number;
    padding: string;
    innerPadding: string;
    target: string;
    textDecoration: string;  // text-decoration on the <a> link inside a button
  };
  tags: {
    bold:      string;  // "b" or "strong" — inline bold runs AND bold block wrapper (headline)
    italic:    string;  // "em" or "i"
    underline: string;  // "u"
    colorWrap: string;  // "span" — wrapper for color-only runs
    blockWrap: string;  // "span" or "div" — inner wrapper for normal text block rows
  };
  accentBullet: string;
  classes: {
    primaryTable: string;
    verticalSpace: string;
    innerTable: string;
    spacer: string;
    btnWrap: string;
    imgBg: string;
    inlineCell: string;
  };
}

export const tokens: Tokens = {
  color: {
    rootBackground: "#ffffff",
    warning:        "#cc0000",
    calloutBg:      "#f5f5f5",
    tableBorder:    "#E4E4E4",
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
  },
  placeholderHref: "urlhere",
  font: {
    // Pulled from shared config — one place to update for all converters and profiles
    stack:          config.fontFamily,  // "'Roboto', Arial, Helvetica, sans-serif"
    lineHeight:     1.5,
    bodyPx:         18,   // matches Simple converter default paragraph size
    headlinePx:     22,   // matches Simple converter h1 / centerHeadline size
    smallPx:        12,   // matches Simple converter h6 / smallText size
    smallMaxPt:     9,    // GDocs pt ≤ this → "small" role, otherwise "body"
    linkWeight:     700,
    linkDecoration: "underline",
  },
  layout: {
    containerMaxWidth:    600,
    sidePadding:           20,
    blockPadY:             14,   // top + bottom padding per block row (matches Simple)
    spacerPx:              16,   // height of the spacer <td> between sections
    gridMinWidth:         100,
    quotePadX:             20,   // h4 quote paragraph left/right indent (matches Simple converter)
    calloutAccentPx:       10,   // calloutLeft left-border width
    calloutPadX:           10,   // callout left/right inner padding
    alertBandPadH:         10,   // alertBand horizontal inner padding
    alertBandPadV:          4,   // alertBand vertical inner padding
    gridCellPadY:          10,   // statsGrid card cell padding top/bottom
    gridCellPadX:           6,   // statsGrid card cell padding left/right
    recordCellPadY:         4,   // recordRow cell padding top/bottom
    recordCellPadX:         6,   // recordRow cell padding left/right
    recordBorderPx:         1,   // recordRow cell border-bottom width
    buttonSubtitlePadTop:   8,   // gap above buttonBand subtitle line
  },
  button: { radius: 10, height: 51, padding: "3px 5px", innerPadding: "9px 15px", target: "_blank", textDecoration: "none" },
  tags: { bold: "b", italic: "em", underline: "u", colorWrap: "span", blockWrap: "span" },
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
};

// Partial override accepted by convertAdvanced — each nested object is also partial.
export type TokensOverride = {
  color?:       Partial<Tokens["color"]>;
  font?:        Partial<Tokens["font"]>;
  layout?:      Partial<Tokens["layout"]>;
  button?:      Partial<Tokens["button"]>;
  tags?:        Partial<Tokens["tags"]>;
  classes?:     Partial<Tokens["classes"]>;
  accentBullet?: string;
  placeholderHref?: string;
};

export function mergeTokens(base: Tokens, override: TokensOverride): Tokens {
  return {
    color:        { ...base.color,   ...override.color },
    font:         { ...base.font,    ...override.font },
    layout:       { ...base.layout,  ...override.layout },
    button:       { ...base.button,  ...override.button },
    tags:         { ...base.tags,    ...override.tags },
    classes:      { ...base.classes, ...override.classes },
    accentBullet: override.accentBullet ?? base.accentBullet,
    placeholderHref: override.placeholderHref ?? base.placeholderHref,
  } as Tokens;
}
