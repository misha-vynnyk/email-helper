import { computeSectionBox } from "../styling/sectionBoxStyle";
import type { BuilderNode, SectionBlock, ShellConfig } from "../types";
import { escapeHtml } from "./escape";
import { renderNodeList } from "./renderNode";
import { responsiveClassAttr } from "./responsiveClassAttr";

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
  const c = computeSectionBox(block, availableWidthPx);
  const paddingStyle = `padding-right: ${c.paddingRight}px; padding-left: ${c.paddingLeft}px; padding-top: ${c.paddingTop}px; padding-bottom: ${c.paddingBottom}px;`;

  const extraStyleParts: string[] = [];
  if (c.fill) extraStyleParts.push(`background-color: ${escapeHtml(c.fill)}`);
  if (c.border) extraStyleParts.push(`border: ${c.border.widthPx}px solid ${escapeHtml(c.border.color)}`);
  if (c.cornerRadius) extraStyleParts.push(`border-radius: ${c.cornerRadius}px`);
  if (c.shadow) extraStyleParts.push(`box-shadow: ${c.shadow.xPx}px ${c.shadow.yPx}px ${c.shadow.blurPx}px ${escapeHtml(c.shadow.color)}`);
  // The shell's global `table { border-collapse: collapse; }` (renderShell.ts) otherwise wins
  // and silently kills border-radius on this table — border-radius doesn't render on a
  // collapsed table regardless of border-width, so this has to override it inline whenever a
  // border or corner radius is actually in play.
  if (c.border || c.cornerRadius) extraStyleParts.push("border-collapse: separate", "border-spacing: 0");
  const extraStyle = extraStyleParts.length > 0 ? ` ${extraStyleParts.join("; ")};` : "";
  const bgcolorAttr = c.fill ? ` bgcolor="${escapeHtml(c.fill)}"` : "";

  const widthAttr = block.widthPx !== undefined ? ` width="${block.widthPx}"` : "";
  const maxWidthStyle = block.widthPx !== undefined ? ` max-width:${block.widthPx}px;` : "";
  const childrenHtml = renderNodeList(nodes, block.childIds, shell, c.childrenAvailableWidthPx, block.gapPx);

  return `<!--[------ Section start ------]-->
<tr>
  <td align="center" style="${paddingStyle}">
    <table align="center" border="0" cellspacing="0" cellpadding="0"${widthAttr}${responsiveClassAttr(undefined, block.responsiveClassNames)}${bgcolorAttr} style="width: 100%;${maxWidthStyle} padding: 0; margin: 0;${extraStyle}" role="presentation">
${childrenHtml}
    </table>
  </td>
</tr>
<!--[------ Section / end ------]-->`;
}
