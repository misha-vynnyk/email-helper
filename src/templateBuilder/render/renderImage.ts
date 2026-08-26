import type { ImageBlock } from "../types";
import { escapeHtml } from "./escape";
import { responsiveClassAttr } from "./responsiveClassAttr";
import { isSafeHref } from "./security";

/**
 * Буквальне відтворення наданого користувачем зображення (TEMPLATE_BUILDER_STAGE1_QUESTIONS.md, блок 4).
 * Лінк-обгортка (<a target="_blank">) — опційна: рендериться лише коли задано block.href.
 * class="img-bg-block" лишається буквальним, як надано.
 */
export function renderImage(block: ImageBlock, paddingBottomPx: number): string {
  const img = `<img alt="${escapeHtml(block.alt)}" height="auto" src="${escapeHtml(block.src)}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: ${block.widthPx}px;font-size:13px;" width="${block.widthPx}"/>`;
  const href = block.href && isSafeHref(block.href) ? block.href : undefined;
  const inner = href ? `<a href="${escapeHtml(href)}" target="_blank">\n      ${img}\n    </a>` : img;

  return `<tr>
  <td${responsiveClassAttr("img-bg-block", block.responsiveClassNames)} align="center" style="padding-bottom: ${paddingBottomPx}px;">
    ${inner}
  </td>
</tr>`;
}
