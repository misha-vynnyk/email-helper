import type { BuilderNode, ShellConfig } from "../types";
import { renderButton } from "./renderButton";
import { renderDivider } from "./renderDivider";
import { renderImage } from "./renderImage";
import { renderReadyMade } from "./renderReadyMade";
import { renderRow } from "./renderRow";
import { renderSection } from "./renderSection";
import { renderSpacer } from "./renderSpacer";
import { renderText } from "./renderText";

/**
 * Single recursive dispatcher over the normalized node map — used for the top-level canvas and
 * for any nested slot (Section children, Row-column children) alike, so there's exactly one
 * place that turns a node id into HTML regardless of depth. Replaces the two parallel dispatch
 * tables that used to exist (one in buildDocumentHtml.ts for top-level blocks, one inside the
 * old renderLeafList.ts for leaf children).
 */
export function renderNode(nodes: Record<string, BuilderNode>, id: string, shell: ShellConfig, availableWidthPx: number, paddingBottomPx: number): string {
  const node = nodes[id];
  if (!node) return "";
  switch (node.type) {
    case "text":
      return renderText(node, shell.fontFamily, paddingBottomPx);
    case "image":
      return renderImage(node, paddingBottomPx);
    case "button":
      return renderButton(node, shell.fontFamily, paddingBottomPx);
    case "divider":
      return renderDivider(node, paddingBottomPx);
    case "spacer":
      return renderSpacer(node);
    case "ready-made":
      return renderReadyMade(node);
    case "section":
      return renderSection(node, nodes, shell, availableWidthPx);
    case "row":
      return renderRow(node, nodes, shell, availableWidthPx);
    case "row-column":
      // Columns never appear directly in a generic child list — renderRow resolves and renders
      // them itself (their layout, not just their content, depends on their sibling columns).
      return "";
  }
}

/** Shared by Section children and Row-column children — the only difference between call sites
 * is which gap value they pass in (section.gapPx vs. a fixed column gap). */
export function renderNodeList(nodes: Record<string, BuilderNode>, ids: string[], shell: ShellConfig, availableWidthPx: number, gapPx: number): string {
  return ids.map((id, index) => renderNode(nodes, id, shell, availableWidthPx, index === ids.length - 1 ? 0 : gapPx)).join("\n");
}
