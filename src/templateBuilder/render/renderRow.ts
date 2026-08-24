import type { RowBlock } from "../types";
import { renderLeafList } from "./renderLeafList";

const COLUMN_CHILD_GAP_PX = 8;

/**
 * Явний N-колонковий ряд (Variant 1 — користувач сам додає "Row" з палітри, не авто-визначення).
 * Класична email-безпечна техніка: font-size:0 + display:inline-block + min-width, щоб колонки
 * коректно стояли поруч і мали технічну можливість стекатись на вузьких клієнтах.
 * `availableWidthPx` — реальна ширина контенту (ShellConfig.contentWidthPx), не наближена константа.
 */
export function renderRow(row: RowBlock, defaultFontFamily: string, availableWidthPx: number): string {
  const columnsHtml = row.columns
    .map((column) => {
      const minWidthPx = Math.round((availableWidthPx * column.widthPercent) / 100);
      const childrenHtml = renderLeafList(column.children, defaultFontFamily, COLUMN_CHILD_GAP_PX);
      return `<td valign="top" align="center" style="display: inline-block; width: ${column.widthPercent}%; max-width: 100%; min-width: ${minWidthPx}px; font-size: 0; line-height: 0; mso-line-height-rule: exactly; vertical-align: top;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width: 100%;">
${childrenHtml}
          </table>
        </td>`;
    })
    .join("\n");

  return `<!--[------ Row start ------]-->
<tr>
  <td align="center" style="font-size: 0; line-height: 0; mso-line-height-rule: exactly;">
    <table border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width: 100%;">
      <tr>
${columnsHtml}
      </tr>
    </table>
  </td>
</tr>
<!--[------ Row / end ------]-->`;
}
