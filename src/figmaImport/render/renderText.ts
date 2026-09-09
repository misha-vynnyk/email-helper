import type { TextNode, TextRun, TextStyle } from "../types";
import { escapeAttr, escapeHtml } from "./cssUtils";

// Font-family always carries the app's established web-safe fallback stack (2026-08-19, user
// reference: `src/htmlConverter/advanced/config/tokens.ts`'s `stack: "'Roboto', Arial, Helvetica,
// sans-serif"` and the identical literal pattern in `formatter.ts`'s link snippets) — not a
// figmaImport invention, the same convention every other converter in this app already ships.
// Unlike those two (which hardcode "Roboto", the app's one brand font), figmaImport authors a
// different literal font per template, so the name itself stays a variable, only the fallback
// tail is fixed.
function fontFamilyDeclaration(fontFamily: string): string {
  return `font-family: '${fontFamily}', Arial, Helvetica, sans-serif;`;
}

// `font-style`/`font-weight` are ALWAYS emitted (defaulting to "normal"), matching
// `advanced/`'s real generated markup (`e2e.test.ts.snap`: "font-style:normal;font-weight:normal;"
// present even when neither was authored) — 2026-08-19, user-confirmed correction. Previously
// these were omitted entirely when unset, which was an undocumented figmaImport-only deviation
// from the established convention, not a considered choice.
function textStyleToCss(style: Partial<TextStyle>): string {
  const declarations: string[] = [];
  if (style.fontFamily !== undefined) declarations.push(fontFamilyDeclaration(style.fontFamily));
  if (style.fontSizePx !== undefined) declarations.push(`font-size: ${style.fontSizePx}px;`);
  declarations.push(`font-style: ${style.italic ? "italic" : "normal"};`);
  declarations.push(`font-weight: ${style.fontWeight ?? "normal"};`);
  if (style.letterSpacing !== undefined) declarations.push(`letter-spacing: ${style.letterSpacing}px;`);
  if (style.lineHeight !== undefined) declarations.push(`line-height: ${style.lineHeight};`);
  if (style.color !== undefined) declarations.push(`color: ${style.color};`);
  if (style.underline) declarations.push(`text-decoration: underline;`);
  if (style.textTransform !== undefined && style.textTransform !== "none") {
    declarations.push(`text-transform: ${style.textTransform};`);
  }
  return declarations.join(" ");
}

// A link run renders as a bare `<a>` carrying only its own minimal style — NOT a `<span>`
// nested inside an `<a>`, and NOT the full repeated typography block plain/span runs get.
// 2026-08-19, user reference: the app's own established inline-link snippet
// (`formatter.ts`: `<a href="${PLACEHOLDER_URL}" style="font-family:'Roboto', Arial, Helvetica,
// sans-serif;text-decoration: underline;font-weight: 700; color: ${config.colors.link};">`) —
// font-family (for the `[style*="FontName"]` client-side selector rule) + text-decoration +
// font-weight + color, literal per-run values in place of that snippet's hardcoded ones.
// Trade-off accepted here: a link run's own fontSizePx/letterSpacing/lineHeight/textTransform/
// italic overrides (if ever authored) are NOT applied to the anchor — inherited from the
// surrounding <td> instead, same as the reference snippet relies on its own surrounding context.
function renderLinkRun(href: string, effectiveStyle: TextStyle, text: string): string {
  const declarations = [
    effectiveStyle.fontFamily !== undefined ? fontFamilyDeclaration(effectiveStyle.fontFamily) : "",
    `text-decoration: ${effectiveStyle.underline ? "underline" : "none"};`,
    effectiveStyle.fontWeight !== undefined ? `font-weight: ${effectiveStyle.fontWeight};` : "",
    effectiveStyle.color !== undefined ? `color: ${effectiveStyle.color};` : "color: inherit;",
  ]
    .filter(Boolean)
    .join(" ");
  return `<a href="${escapeAttr(href)}" style="${declarations}">${escapeHtml(text)}</a>`;
}

function renderRun(run: TextRun, defaultStyle: TextStyle): string {
  const { text, href: runHref, ...runStyle } = run;
  const effectiveStyle: TextStyle = { ...defaultStyle, ...runStyle };
  const effectiveHref = runHref ?? defaultStyle.href;
  if (effectiveHref) return renderLinkRun(effectiveHref, effectiveStyle, text);
  return `<span style="${textStyleToCss(effectiveStyle)}">${escapeHtml(text)}</span>`;
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
// `responsiveClass` — see the doc comment on `renderFrame` in `renderNode.ts` for why this is an
// additive, default-undefined parameter (mergeDesignTrees.ts's responsive assembler only).
export function renderText(node: TextNode, extraBottomGapPx = 0, responsiveClass?: string): string {
  // Always explicit (default "left"), same "normal"-style default discipline as
  // font-style/font-weight above — matches `advanced/`'s real markup, which never omits
  // text-align (2026-08-19, user-confirmed correction).
  const alignStyle = ` text-align: ${node.align ?? "left"};`;
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
  const classAttr = responsiveClass ? ` class="${responsiveClass}"` : "";
  const runsHtml = node.runs.map((run) => renderRun(run, node.defaultStyle)).join("");
  return `<tr><td${classAttr} style="${tdStyle}">${runsHtml}</td></tr>`;
}
