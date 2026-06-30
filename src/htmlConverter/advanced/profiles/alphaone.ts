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
  },
  button: {
    height:       53,             // AlfaOne td height="53"
    padding:      "3px 4px",     // AlfaOne outer button padding
    innerPadding: "10px 20px",   // AlfaOne <a> padding
  },
};
