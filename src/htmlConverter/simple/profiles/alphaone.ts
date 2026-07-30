import { STORAGE_PROVIDERS_CONFIG } from "../../constants";
import type { SimpleTokensOverride } from "../config/tokens";

export const profile: SimpleTokensOverride = {
  fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
  color: { link: "#0404e4", button: "#25b625" },
  storageUrl: `${STORAGE_PROVIDERS_CONFIG.providers.alphaone.publicBaseUrl}/`,
  blockPaddingV: "16px",
  // NOT "16px": preserves a pre-existing inconsistency in the original
  // alphaone/templates.ts, where ONLY the HTML rightSideImg row's padding
  // was hardcoded to "15px" (leftSideImg and both MJML rows correctly use
  // the 16px constant everywhere else). Not part of the approved Stage 1
  // fix (unlike the TTT storage URL) — left as-is until separately raised.
  rightSideImgHtmlPaddingV: "15px",
  blockWrapTag: "div",
  headlineWrapTag: "b",
  headlineFontSize: "24px",
  button: { height: "53", outerPadding: "3px 4px", innerPadding: "10px 20px", className: "custom-button" },
  footerPaddingTopHtml: "25px",
  footerPaddingBottomHtml: "16px",
  signature: { className: "image-block", widthHtml: "220", widthMjml: "220", maxWidthHtml: "220px" },
  // MJML wrapImg width (562) matches its own HTML width here, unlike
  // default/ttt which both share a fixed 550 in MJML regardless of their
  // differing HTML widths (560/400).
  wrapImg: { className: "image-full-wrapper", widthHtml: "562", widthMjml: "562" },
  fullStructure: {
    tableClassName: "primary-table-wrapper",
    contentClassName: "content-space-main-wrapper",
    innerTableClassName: "content-inner-table",
    sidePaddingH: "19px",
    spacer: { hasRows: false, verticalPaddingV: "14px" },
    // Original script's middle <table> writes cellpadding before cellspacing (opposite
    // of default/ttt's own cellspacing-first order).
    cellPaddingFirst: true,
  },
  detectItalicNativeLinks: false,
};
