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
  // className "image-block" (not the base "img-bg-block") matches the original
  // ttt/templates.ts's signatureImg/wrapImg byte-for-byte.
  signature: { className: "image-block", widthHtml: "220", widthMjml: "220", maxWidthHtml: "220px" },
  // No widthHtml override: renders at the shared 560 default, same as every other
  // profile without one. The original ttt/templates.ts's FULL_IMAGE_WIDTH="400" was a
  // stale value from that legacy script, not an intentional TTT-specific size — it also
  // never matched this profile's own widthMjml, which was already inheriting the shared
  // "550" default unchanged.
  wrapImg: { className: "image-block" },
  fullStructure: {
    tableClassName: "main-table",
    contentClassName: "content-wrapper",
    innerTableClassName: "inner-content-wrapper",
    sidePaddingH: "21px",
    spacer: { hasRows: true, className: "space-between-sections", heightPx: 15 },
  },
  detectItalicNativeLinks: false,
};
