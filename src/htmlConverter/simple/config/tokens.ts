import { PLACEHOLDER_URL } from "../../constants";
import { config } from "../../utils/config";

/**
 * Simple-converter tokens — same pattern as `advanced/config/tokens.ts`
 * (base Tokens + partial-per-group TokensOverride + mergeTokens), but a
 * smaller, purpose-built shape: only the values that actually vary across
 * the three provider forks (default/ttt/alphaone), not a subset of the
 * advanced converter's IR-oriented Tokens.
 *
 * Stage 1 of the token-based dedup plan
 * (/Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md). Not wired
 * into any formatter/template yet — that happens in Stages 2-4.
 */

export interface SimpleTokens {
  fontFamily: string;
  color: {
    link: string;
    button: string;
  };
  storageUrl: string;
  placeholderHref: string;

  /** Vertical padding (top+bottom) of a standard content block/row — HTML branch only; the MJML branch's block padding (10px/25px) is identical across all three forks and stays a literal constant in the future templates factory. */
  blockPaddingV: string;
  /**
   * Vertical padding for the HTML `rightSideImg` row specifically.
   * Everywhere else (HTML `leftSideImg`, MJML `rightSideImg`/`leftSideImg`)
   * just uses `blockPaddingV` directly — the original `alphaone/templates.ts`
   * hardcodes ONLY its HTML `rightSideImg` row to "15px" even though its own
   * `ALPHAONE_PADDING` (used everywhere else, including its own
   * `leftSideImg`) is "16px". A pre-existing, narrow inconsistency in the
   * hand-written fork, preserved here byte-for-byte rather than silently
   * "fixed" (unlike the TTT storage URL bug, this one was not part of the
   * approved Stage 1 fix). default/ttt set this equal to their own
   * `blockPaddingV` since they have no such quirk.
   */
  rightSideImgHtmlPaddingV: string;
  /** Wrapper tag for a normal content block and for the outermost "wrap images + body" block. */
  blockWrapTag: "span" | "div";
  headlineWrapTag: "strong" | "b";
  headlineFontSize: string;

  button: {
    height: string;
    outerPadding: string;
    innerPadding: string;
    className: string;
    /** `border-radius` on both the outer `<td>` and inner `<a>` — shared "10px" across default/ttt/alphaone until the Red profile introduced "12px". */
    radius: string;
  };

  footerPaddingTopHtml: string;
  /**
   * Footer block's bottom padding. default/ttt/alphaone never override this —
   * it just falls out of `blockPaddingV`'s own default (14/15/16px). The Red
   * profile is the first to explicitly diverge (bottom stays 15px while its
   * own `blockPaddingV` is 16px), so this is now its own token rather than an
   * implicit fallback.
   */
  footerPaddingBottomHtml: string;

  signature: {
    className: string;
    widthHtml: string;
    /** Default profile's MJML signature width (180) intentionally differs from its HTML width (200) — ttt/alphaone use the same width (220) for both. */
    widthMjml: string;
    /** `max-width` in the HTML `<img>` style: default uses a fixed "100%" (NOT tied to widthHtml); ttt/alphaone both set it equal to their own widthHtml + "px". */
    maxWidthHtml: string;
  };

  wrapImg: {
    className: string;
    widthHtml: string;
    /** MJML full-width image table width: default/ttt share a fixed "550" regardless of their differing HTML widths; alphaone instead matches its own HTML width (562). */
    widthMjml: string;
    /**
     * `font-size` on the HTML `<img>`'s inline style (fallback-text size if the image
     * fails to load) — "13px" everywhere except the Red profile's original script,
     * which hardcodes "12px" here specifically (its signature image and every other
     * profile's wrapImg still use 13px). A one-character, easy-to-miss divergence —
     * kept as its own token rather than folded into an assumed-shared constant,
     * since profiles exist precisely to capture the source's exact values.
     */
    fontSizeHtml: string;
  };

  fullStructure: {
    tableClassName: string;
    contentClassName: string;
    innerTableClassName: string;
    /** Horizontal side padding on the content `<td>`. */
    sidePaddingH: string;
    /**
     * Default/ttt insert dedicated spacer `<tr>` rows (top+bottom) around the
     * content. AlfaOne's original `fullStructure` has none — it bakes
     * top/bottom padding directly onto the content `<td>` instead. This is a
     * genuine structural difference, not just a value, so it's modeled as a
     * discriminated union rather than a number that could be zero.
     */
    spacer: { hasRows: true; className: string; heightPx: number } | { hasRows: false; verticalPaddingV: string };
    /**
     * Attribute order on the profile-classed middle `<table>`: `cellspacing` before
     * `cellpadding` (false — default/ttt's own scripts already write it this way) or the
     * reverse (true — alphaone/red's own scripts). HTML attribute order has zero effect on
     * rendering, but profiles exist to capture the source's exact byte sequence, not just
     * its visible output — see the memory note on "even 1-char divergences get a token".
     */
    cellPaddingFirst: boolean;
  };

  /**
   * Only the default fork's `italicLinks()` checks native `<a href="https://...">`
   * links for `font-style: italic` and wraps the text in `<em>`; ttt/alphaone
   * never do this check at all (not "check and find false" — the branch
   * doesn't exist in their code).
   */
  detectItalicNativeLinks: boolean;
}

export type SimpleTokensOverride = {
  fontFamily?: string;
  color?: Partial<SimpleTokens["color"]>;
  storageUrl?: string;
  placeholderHref?: string;
  blockPaddingV?: string;
  rightSideImgHtmlPaddingV?: string;
  blockWrapTag?: SimpleTokens["blockWrapTag"];
  headlineWrapTag?: SimpleTokens["headlineWrapTag"];
  headlineFontSize?: string;
  button?: Partial<SimpleTokens["button"]>;
  footerPaddingTopHtml?: string;
  footerPaddingBottomHtml?: string;
  signature?: Partial<SimpleTokens["signature"]>;
  wrapImg?: Partial<SimpleTokens["wrapImg"]>;
  fullStructure?: Partial<Omit<SimpleTokens["fullStructure"], "spacer">> & {
    spacer?: SimpleTokens["fullStructure"]["spacer"];
  };
  detectItalicNativeLinks?: boolean;
};

export function mergeSimpleTokens(base: SimpleTokens, override: SimpleTokensOverride): SimpleTokens {
  return {
    fontFamily: override.fontFamily ?? base.fontFamily,
    color: { ...base.color, ...override.color },
    storageUrl: override.storageUrl ?? base.storageUrl,
    placeholderHref: override.placeholderHref ?? base.placeholderHref,
    blockPaddingV: override.blockPaddingV ?? base.blockPaddingV,
    rightSideImgHtmlPaddingV: override.rightSideImgHtmlPaddingV ?? base.rightSideImgHtmlPaddingV,
    blockWrapTag: override.blockWrapTag ?? base.blockWrapTag,
    headlineWrapTag: override.headlineWrapTag ?? base.headlineWrapTag,
    headlineFontSize: override.headlineFontSize ?? base.headlineFontSize,
    button: { ...base.button, ...override.button },
    footerPaddingTopHtml: override.footerPaddingTopHtml ?? base.footerPaddingTopHtml,
    footerPaddingBottomHtml: override.footerPaddingBottomHtml ?? base.footerPaddingBottomHtml,
    signature: { ...base.signature, ...override.signature },
    wrapImg: { ...base.wrapImg, ...override.wrapImg },
    fullStructure: {
      ...base.fullStructure,
      ...override.fullStructure,
      spacer: override.fullStructure?.spacer ?? base.fullStructure.spacer,
    } as SimpleTokens["fullStructure"],
    detectItalicNativeLinks: override.detectItalicNativeLinks ?? base.detectItalicNativeLinks,
  };
}

/** Base tokens — equal to the current default-fork values (default profile's override is `{}`). */
export const tokens: SimpleTokens = {
  fontFamily: config.fontFamily,
  color: { link: config.colors.link, button: config.colors.button },
  storageUrl: config.storageUrl,
  placeholderHref: PLACEHOLDER_URL,
  blockPaddingV: "14px",
  rightSideImgHtmlPaddingV: "14px",
  blockWrapTag: "span",
  headlineWrapTag: "strong",
  headlineFontSize: "22px",
  button: { height: "51", outerPadding: "3px 5px", innerPadding: "9px 15px", className: "btn-edit-p", radius: "10px" },
  footerPaddingTopHtml: "34px",
  footerPaddingBottomHtml: "14px",
  signature: { className: "img-bg-block", widthHtml: "200", widthMjml: "180", maxWidthHtml: "100%" },
  wrapImg: { className: "img-bg-block", widthHtml: "560", widthMjml: "550", fontSizeHtml: "13px" },
  fullStructure: {
    tableClassName: "primary-table-limit content-table",
    contentClassName: "content-vertical-space",
    innerTableClassName: "content-inner-table",
    sidePaddingH: "20px",
    spacer: { hasRows: true, className: "md-horizontal-space", heightPx: 16 },
    cellPaddingFirst: false,
  },
  detectItalicNativeLinks: true,
};
