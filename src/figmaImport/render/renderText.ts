import type { TextNode, TextRun, TextStyle } from "../types";
import { escapeAttr, escapeHtml } from "./cssUtils";

function textStyleToCss(style: Partial<TextStyle>): string {
  const declarations: string[] = [];
  if (style.fontSizePx !== undefined) declarations.push(`font-size: ${style.fontSizePx}px;`);
  if (style.fontFamily !== undefined) declarations.push(`font-family: ${style.fontFamily};`);
  if (style.fontWeight !== undefined) declarations.push(`font-weight: ${style.fontWeight};`);
  if (style.letterSpacing !== undefined) declarations.push(`letter-spacing: ${style.letterSpacing}px;`);
  if (style.lineHeight !== undefined) declarations.push(`line-height: ${style.lineHeight};`);
  if (style.color !== undefined) declarations.push(`color: ${style.color};`);
  if (style.italic) declarations.push(`font-style: italic;`);
  if (style.underline) declarations.push(`text-decoration: underline;`);
  if (style.textTransform !== undefined && style.textTransform !== "none") {
    declarations.push(`text-transform: ${style.textTransform};`);
  }
  return declarations.join(" ");
}

function renderRun(run: TextRun, defaultStyle: TextStyle): string {
  const { text, href: runHref, ...runStyle } = run;
  const effectiveStyle: TextStyle = { ...defaultStyle, ...runStyle };
  const effectiveHref = runHref ?? defaultStyle.href;
  const styleAttr = textStyleToCss(effectiveStyle);
  const span = `<span style="${styleAttr}">${escapeHtml(text)}</span>`;

  if (!effectiveHref) return span;
  return `<a href="${escapeAttr(effectiveHref)}" style="text-decoration: none; color: inherit;">${span}</a>`;
}

// Self-wrapping (2026-08-13 rewrite, see FIGMA_TEMPLATE_IMPORT_PLAN.md): a text node is its own
// complete `<tr><td>` row — typography lives directly on the `<td>` (matching the user's real
// markup) and `node.padding.top/bottom` is this node's own vertical rhythm, not a gap the parent
// frame supplies. Per-run <span> styles stay explicit (not relying on CSS inheritance from the
// <td>) for the same reason renderRun always did this — safer across email clients.
//
// `line-height` is ALWAYS emitted here, even when `node.defaultStyle.lineHeight` is unset
// (falls back to "normal") — confirmed by manual browser verification (2026-08-13): RowNode's
// own structural wrapper sets `font-size: 0; line-height: 0` on itself (the standard
// inline-block-stacking technique), and without an explicit reset here that `line-height: 0`
// inherits straight through this <td>, collapsing its layout box to zero height (text still
// paints, but occupies no space — two side-by-side row columns render on top of each other).
// Text is the one leaf type genuinely at risk of this, since unlike an image its own box height
// is derived from the text line, not an intrinsic dimension — so the reset belongs here, not as
// an authoring rule every TextNode has to remember.
//
// `extraBottomGapPx` folds a parent frame's `gap` into this node's own bottom padding (see the
// CORRECTION comment in renderNode.ts) instead of costing an extra wrapper `<table>` — this is
// ADDED to the node's own authored `padding.bottom`, not a replacement for it.
//
// Zero sides are omitted entirely (2026-08-14, user feedback: "only write paddings that have
// real values") — `padding-top: 0px;` etc. is pure noise once a side is zero; the CSS initial
// value for an omitted longhand is already 0, so this changes nothing about the rendered result.
export function renderText(node: TextNode, extraBottomGapPx = 0): string {
  const alignStyle = node.align ? ` text-align: ${node.align};` : "";
  const lineHeight = node.defaultStyle.lineHeight ?? "normal";
  const tdOwnStyle = textStyleToCss({ ...node.defaultStyle, lineHeight: undefined });
  const bottom = node.padding.bottom + extraBottomGapPx;
  const paddingDeclarations = [
    node.padding.top ? `padding-top: ${node.padding.top}px;` : "",
    bottom ? `padding-bottom: ${bottom}px;` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const tdStyle = `${tdOwnStyle}${alignStyle} line-height: ${lineHeight}; ${paddingDeclarations}`;
  const runsHtml = node.runs.map((run) => renderRun(run, node.defaultStyle)).join("");
  return `<tr><td style="${tdStyle}">${runsHtml}</td></tr>`;
}
