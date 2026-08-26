import type { BuilderNode, SectionBlock, ShellConfig } from "../types";
import { escapeHtml } from "./escape";
import { renderNodeList } from "./renderNode";

/**
 * Буквальне відтворення наданого користувачем Section-контейнера (TEMPLATE_BUILDER_STAGE1_QUESTIONS.md, блок 2).
 * Надана розмітка була порожньою щодо fill/border/cornerRadius/shadow — тут вони додаються
 * умовно (лише коли задані), а не завжди, щоб не відходити від мінімалізму наданого зразка.
 *
 * `availableWidthPx` — реальна ширина, успадкована від предка (root: shell.contentWidthPx; в
 * колонці Row: та колонки). Коли `block.widthPx` не задано (вкладений інстанс), секція рендерить
 * без max-width-кепу й тягнеться на всю цю успадковану ширину замість фіксованих 552px.
 */
export function renderSection(block: SectionBlock, nodes: Record<string, BuilderNode>, shell: ShellConfig, availableWidthPx: number): string {
  const paddingStyle = `padding-right: ${block.padding.right}px; padding-left: ${block.padding.left}px; padding-top: ${block.padding.top}px; padding-bottom: ${block.padding.bottom}px;`;

  const extraStyleParts: string[] = [];
  if (block.fill) extraStyleParts.push(`background-color: ${escapeHtml(block.fill)}`);
  if (block.border) extraStyleParts.push(`border: ${block.border.widthPx}px solid ${escapeHtml(block.border.color)}`);
  if (block.cornerRadius) extraStyleParts.push(`border-radius: ${block.cornerRadius}px`);
  if (block.shadow) extraStyleParts.push(`box-shadow: ${block.shadow.xPx}px ${block.shadow.yPx}px ${block.shadow.blurPx}px ${escapeHtml(block.shadow.color)}`);
  const extraStyle = extraStyleParts.length > 0 ? ` ${extraStyleParts.join("; ")};` : "";
  const bgcolorAttr = block.fill ? ` bgcolor="${escapeHtml(block.fill)}"` : "";

  const ownWidthPx = block.widthPx ?? availableWidthPx;
  const widthAttr = block.widthPx !== undefined ? ` width="${block.widthPx}"` : "";
  const maxWidthStyle = block.widthPx !== undefined ? ` max-width:${block.widthPx}px;` : "";
  const childrenHtml = renderNodeList(nodes, block.childIds, shell, ownWidthPx - block.padding.left - block.padding.right, block.gapPx);

  return `<!--[------ Section start ------]-->
<tr>
  <td align="center" style="${paddingStyle}">
    <table align="center" border="0" cellspacing="0" cellpadding="0"${widthAttr}${bgcolorAttr} style="width: 100%;${maxWidthStyle} padding: 0; margin: 0;${extraStyle}" role="presentation">
${childrenHtml}
    </table>
  </td>
</tr>
<!--[------ Section / end ------]-->`;
}
