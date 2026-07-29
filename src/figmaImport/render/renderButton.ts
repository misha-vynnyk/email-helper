import type { ButtonIcon, ButtonNode } from "../types";
import { cornerRadiusToCss, escapeAttr, escapeHtml } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

// Whole snippets lifted from the user's own filled-in blocks in
// figma-to-html/content-blocks-template.html — not a generic-frame composition (see
// "Button/Divider/Header — цілі сніпети" in FIGMA_TEMPLATE_IMPORT_PLAN.md). The outer
// gutter <tr><td class="button-pad"> from those examples is NOT reproduced here — that
// spacing is the parent frame's own responsibility (padding-bottom on the wrapping <td>,
// same as every other child node type), not the button's.

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

// button-no-icon: line-height:1 + explicit padding-top/bottom directly on the <a> is the
// real visual-height mechanism (see ButtonNode.lineHeight/paddingTopPx in the schema).
function renderNoIconButton(node: ButtonNode): string {
  const textColor = node.textColor ?? "#000000";
  const textTransformDeclaration =
    node.textTransform && node.textTransform !== "none" ? ` text-transform: ${node.textTransform};` : "";
  const textStyle =
    `color: ${textColor}; text-align: center; font-family: '${node.fontFamily}', sans-serif;` +
    ` font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: ${node.lineHeight};${textTransformDeclaration}`;

  return (
    `<table ${outerButtonAttrs(node)}>` +
    `<tr><td height="${node.targetHeightPx}" align="center" style="margin: 0; padding: 0; ${textStyle}">` +
    `<a href="${escapeAttr(node.href)}" style="${textStyle} text-decoration: none; display: block; padding-top: ${node.paddingTopPx}px; padding-bottom: ${node.paddingBottomPx}px; padding-right: ${node.paddingRightPx}px; padding-left: ${node.paddingLeftPx}px;">` +
    `${escapeHtml(node.label)}</a>` +
    `</td></tr></table>`
  );
}

function iconImg(icon: ButtonIcon): string {
  return (
    `<img alt="${escapeAttr(icon.altDescription)}" height="${icon.heightPx}" width="${icon.widthPx}" src="${PLACEHOLDER_IMAGE_SRC}"` +
    ` style="border: 0 none; margin: 0; padding: 0; width: ${icon.widthPx}px; height: ${icon.heightPx}px; object-fit: contain; object-position: center; font-size: 0;" />`
  );
}

// The icon+spacer sit inside the non-MSO conditional wrapper so Outlook gets a text-only
// fallback (LESSONS.md §5) — confirmed by the real example.
function iconSpan(icon: ButtonIcon): string {
  return (
    `<!--[if !mso 9]><!-->` +
    `<span style="display: table-cell; vertical-align: middle; text-align: left; width: ${icon.widthPx}px; min-width: ${icon.widthPx}px; padding-right: ${icon.gapPx}px; padding-left: ${icon.gapPx}px;">` +
    iconImg(icon) +
    `</span>` +
    `<!--<![endif]-->`
  );
}

// button-with-icon-*: unlike the no-icon button, the real visual centering here comes from
// vertical-align:middle across table-cells, not from lineHeight/padding on the <a> — padding
// lives on the text's own cell instead, and line-height is always the structural "normal"
// (confirmed against both button-with-icon-left/right examples, not a per-node value).
function renderIconButton(node: ButtonNode, icon: ButtonIcon): string {
  const textColor = node.textColor ?? "#000000";
  const textTransformDeclaration =
    node.textTransform && node.textTransform !== "none" ? ` text-transform: ${node.textTransform};` : "";
  const aStyle = `color: ${textColor}; font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none; display: block;`;
  const textSpan =
    `<span style="display: table-cell; vertical-align: middle; color: ${textColor}; text-align: center;` +
    ` font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif;` +
    ` padding-left: ${node.paddingLeftPx}px; padding-right: ${node.paddingRightPx}px; padding-top: ${node.paddingTopPx}px; padding-bottom: ${node.paddingBottomPx}px;${textTransformDeclaration}">` +
    `${escapeHtml(node.label)}</span>`;
  const iconEl = iconSpan(icon);
  const inner = icon.side === "left" ? iconEl + textSpan : textSpan + iconEl;

  return (
    `<table ${outerButtonAttrs(node)}>` +
    `<tr><td align="center" height="${node.targetHeightPx}" style="margin: 0; padding: 0; color: ${textColor}; font-size: ${node.fontSizePx}px; font-weight: ${node.fontWeight}; line-height: normal; font-family: '${node.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none;">` +
    `<a href="${escapeAttr(node.href)}" target="_blank" style="${aStyle}">` +
    `<span style="display: table;">${inner}</span>` +
    `</a></td></tr></table>`
  );
}

export function renderButton(node: ButtonNode): string {
  if (!node.icon) return renderNoIconButton(node);
  return renderIconButton(node, node.icon);
}
