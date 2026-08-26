import type { ButtonBlock } from "../types";
import { escapeHtml } from "./escape";
import { isSafeHref, sanitizeFontFamily } from "./security";

const BUTTON_HEIGHT_PX = 40;

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

  return `<tr>
  <td align="${block.align}" class="button-pad" style="margin: 0; padding: 0; padding-bottom: ${paddingBottomPx}px;">
    <table class="button-width" border="0" cellpadding="0" cellspacing="0"${widthAttr} role="presentation" style="${tableStyle}">
      <tr>
        <td height="${BUTTON_HEIGHT_PX}" align="center" style="margin: 0; padding: 0; ${textStyle}">
          <a href="${escapeHtml(href)}" style="${textStyle}text-decoration: none; display: block; padding-top: 12px; padding-bottom: 12px; padding-right: 6px; padding-left: 6px;">${escapeHtml(block.label)}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}
