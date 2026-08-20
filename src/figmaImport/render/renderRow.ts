import type { RowColumn, RowNode } from "../types";
import { renderChildRows, type Viewport } from "./renderNode";

// KNOWN GAP, left open 2026-08-19 (user-confirmed interim value): this constant approximates
// the row's actual available content width, but the real figure is dynamic — it depends on the
// padding of whatever ancestor FrameNode the RowNode sits inside, which this renderer has no
// visibility into (it computes each node in isolation, not against an inherited "available
// width" passed down the tree). The user's real templates typically land around 280px min-width
// for a 50% column (implying ~560px of actual available content width, not the raw 600px master
// shell width), so 560 is used here as a closer approximation than 600 was — not a real fix.
// Proper fix would thread actual available-width context down through rendering; tracked as an
// open question in figma-import-status.md rather than solved here.
const MASTER_CONTENT_WIDTH_PX = 560;

// Side-by-side percentage columns that gracefully STACK below ~560px — the classic email
// font-size:0/display:inline-block/min-width technique (2026-08-13, see
// FIGMA_TEMPLATE_IMPORT_PLAN.md). `minWidthPx` is not authored on RowColumn — per the user's
// explicit "рендерер обчислює сам", it's derived here from the column's own `widthPercent`
// against MASTER_CONTENT_WIDTH_PX, so e.g. two 50% columns get minWidthPx=280 and naturally
// wrap to stacked once the available width drops below that.
// Attribute order on both `<table>`s (`border, cellspacing, cellpadding, role, width`) and the
// outer `<td align="center">` with no default style — 2026-08-19, user-confirmed correction
// against real reference markup (previously this module invented its own attribute order and
// always carried a `margin: 0; padding: 0;` reset on the outer `<td>` that the real markup
// never had).
// `class="sm-w-full"` (not the unprefixed `.w-full`, and not this module's old made-up
// `inline-block-element` placeholder) — verified byte-for-byte against every one of the 6
// inline-block columns in `figma-to-html/html-example.html`. `.w-full` fires at the 602px tier
// and would force full-width immediately, defeating the 50%-side-by-side layout above that
// breakpoint; `.sm-w-full` only fires at the 464px tier, well below where `min-width` has
// already caused these columns to wrap onto their own line, so it just makes the now-stacked
// column visually full-width instead of staying capped at its original percentage.
//
// Exported (2026-08-19) — `mergeDesignTrees.ts`'s row↔column adaptive merge reuses this exact
// shell for a desktop `direction:"row"`/mobile `direction:"column"` frame pair that shares the
// same children, instead of duplicating the markup (see that module's `mergeRowToStack`). Two
// extra params exist ONLY for that caller: `className` lets it pass a class name obtained through
// `utilityClassRegistry.resolveWidth(...)`, registered so its CSS rule actually lands in the
// assembled responsive `<style>` block (that caller deliberately uses the "base" tier — `w-full`,
// not this module's own literal `"sm-w-full"` default — see the rationale in that module's doc
// comment: its assembler folds every registered class into one `@media(max-width:602px)` block
// regardless of name prefix, so "sm-" there would be a misleading alias, not a real second
// breakpoint). This module's own single-tree callers below don't go through that registry at all,
// hence the literal default. `extraTdStyle` lets the merge caller fold a horizontal `gap` in as
// `padding-right` on non-last columns. Neither param is used by `renderColumn` below, so its own
// output is unchanged.
export function wrapRowColumn(widthPercent: number, contentHtml: string, className = "sm-w-full", extraTdStyle = ""): string {
  const minWidthPx = Math.round((MASTER_CONTENT_WIDTH_PX * widthPercent) / 100);
  const style = `display: inline-block; width: ${widthPercent}%; max-width: 100%; min-width: ${minWidthPx}px; font-size: 0; line-height: 0; mso-line-height-rule: exactly;${extraTdStyle ? ` ${extraTdStyle}` : ""}`;
  return (
    `<td valign="top" align="center" class="${className}" width="${widthPercent}%"` +
    ` style="${style}">` +
    `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width: 100%;">${contentHtml}</table>` +
    `</td>`
  );
}

function renderColumn(column: RowColumn, viewport: Viewport): string {
  const content = renderChildRows(column.children, viewport);
  return wrapRowColumn(column.widthPercent, content);
}

// Self-wrapping (see SELF_WRAPPING_TYPES in renderNode.ts): the outer `<tr><td>` here carries no
// style at all unless `extraBottomGapPx` (a parent frame's `gap` folded in directly, see the
// CORRECTION comment in renderNode.ts, instead of an extra wrapper `<table>`) needs somewhere to
// live — real interior spacing around a RowNode still comes from nesting it inside a Container
// (FrameNode), not from RowNode itself. Exported as `wrapRowShell` (2026-08-19) for the same
// reason as `wrapRowColumn` above — `mergeDesignTrees.ts` builds its own `cells` string from
// merged (not raw) children, but wraps them in the exact same shell.
export function wrapRowShell(cells: string, extraBottomGapPx = 0): string {
  const gapStyle = extraBottomGapPx ? ` style="padding-bottom: ${extraBottomGapPx}px;"` : "";
  return (
    `<tr><td align="center"${gapStyle}>` +
    `<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%"` +
    ` style="width: 100%; min-width: 100%; font-size: 0; line-height: 0; mso-line-height-rule: exactly; text-align: center;">` +
    `<tr>${cells}</tr>` +
    `</table>` +
    `</td></tr>`
  );
}

export function renderRow(node: RowNode, viewport: Viewport, extraBottomGapPx = 0): string {
  const cells = node.columns.map((column) => renderColumn(column, viewport)).join("");
  return wrapRowShell(cells, extraBottomGapPx);
}
