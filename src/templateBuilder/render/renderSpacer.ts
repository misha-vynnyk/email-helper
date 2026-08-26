import type { SpacerBlock } from "../types";
import { responsiveClassAttr } from "./responsiveClassAttr";

/** No paddingBottomPx — the block's whole purpose is to be the gap. */
export function renderSpacer(block: SpacerBlock): string {
  return `<tr>
  <td${responsiveClassAttr(undefined, block.responsiveClassNames)} style="font-size:0;line-height:0;height:${block.heightPx}px;" height="${block.heightPx}">&nbsp;</td>
</tr>`;
}
