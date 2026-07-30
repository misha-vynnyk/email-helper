import { STORAGE_PROVIDERS_CONFIG } from "../../constants";
import type { SimpleTokensOverride } from "../config/tokens";

/**
 * Red profile — ported from a standalone HTML/JS tool the client already
 * used outside this app. Structurally closer to `default` (span/strong wrap
 * tags) but with alphaone-like values otherwise (16px padding, larger
 * button/radius, the same rightSideImg padding quirk).
 *
 * Two deliberate departures from the original standalone script (both
 * confirmed with the user, not silent):
 * 1. `storageUrl` is a plain static per-profile URL (`automation/config.json`'s
 *    `storageProviders.red.publicBaseUrl`, matching how ttt/alphaone already
 *    source theirs), NOT the original script's per-image dynamic URL
 *    (`.../promo/{prefix}/lift-{suffix}/img-{n}.jpg` built from the file-name
 *    input + a running image counter) — image naming happens elsewhere in
 *    this app's pipeline. NOTE: `automation/config.json`'s "red" entry has
 *    `bucket`/`consoleRootPrefix`/`usesCategory` as unconfirmed placeholders
 *    (inferred by analogy with "default") — only `publicBaseUrl`/
 *    `publicPathPrefix`/`publicRootPrefix`/`folderPrefix` are confirmed
 *    against the client's original script. Real uploads via the automation
 *    browser flow are not wired up (no `browserProfiles.red` entry, no
 *    reagstr.com login-flow scripting) — this only fixes where the simple/
 *    advanced converters source their placeholder image URL from.
 * 2. The original script discarded every real `<a href>` link and only
 *    linkified Google-Docs-blue-colored spans (losing genuine hyperlinks).
 *    Confirmed as an unintentional bug in the original tool — Red reuses
 *    the same href-preserving `italicLinks`/`linksStyles` logic as the other
 *    3 profiles instead of forking it.
 *
 * HTML-only: the original script never had an MJML branch. `useHtmlExport`
 * short-circuits MJML export for this profile instead of guessing values.
 */
export const profile: SimpleTokensOverride = {
  fontFamily: "'Noto Sans', Arial, Helvetica, sans-serif",
  color: { link: "#0d0de3", button: "#29c329" },
  storageUrl: `${STORAGE_PROVIDERS_CONFIG.providers.red.publicBaseUrl}/`,
  blockPaddingV: "16px",
  // Same quirk shape as alphaone: rightSideImg's HTML padding is hardcoded
  // to 15px in the original script even though blockPaddingV is 16px there.
  rightSideImgHtmlPaddingV: "15px",
  blockWrapTag: "span",
  headlineWrapTag: "strong",
  headlineFontSize: "24px",
  button: { height: "53", outerPadding: "3px 4px", innerPadding: "10px 20px", className: "base-button", radius: "12px" },
  footerPaddingTopHtml: "25px",
  // Explicit in the original (not tied to blockPaddingV=16px), same shape as the rightSideImg quirk above.
  footerPaddingBottomHtml: "15px",
  signature: { className: "image-block", widthHtml: "220", widthMjml: "220", maxWidthHtml: "220px" },
  // fontSizeHtml: the original script's wrapImg <img> style uses "12px" here — every
  // other profile (and this same script's own signatureImg) uses "13px".
  wrapImg: { className: "full-img-block", widthHtml: "564", widthMjml: "564", fontSizeHtml: "12px" },
  fullStructure: {
    tableClassName: "layout-table-wrapper",
    contentClassName: "layout-content-wrapper",
    innerTableClassName: "layout-inner-block",
    sidePaddingH: "18px",
    spacer: { hasRows: true, className: "section-gap", heightPx: 14 },
    // Same order as alphaone's original script: cellpadding before cellspacing on the
    // middle <table>, opposite of default/ttt.
    cellPaddingFirst: true,
  },
  detectItalicNativeLinks: false,
};
