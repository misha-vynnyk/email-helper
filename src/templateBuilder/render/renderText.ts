import type { TextBlock } from "../types";
import { escapeHtml } from "./escape";
import { isSafeHref, sanitizeFontFamily } from "./security";

/**
 * Буквальне відтворення наданого користувачем текстового блоку (TEMPLATE_BUILDER_STAGE1_QUESTIONS.md, блок 3).
 * Лінк-обгортка (<a>) — опційна: рендериться лише коли задано block.href. Стиль самого <a>
 * (underline/700/#0000EE) лишається буквальним, як у зразку — не пов'язаний з block.color.
 */
export function renderText(block: TextBlock, defaultFontFamily: string, paddingBottomPx: number): string {
  const fontFamily = escapeHtml(sanitizeFontFamily(block.fontFamily ?? defaultFontFamily));
  const cellStyle = `font-family:${fontFamily};font-size:${block.fontSizePx}px;font-style:normal;font-weight:${block.fontWeight};line-height:1.5;text-align:${block.align};color:${escapeHtml(block.color)};padding-bottom: ${paddingBottomPx}px;`;

  const href = block.href && isSafeHref(block.href) ? block.href : undefined;
  const inner = href
    ? `<a href="${escapeHtml(href)}" style="font-family:${fontFamily};text-decoration: underline;font-weight: 700; color: #0000EE;">${block.contentHtml}</a>`
    : block.contentHtml;

  return `<tr>
  <td style="${cellStyle}">
    ${inner}
  </td>
</tr>`;
}
