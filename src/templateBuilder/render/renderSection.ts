import { computeBoxStyle } from "../styling/boxStyle";
import type { BuilderNode, SectionBlock, ShellConfig } from "../types";
import { buildBgcolorAttr, buildContainerExtraStyleParts } from "./containerStyleParts";
import { buildPaddingStyle } from "./paddingStyle";
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
  const c = computeBoxStyle(block, availableWidthPx);
  const paddingStyle = buildPaddingStyle({ top: c.paddingTop, right: c.paddingRight, bottom: c.paddingBottom, left: c.paddingLeft });

  const extraStyleParts = buildContainerExtraStyleParts(c);
  const extraStyle = extraStyleParts.length > 0 ? ` ${extraStyleParts.join("; ")};` : "";
  const bgcolorAttr = buildBgcolorAttr(c.fill);

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
