import type { TokensOverride } from "../config/tokens";

// TTT (TerraTrans) profile — values taken from ttt/templates.ts.
export const profile: TokensOverride = {
  layout: {
    blockPadY:   15,  // TTT_PADDING = "15px"
    sidePadding: 21,  // "padding-left: 21px; padding-right: 21px" in TTT scaffold
    spacerPx:    15,  // height="15" in TTT fullStructure spacers
  },
};
