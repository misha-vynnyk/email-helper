import { MIN_ROW_COLUMNS, type BuilderNode, type RowBlock, type RowColumnBlock, type ShellConfig } from "../types";
import { renderNodeList } from "./renderNode";

const COLUMN_CHILD_GAP_PX = 8;

/**
 * Явний N-колонковий ряд (Variant 1 — користувач сам додає "Row" з палітри, не авто-визначення).
 * Зовнішня обгортка (padding/width) — така сама, як у renderSection, і не залежить від кількості
 * колонок. Внутрішня розмітка галузиться лише за columns.length: 1 колонка не потребує
 * inline-block-техніки (нема з чим стояти поруч) і рендериться як прямий вміст таблиці — так само,
 * як renderSection кладе childrenHtml прямо в <table>. 2+ колонок лишають класичну
 * font-size:0 + display:inline-block + min-width техніку.
 *
 * `availableWidthPx` — реальна ширина, успадкована від предка (не наближена константа). Колонки
 * рахують свій `min-width` від `ownWidthPx` — реального ефективного розміру ЦЬОГО ряду (його
 * власний `widthPx`-кеп, коли заданий, інакше та сама успадкована ширина) — не від успадкованої
 * ширини напряму, бо ряд візуально рендериться саме на `ownWidthPx`, не ширше.
 */
export function renderRow(row: RowBlock, nodes: Record<string, BuilderNode>, shell: ShellConfig, availableWidthPx: number): string {
  const paddingStyle = `padding-right: ${row.padding.right}px; padding-left: ${row.padding.left}px; padding-top: ${row.padding.top}px; padding-bottom: ${row.padding.bottom}px;`;

  const ownWidthPx = row.widthPx ?? availableWidthPx;
  const widthAttr = row.widthPx !== undefined ? ` width="${row.widthPx}"` : "";
  const maxWidthStyle = row.widthPx !== undefined ? ` max-width: ${row.widthPx}px;` : "";

  const columns = row.childIds.map((columnId) => nodes[columnId]).filter((n): n is RowColumnBlock => n?.type === "row-column");

  const innerHtml =
    columns.length <= MIN_ROW_COLUMNS
      ? renderNodeList(nodes, columns[0]?.childIds ?? [], shell, ownWidthPx, COLUMN_CHILD_GAP_PX)
      : `<tr>
${columns
  .map((column) => {
    const minWidthPx = Math.round((ownWidthPx * column.widthPercent) / 100);
    const childrenHtml = renderNodeList(nodes, column.childIds, shell, minWidthPx, COLUMN_CHILD_GAP_PX);
    return `<td class="i-b-e" valign="top" align="center" width="${column.widthPercent}%" style="display: inline-block; width: ${column.widthPercent}%; max-width: 100%; min-width: ${minWidthPx}px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width: 100%;">
${childrenHtml}
          </table>
        </td>`;
  })
  .join("\n")}
      </tr>`;

  return `<!--[------ Row start ------]-->
<tr>
  <td align="center" style="${paddingStyle}">
    <table align="center" border="0" cellspacing="0" cellpadding="0"${widthAttr} style="width: 100%;${maxWidthStyle} padding: 0; margin: 0;" role="presentation">
${innerHtml}
    </table>
  </td>
</tr>
<!--[------ Row / end ------]-->`;
}
