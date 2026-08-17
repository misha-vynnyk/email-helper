import type { ImageNode } from "../types";
import { escapeAttr } from "./cssUtils";
import { PLACEHOLDER_IMAGE_SRC } from "./placeholder";

// Self-wrapping (2026-08-13 rewrite, see FIGMA_TEMPLATE_IMPORT_PLAN.md): an image node is its
// own complete `<tr><td>` row, `align`ed (default "center") and carrying its own
// `node.padding.top/bottom` vertical rhythm — same self-contained-row convention as renderText.
//
// widthMode default "fluid": width:100% so the image shrinks on narrow screens, capped at
// max-width:{widthPx}px — the cap only actually constrains the image when some ancestor
// Container has its own numeric `width`, otherwise Android Gmail stretches a bare fluid <img>
// to the full screen width regardless of max-width. "fixed" (small icons): never stretches
// past widthPx at all — no width:100%.
//
// `<img>`/`<a>` markup is now byte-literal with the app's own established `wrapImg` convention
// (`src/htmlConverter/templates.ts`, the default storage profile) — 2026-08-17, user request to
// stop treating this as a bespoke figmaImport style and instead reuse the same proven skeleton
// every other converter already ships (`border:0;...;font-size:13px;` broken-image fallback
// trick, `height="auto"` attribute, `target="_blank"` on the wrapping link). Only `alt`
// (authored per-node `altDescription`, unlike wrapImg's fixed "Video preview" — direct user
// confirmation this field stays a real per-image alt) and the width/href values vary.
//
// `extraBottomGapPx` folds a parent frame's `gap` into this node's own bottom padding (see the
// CORRECTION comment in renderNode.ts) instead of costing an extra wrapper `<table>` — ADDED to
// the node's own authored `padding.bottom`, not a replacement for it.
//
// Zero sides are omitted entirely (2026-08-14, user feedback: "only write paddings that have
// real values") — the CSS initial value for an omitted longhand is already 0, so this changes
// nothing about the rendered result. When BOTH sides are zero, the `style` attribute itself is
// omitted too (2026-08-17, found on a real generated file — a divider-graphic image with no
// vertical padding was rendering a dangling `style=""`), not left as an empty attribute.
export function renderImage(node: ImageNode, extraBottomGapPx = 0): string {
  const widthMode = node.widthMode ?? "fluid";
  const align = node.align ?? "center";
  const widthDeclaration = widthMode === "fluid" ? `width:100%;max-width: ${node.widthPx}px;` : `width: ${node.widthPx}px; max-width: ${node.widthPx}px;`;
  const img =
    `<img alt="${escapeAttr(node.altDescription)}" height="auto" src="${PLACEHOLDER_IMAGE_SRC}"` +
    ` style="border:0;display:block;outline:none;text-decoration:none;height:auto;${widthDeclaration}font-size:13px;"` +
    ` width="${node.widthPx}" />`;
  const content = node.href ? `<a href="${escapeAttr(node.href)}" target="_blank">${img}</a>` : img;
  const bottom = node.padding.bottom + extraBottomGapPx;
  const paddingDeclarations = [node.padding.top ? `padding-top: ${node.padding.top}px;` : "", bottom ? `padding-bottom: ${bottom}px;` : ""]
    .filter(Boolean)
    .join(" ");
  const styleAttr = paddingDeclarations ? ` style="${paddingDeclarations}"` : "";

  return `<tr><td align="${align}"${styleAttr}>${content}</td></tr>`;
}
