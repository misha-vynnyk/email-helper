import type { DesignNode, FrameNode } from "../types";
import { renderButton } from "./renderButton";
import { borderToCss, cornerRadiusToCss, fillToCss, shadowToCss } from "./cssUtils";
import { renderDivider } from "./renderDivider";
import { renderDividerLogo } from "./renderDividerLogo";
import { renderHeaderImage } from "./renderHeaderImage";
import { renderImage } from "./renderImage";
import { renderSpacer } from "./renderSpacer";
import { renderText } from "./renderText";

export type Viewport = "desktop" | "mobile";

function widthAttr(width: FrameNode["width"]): string {
  if (width === undefined || width === "fill") return "100%";
  if (width === "hug") return "auto";
  return `${width}`;
}

// Universal frame rendering (per user convention, FIGMA_TEMPLATE_IMPORT_PLAN.md Stage 3):
// outer <table> carries fill/border/cornerRadius/shadow with padding:0 — never CSS `padding`
// directly on a <table> (unreliable across email clients); the node's own `padding` lives on
// an inner <td> ("Inside-container") wrapping a width:100% content table ("Content"). Gap
// between children is padding-bottom/padding-right on the trailing side of each non-last
// child, not a dedicated empty spacer row — an explicit large jump uses a real `spacer` child
// node (renderSpacer) instead.
function outerTableStyle(node: FrameNode): string {
  const hasRadius = node.cornerRadius !== undefined;
  const declarations = [`border-collapse: ${hasRadius ? "separate" : "collapse"};`, "padding: 0;", "margin: 0;"];
  if (node.fill) declarations.push(fillToCss(node.fill));
  if (node.border) declarations.push(borderToCss(node.border));
  if (hasRadius) declarations.push(cornerRadiusToCss(node.cornerRadius as NonNullable<FrameNode["cornerRadius"]>));
  if (node.shadow) declarations.push(shadowToCss(node.shadow));
  return declarations.join(" ");
}

function insetPadding(node: FrameNode): string {
  return `${node.padding.top}px ${node.padding.right}px ${node.padding.bottom}px ${node.padding.left}px`;
}

function renderColumnContent(childrenHtml: string[], gapPx: number | undefined): string {
  const lastIndex = childrenHtml.length - 1;
  return childrenHtml
    .map((html, index) => {
      const gapStyle = gapPx && index !== lastIndex ? ` style="padding-bottom: ${gapPx}px;"` : "";
      return `<tr><td${gapStyle}>${html}</td></tr>`;
    })
    .join("");
}

// justify:"spaceBetween" has no flexbox equivalent in table layout; the real technique for the
// common two-item case (e.g. a label + a right-aligned value) wraps the last cell's content in
// its own align="right" table so it pushes to the far edge while earlier cells stay left-aligned.
// Three or more children with spaceBetween has no generic table-only equivalent — treated as "start".
function renderRowContent(childrenHtml: string[], gapPx: number | undefined, justify: FrameNode["justify"]): string {
  const lastIndex = childrenHtml.length - 1;
  const useSpaceBetween = justify === "spaceBetween" && lastIndex > 0;
  const cells = childrenHtml.map((html, index) => {
    const isLast = index === lastIndex;
    const gapStyle = gapPx && !isLast ? `padding-right: ${gapPx}px;` : "";
    if (useSpaceBetween && isLast) {
      return (
        `<td align="right" style="${gapStyle}">` +
        `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="padding: 0; margin: 0;">` +
        `<tr><td>${html}</td></tr></table></td>`
      );
    }
    return `<td style="${gapStyle}">${html}</td>`;
  });
  return `<tr>${cells.join("")}</tr>`;
}

function renderFrame(node: FrameNode, viewport: Viewport): string {
  const childrenHtml = node.children.map((child) => renderNode(child, viewport)).filter((html) => html !== "");
  const width = widthAttr(node.width);
  const centerAttr = typeof node.width === "number" ? ' align="center"' : "";
  const content =
    node.direction === "column"
      ? renderColumnContent(childrenHtml, node.gap)
      : renderRowContent(childrenHtml, node.gap, node.justify);
  return (
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${width}"${centerAttr} style="${outerTableStyle(node)}">` +
    `<tr><td style="padding: ${insetPadding(node)}; margin: 0;">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; padding: 0; margin: 0;">${content}</table>` +
    `</td></tr>` +
    `</table>`
  );
}

function isVisibleOn(node: DesignNode, viewport: Viewport): boolean {
  if (!node.visibility || node.visibility === "both") return true;
  return node.visibility === (viewport === "desktop" ? "desktopOnly" : "mobileOnly");
}

export function renderNode(node: DesignNode, viewport: Viewport): string {
  if (!isVisibleOn(node, viewport)) return "";

  switch (node.type) {
    case "frame":
      return renderFrame(node, viewport);
    case "text":
      return renderText(node);
    case "image":
      return renderImage(node);
    case "spacer":
      return renderSpacer(node);
    case "button":
      return renderButton(node);
    case "divider":
      return renderDivider(node);
    case "dividerLogo":
      return renderDividerLogo(node);
    case "headerImage":
      return renderHeaderImage(node);
    case "promoCopy":
      throw new Error(`renderNode: "${node.type}" is not implemented until Stage 3`);
  }
}

export function renderDocumentContent(nodes: DesignNode[], viewport: Viewport): string {
  return nodes
    .map((node) => renderNode(node, viewport))
    .filter((html) => html !== "")
    .map((html) => `<tr><td style="margin: 0; padding: 0;">${html}</td></tr>`)
    .join("");
}
