import type { ButtonIcon, ButtonNode } from "../types";
import { bgcolorAttr, cornerRadiusToCss, escapeAttr, escapeHtml } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

// button-no-icon: rewritten 2026-08-13 to the user's real `footer-button`/`footer-button-pad`
// markup (a footer link-button row), which is now canonical — replacing the earlier
// `button`/`button-pad` shape from content-blocks-template.html's `button-no-icon` block. The
// icon path below (renderIconButton) is UNCHANGED — that markup wasn't re-transcribed, so it
// keeps its own, separately-confirmed shape (see FIGMA_TEMPLATE_IMPORT_PLAN.md).
//
// 10px/8px/10px on `footer-button-pad` is a fixed structural constant of this technique (the
// breathing room between adjacent footer-button cells, and the gap when they stack on mobile),
// not sourced from ButtonNode fields — same "renderer decides the technique's own numbers"
// precedent as RowNode's minWidthPx in renderRow.ts.
const FOOTER_BUTTON_PAD_RIGHT_PX = 10;
const FOOTER_BUTTON_PAD_BOTTOM_PX = 8;
const FOOTER_BUTTON_PAD_LEFT_PX = 10;

// The rounded-border table innards — background/border/cornerRadius plus the height/label <a>.
// Extracted so both a lone button (renderButton) and multiple side-by-side buttons
// (renderButtonRow.ts) can share the exact same cell markup.
export function renderButtonCell(node: ButtonNode): string {
  const textColor = node.textColor ?? "#000000";
  const fillDeclaration = node.background !== undefined ? ` background-color: ${node.background};` : "";
  const borderDeclaration = node.border
    ? ` border: ${node.border.widthPx}px ${node.border.style ?? "solid"} ${node.border.color};`
    : "";
  const radiusDeclaration = node.cornerRadius !== undefined ? ` ${cornerRadiusToCss(node.cornerRadius)}` : "";
  const textTransformDeclaration =
    node.textTransform && node.textTransform !== "none" ? ` text-transform: ${node.textTransform};` : "";
  const textStyle =
    `color: ${textColor}; text-align: center; font-family: '${node.fontFamily}', sans-serif;` +
    ` font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: ${node.lineHeight};${textTransformDeclaration}`;

  return (
    `<td class="footer-button" width="${node.widthPx}"` +
    ` style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: ${node.widthPx}px;">` +
    `<table border="0" cellpadding="0" cellspacing="0" width="100%"` +
    ` style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">` +
    `<tr><td class="footer-button-pad"` +
    ` style="margin: 0; padding-right: ${FOOTER_BUTTON_PAD_RIGHT_PX}px; padding-bottom: ${FOOTER_BUTTON_PAD_BOTTOM_PX}px; padding-left: ${FOOTER_BUTTON_PAD_LEFT_PX}px;">` +
    `<table border="0"${bgcolorAttr(node.background !== undefined ? { kind: "solid", color: node.background } : undefined)} cellpadding="0" cellspacing="0" width="100%"` +
    ` style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%;${radiusDeclaration}${fillDeclaration}${borderDeclaration}">` +
    `<tr><td height="${node.targetHeightPx}" align="center" style="margin: 0; padding: 0; ${textStyle}">` +
    `<a href="${escapeAttr(node.href)}" style="${textStyle} text-decoration: none; display: block; padding-top: ${node.paddingTopPx}px; padding-bottom: ${node.paddingBottomPx}px; padding-right: ${node.paddingRightPx}px; padding-left: ${node.paddingLeftPx}px;">` +
    `${escapeHtml(node.label)}</a>` +
    `</td></tr></table>` +
    `</td></tr></table>` +
    `</td>`
  );
}

// Shared neutral row-table wrapper — used for a lone button (one cell) and for
// ButtonRowNode (renderButtonRow.ts, multiple cells) alike. No padding of its own beyond
// `extraBottomGapPx` (a parent frame's `gap` folded in directly, see the CORRECTION comment in
// renderNode.ts, instead of an extra wrapper `<table>`) — same "container supplies the real
// spacing" convention as every other self-wrapping type. `padding: 0;` followed by
// `padding-bottom: Npx;` is valid, well-defined CSS (the longhand overrides just that one side
// of the shorthand), not fragile string-order magic.
export function wrapButtonRowTable(cellsHtml: string, extraBottomGapPx = 0): string {
  const gapDeclaration = extraBottomGapPx ? ` padding-bottom: ${extraBottomGapPx}px;` : "";
  return (
    `<tr><td style="margin: 0; padding: 0;${gapDeclaration}">` +
    `<table border="0" cellpadding="0" cellspacing="0" width="100%"` +
    ` style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%; font-size: 0; text-align: center;">` +
    `<tr>${cellsHtml}</tr>` +
    `</table>` +
    `</td></tr>`
  );
}

function iconImg(icon: ButtonIcon): string {
  return (
    `<img alt="${escapeAttr(icon.altDescription)}" height="${icon.heightPx}" width="${icon.widthPx}" src="${PLACEHOLDER_IMAGE_SRC}"` +
    ` style="border: 0 none; margin: 0; padding: 0; width: ${icon.widthPx}px; height: ${icon.heightPx}px; object-fit: contain; object-position: center; font-size: 0" />`
  );
}

// The icon+spacer sit inside the non-MSO conditional wrapper so Outlook gets a text-only
// fallback (LESSONS.md §5) — confirmed by the real example.
function iconSpan(icon: ButtonIcon): string {
  const cellWidthPx = icon.widthPx + icon.gapPx * 2;
  return (
    `<!--[if !mso 9]><!-->` +
    `<span style="display: table-cell; vertical-align: middle; text-align: left; width: ${cellWidthPx}px; min-width: ${cellWidthPx}px; padding-right: ${icon.gapPx}px; padding-left: ${icon.gapPx}px;">` +
    iconImg(icon) +
    `</span>` +
    `<!--<![endif]-->`
  );
}

function outerButtonAttrs(node: ButtonNode): string {
  const hasFill = node.background !== undefined;
  const fillAttr = hasFill ? ` bgcolor="${escapeAttr(node.background as string)}"` : "";
  const fillDeclaration = hasFill ? ` background-color: ${node.background};` : "";
  const borderDeclaration = node.border
    ? ` border: ${node.border.widthPx}px ${node.border.style ?? "solid"} ${node.border.color};`
    : "";
  const radiusDeclaration = node.cornerRadius !== undefined ? ` ${cornerRadiusToCss(node.cornerRadius)}` : "";
  return `class="button" border="0"${fillAttr} cellpadding="0" cellspacing="0" width="${node.widthPx}" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; max-width: ${node.widthPx}px; width: 100%;${radiusDeclaration}${fillDeclaration}${borderDeclaration}"`;
}

// button-with-icon-*: unlike the no-icon button, the real visual centering here comes from
// vertical-align:middle across table-cells, not from lineHeight/padding on the <a> — padding
// lives on the text's own cell instead, and line-height is always the structural "normal"
// (confirmed against both button-with-icon-left/right examples, not a per-node value). This
// markup is UNCHANGED by the 2026-08-13 footer-button rewrite — only untouched byte-for-byte.
function renderIconButton(node: ButtonNode, icon: ButtonIcon): string {
  const textColor = node.textColor ?? "#000000";
  const textTransformDeclaration =
    node.textTransform && node.textTransform !== "none" ? ` text-transform: ${node.textTransform};` : "";
  const aStyle = `color: ${textColor}; font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none; display: block;`;
  const textSpan =
    `<span style="display: table-cell; vertical-align: middle; color: ${textColor}; text-align: center;` +
    ` font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; text-decoration: none; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif;` +
    ` padding-left: ${node.paddingLeftPx}px; padding-right: ${node.paddingRightPx}px; padding-top: ${node.paddingTopPx}px; padding-bottom: ${node.paddingBottomPx}px;${textTransformDeclaration}">` +
    `${escapeHtml(node.label)}</span>`;
  const iconEl = iconSpan(icon);
  const inner = icon.side === "left" ? iconEl + textSpan : textSpan + iconEl;

  return (
    `<table ${outerButtonAttrs(node)}>` +
    `<tr><td align="center" height="${node.targetHeightPx}" style="margin: 0; padding: 0; color: ${textColor}; font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none;">` +
    `<a href="${escapeAttr(node.href)}" target="_blank" style="${aStyle}">` +
    `<span style="display: table">${inner}</span>` +
    `</a></td></tr></table>`
  );
}

export function renderButton(node: ButtonNode, extraBottomGapPx = 0): string {
  if (!node.icon) return wrapButtonRowTable(renderButtonCell(node), extraBottomGapPx);
  const gapDeclaration = extraBottomGapPx ? ` padding-bottom: ${extraBottomGapPx}px;` : "";
  return `<tr><td style="margin: 0; padding: 0;${gapDeclaration}">${renderIconButton(node, node.icon)}</td></tr>`;
}
