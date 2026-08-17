import type { ButtonRowNode } from "../types";
import { renderButtonCell, wrapButtonRowTable } from "./renderButton";

// Multiple side-by-side buttons sharing ONE row-table (e.g. a footer's link-button row) —
// 2026-08-13, see FIGMA_TEMPLATE_IMPORT_PLAN.md. Every button here renders through the
// no-icon path only (renderButtonCell) — a `ButtonNode.icon` on any entry is silently
// ignored, since real footer button-rows never mix icons in.
export function renderButtonRow(node: ButtonRowNode, extraBottomGapPx = 0): string {
  const cells = node.buttons.map((button) => renderButtonCell(button)).join("");
  return wrapButtonRowTable(cells, extraBottomGapPx);
}
