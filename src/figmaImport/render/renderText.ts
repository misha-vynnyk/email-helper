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

export function renderText(node: TextNode): string {
  const alignStyle = node.align ? `text-align: ${node.align};` : "";
  const runsHtml = node.runs.map((run) => renderRun(run, node.defaultStyle)).join("");
  return `<div style="${alignStyle}">${runsHtml}</div>`;
}
