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
// Deliberately NOT carrying `wrapImg`'s `class="img-bg-block"` (2026-08-19, user-confirmed):
// tried adding it since it's part of `wrapImg`'s own markup, but the user rejected it
// specifically for figma-import templates — that class isn't wanted here, unlike the rest of
// the `<img>`/`<a>` skeleton above.
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
// `responsiveClass` — see the doc comment on `renderFrame` in `renderNode.ts` for why this is an
// additive, default-undefined parameter (mergeDesignTrees.ts's responsive assembler only).
//
// `node.aspectRatio` (width/height, e.g. 3.28) — previously authored but ignored, so the
// placeholder rendered at its own "broken image" intrinsic size instead of the designed box.
// "fixed" images never resize, so their height can be pinned to an explicit px value computed
// from aspectRatio (byte-safe: this is the real design-intent box size, not a preview hack).
// "fluid" images stay on `height="auto"` (no regression to their existing shrink-on-narrow-
// viewport behavior) and get a CSS `aspect-ratio` declaration instead — modern clients compute
// the correct proportional height at any width; clients that don't recognize the property (old
// Outlook desktop) just ignore it and fall back to today's `height="auto"` behavior. Both
// branches render byte-identical to before when `aspectRatio` is absent.
export function renderImage(node: ImageNode, extraBottomGapPx = 0, responsiveClass?: string): string {
  const widthMode = node.widthMode ?? "fluid";
  const align = node.align ?? "center";
  const widthDeclaration = widthMode === "fluid" ? `width:100%;max-width: ${node.widthPx}px;` : `width: ${node.widthPx}px; max-width: ${node.widthPx}px;`;
  const fixedHeightPx = widthMode === "fixed" && node.aspectRatio ? Math.round(node.widthPx / node.aspectRatio) : undefined;
  const heightAttr = fixedHeightPx ?? "auto";
  const heightDeclaration = fixedHeightPx ? `height: ${fixedHeightPx}px;` : "height:auto;";
  const aspectRatioDeclaration = !fixedHeightPx && node.aspectRatio ? `aspect-ratio: ${node.aspectRatio};` : "";
  const img =
    `<img alt="${escapeAttr(node.altDescription)}" height="${heightAttr}" src="${PLACEHOLDER_IMAGE_SRC}"` +
    ` style="border:0;display:block;outline:none;text-decoration:none;${heightDeclaration}${widthDeclaration}${aspectRatioDeclaration}font-size:13px;"` +
    ` width="${node.widthPx}" />`;
  const content = node.href ? `<a href="${escapeAttr(node.href)}" target="_blank">${img}</a>` : img;
  const bottom = node.padding.bottom + extraBottomGapPx;
  const paddingDeclarations = [node.padding.top ? `padding-top: ${node.padding.top}px;` : "", bottom ? `padding-bottom: ${bottom}px;` : ""]
    .filter(Boolean)
    .join(" ");
  const classAttr = responsiveClass ? ` class="${responsiveClass}"` : "";
  const styleAttr = paddingDeclarations ? ` style="${paddingDeclarations}"` : "";

  return `<tr><td align="${align}"${classAttr}${styleAttr}>${content}</td></tr>`;
}
