import type { ButtonBlock, ButtonIcon } from "../types";
import { escapeHtml } from "./escape";
import { responsiveClassAttr } from "./responsiveClassAttr";
import { isSafeHref, sanitizeFontFamily } from "./security";

const BUTTON_HEIGHT_PX = 40;

/**
 * MSO-safe icon-before-label markup, copied 1:1 from the real template's own "Unsubscribe"
 * button (`display:table`/`table-cell` pair, icon hidden in Outlook via the `<!--[if !mso 9]>`
 * comment pair — Outlook's table-cell support is unreliable enough that the icon cell is simply
 * dropped for it rather than risk broken layout). `textStyle` is threaded through and reapplied
 * on the label's own table-cell, same "duplicate text styling on every level" insurance the rest
 * of this file already relies on for clients that honor cell-level styles over anchor-level ones.
 */
function renderButtonIconLabel(icon: ButtonIcon, label: string, textStyle: string): string {
  return `<span style="display:table">` +
    `<!--[if !mso 9]><!-->` +
    `<span style="display:table-cell; vertical-align:middle; text-align:left; width:${icon.widthPx}px; min-width:${icon.widthPx}px;">` +
    `<img alt="${escapeHtml(icon.alt)}" width="${icon.widthPx}" src="${escapeHtml(icon.src)}" style="border: 0 none; margin: 0; padding: 0; width: ${icon.widthPx}px; height: auto; object-fit: contain; object-position: center; font-size: 0" />` +
    `</span>` +
    `<!--<![endif]-->` +
    `<span style="display:table-cell; vertical-align:middle; ${textStyle}padding-left:${icon.gapPx}px;">${escapeHtml(label)}</span>` +
    `</span>`;
}

/**
 * Email-safe hybrid button, matching the user's own proven markup 1:1: fill/border/radius live on
 * the outer <table> (not the inner <td>, unlike the html-converter's unrelated buttonTableHtml),
 * a fixed-height inner <td> guarantees consistent height across clients regardless of font
 * metrics, and text styling is deliberately duplicated on both the <td> and the <a> — insurance
 * for clients that honor cell-level text styles over anchor-level ones. bgColor absent means
 * fill-less/"ghost" — deliberately never emits a literal background-color: transparent.
 */
export function renderButton(block: ButtonBlock, defaultFontFamily: string, paddingBottomPx: number): string {
  const href = isSafeHref(block.href) ? block.href : "urlhere";
  const fontFamily = escapeHtml(sanitizeFontFamily(block.fontFamily ?? defaultFontFamily));

  const bgStyle = block.bgColor ? `background-color:${escapeHtml(block.bgColor)};` : "";
  const borderStyle = block.border ? `border:${block.border.widthPx}px solid ${escapeHtml(block.border.color)};` : "";
  const radiusStyle = block.borderRadiusPx > 0 ? `border-radius:${block.borderRadiusPx}px;` : "";

  const widthAttr = block.width === "full" ? ` width="100%"` : typeof block.width === "number" ? ` width="${block.width}"` : "";
  const widthStyle = block.width === "full" ? `width:100%;max-width:100%;` : typeof block.width === "number" ? `width:100%;max-width:${block.width}px;` : "";

  const tableStyle = `margin:0;padding:0;border-spacing:0;border-collapse:separate;${widthStyle}${radiusStyle}${bgStyle}${borderStyle}`;
  const textStyle = `color:${escapeHtml(block.textColor)};text-align:${block.align};font-family:${fontFamily};font-size:${block.fontSizePx}px;font-weight:${block.fontWeight};line-height:1;`;

  const labelHtml = block.icon ? renderButtonIconLabel(block.icon, block.label, textStyle) : escapeHtml(block.label);

  return `<tr>
  <td align="${block.align}"${responsiveClassAttr("button-pad", block.responsiveClassNames)} style="margin: 0; padding: 0; padding-bottom: ${paddingBottomPx}px;">
    <table class="button-width" border="0" cellpadding="0" cellspacing="0"${widthAttr} role="presentation" style="${tableStyle}">
      <tr>
        <td height="${BUTTON_HEIGHT_PX}" align="center" style="margin: 0; padding: 0; ${textStyle}">
          <a href="${escapeHtml(href)}" style="${textStyle}text-decoration: none; display: block; padding-top: 12px; padding-bottom: 12px; padding-right: 6px; padding-left: 6px;">${labelHtml}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
