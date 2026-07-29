import { STORAGE_PROVIDERS_CONFIG } from "../../constants";
import type { SimpleTokensOverride } from "../config/tokens";

/**
 * TTT profile overrides.
 *
 * `storageUrl` fixes a real bug: the original `ttt/templates.ts` reads
 * `STORAGE_PROVIDERS_CONFIG.providers.publicBaseUrl` (no such key — the
 * real path is `.providers.ttt.publicBaseUrl`), which resolves to the
 * literal string "undefined/" at runtime. TypeScript doesn't catch it
 * because `providers` is typed as `Record<string, {...}>`, so any property
 * name type-checks. Approved fix — see Stage 1 of
 * /Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md.
 */
export const profile: SimpleTokensOverride = {
  storageUrl: `${STORAGE_PROVIDERS_CONFIG.providers.ttt.publicBaseUrl}/`,
  blockPaddingV: "15px",
  rightSideImgHtmlPaddingV: "15px",
  blockWrapTag: "div",
  headlineWrapTag: "b",
  button: { className: "creative-button" },
  footerPaddingTopHtml: "25px",
  footerPaddingBottomHtml: "15px",
  signature: { widthHtml: "220", widthMjml: "220", maxWidthHtml: "220px" },
  wrapImg: { widthHtml: "400" },
  fullStructure: {
    tableClassName: "main-table",
    contentClassName: "content-wrapper",
    innerTableClassName: "inner-content-wrapper",
    sidePaddingH: "21px",
    spacer: { hasRows: true, className: "space-between-sections", heightPx: 15 },
  },
  detectItalicNativeLinks: false,
};
