import { MIN_ROW_COLUMNS, type RowBlock } from "../types";
import { renderLeafList } from "./renderLeafList";

const COLUMN_CHILD_GAP_PX = 8;

/**
 * Явний N-колонковий ряд (Variant 1 — користувач сам додає "Row" з палітри, не авто-визначення).
 * Зовнішня обгортка (padding/width) — така сама, як у renderSection, і не залежить від кількості
 * колонок. Внутрішня розмітка галузиться лише за row.columns.length: 1 колонка не потребує
 * inline-block-техніки (нема з чим стояти поруч) і рендериться як прямий вміст таблиці — так само,
 * як renderSection кладе childrenHtml прямо в <table>. 2+ колонок лишають класичну
 * font-size:0 + display:inline-block + min-width техніку, щоб коректно стояти поруч і мати
 * технічну можливість стекатись на вузьких клієнтах.
 * `availableWidthPx` — реальна ширина контенту (ShellConfig.contentWidthPx), не наближена константа.
 */
export function renderRow(row: RowBlock, defaultFontFamily: string, availableWidthPx: number): string {
  const paddingStyle = `padding-right: ${row.padding.right}px; padding-left: ${row.padding.left}px; padding-top: ${row.padding.top}px; padding-bottom: ${row.padding.bottom}px;`;

  const innerHtml =
    row.columns.length <= MIN_ROW_COLUMNS
      ? renderLeafList(row.columns[0]?.children ?? [], defaultFontFamily, COLUMN_CHILD_GAP_PX)
      : `<tr>
${row.columns
  .map((column) => {
    const minWidthPx = Math.round((availableWidthPx * column.widthPercent) / 100);
    const childrenHtml = renderLeafList(column.children, defaultFontFamily, COLUMN_CHILD_GAP_PX);
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
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="${row.widthPx}" style="width: 100%; max-width: ${row.widthPx}px; padding: 0; margin: 0;" role="presentation">
${innerHtml}
    </table>
  </td>
</tr>
<!--[------ Row / end ------]-->`;
}
