import { STORAGE_PROVIDERS_CONFIG } from "../../constants";
import type { TokensOverride } from "../config/tokens";

// AlfaOne profile — values taken from alphaone/templates.ts.
export const profile: TokensOverride = {
  font: {
    stack: "Verdana, Geneva, Tahoma, sans-serif",  // ALPHAONE_FONT
  },
  color: {
    button: "#25b625",  // ALPHAONE_BUTTON_COLOR
  },
  layout: {
    blockPadY: 16,  // ALPHAONE_PADDING = "16px"
    placeholderImageWidth: 562,  // hardcoded width="562" in alphaone/templates.ts's wrapImg
  },
  button: {
    height:       53,             // AlfaOne td height="53"
    padding:      "3px 4px",     // AlfaOne outer button padding
    innerPadding: "10px 20px",   // AlfaOne <a> padding
  },
  // Matches ALPHAONE_STORAGE_URL in alphaone/templates.ts
  placeholderImageSrc: STORAGE_PROVIDERS_CONFIG.providers.alphaone.publicBaseUrl + "/",
};
