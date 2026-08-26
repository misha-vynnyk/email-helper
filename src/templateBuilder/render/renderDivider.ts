import type { DividerBlock } from "../types";
import { escapeHtml } from "./escape";
import { responsiveClassAttr } from "./responsiveClassAttr";

/** Bulletproof divider via a table-cell top border, not a literal <hr> — <hr> renders inconsistently in Outlook. */
export function renderDivider(block: DividerBlock, paddingBottomPx: number): string {
  return `<tr>
  <td align="center"${responsiveClassAttr(undefined, block.responsiveClassNames)} style="padding-bottom: ${paddingBottomPx}px;">
    <table cellpadding="0" cellspacing="0" role="presentation" width="${block.widthPercent}%" style="width:${block.widthPercent}%;">
      <tr><td style="font-size:0;line-height:0;border-top:${block.thicknessPx}px solid ${escapeHtml(block.color)};">&nbsp;</td></tr>
    </table>
  </td>
</tr>`;
}
