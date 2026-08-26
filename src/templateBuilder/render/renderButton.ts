import type { ButtonBlock } from "../types";
import { escapeHtml } from "./escape";
import { isSafeHref } from "./security";

/**
 * Email-safe hybrid button: <table><tr><td bgcolor><a></td></tr></table>, no VML/mso fallback
 * needed (same technique already proven in the html-converter's buttonTableHtml). bgColor absent
 * means fill-less/"ghost" — deliberately never emits a literal background-color: transparent,
 * since that trips Outlook quirks the same way an explicit bgcolor would.
 */
export function renderButton(block: ButtonBlock, paddingBottomPx: number): string {
  const href = isSafeHref(block.href) ? block.href : "urlhere";
  const bgAttr = block.bgColor ? ` bgcolor="${escapeHtml(block.bgColor)}"` : "";
  const bgStyle = block.bgColor ? `background-color:${escapeHtml(block.bgColor)};` : "";
  const borderStyle = block.border ? `border:${block.border.widthPx}px solid ${escapeHtml(block.border.color)};` : "";
  const radiusStyle = block.borderRadiusPx > 0 ? `border-radius:${block.borderRadiusPx}px;` : "";
  const widthAttr = block.fullWidth ? ` width="100%"` : "";
  const tableStyle = block.fullWidth ? ` style="width:100%;max-width:100%;"` : "";
  const linkStyle = `font-size:${block.fontSizePx}px;font-weight:${block.fontWeight};color:${escapeHtml(block.textColor)};text-decoration:none;display:block;padding:12px 24px;${bgStyle}${radiusStyle}${borderStyle}`;

  return `<tr>
  <td align="${block.align}" style="padding-bottom: ${paddingBottomPx}px;">
    <table cellpadding="0" cellspacing="0" role="presentation"${widthAttr}${tableStyle}>
      <tr>
        <td align="center"${bgAttr} style="${radiusStyle}${borderStyle}${bgStyle}">
          <a href="${escapeHtml(href)}" target="_blank" style="${linkStyle}">${escapeHtml(block.label)}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
