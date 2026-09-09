import type { DesignNode, FrameNode } from "../types";
import { bgcolorAttr, borderToCss, cornerRadiusToCss, fillToCss, shadowToCss, wrapNameComment } from "./cssUtils";
import { renderButton } from "./renderButton";
import { renderButtonRow } from "./renderButtonRow";
import { renderCardList } from "./renderCardList";
import { renderDivider } from "./renderDivider";
import { renderDividerLogo } from "./renderDividerLogo";
import { renderHeaderImage } from "./renderHeaderImage";
import { renderImage } from "./renderImage";
import { renderPromoCopy } from "./renderPromoCopy";
import { renderRow } from "./renderRow";
import { renderSpacer } from "./renderSpacer";
import { renderText } from "./renderText";

export type Viewport = "desktop" | "mobile";

// Types whose own render function already returns a complete `<tr>…</tr>` row (2026-08-13
// rewrite, see FIGMA_TEMPLATE_IMPORT_PLAN.md) — a parent placing one of these as a child must
// append its html as-is, never wrap it in another `<tr><td>`. Everything else still returns a
// bare fragment and needs the parent to supply the enclosing row (see renderColumnContent /
// renderRowContent / renderDocumentContent below). Exported so renderRow.ts can reuse the same
// discriminant for its own column-internal child stacking instead of re-deriving this list.
const SELF_WRAPPING_TYPES = new Set<DesignNode["type"]>(["frame", "text", "image", "button", "buttonRow", "row", "cardList", "spacer"]);

export function isSelfWrapping(type: DesignNode["type"]): boolean {
  return SELF_WRAPPING_TYPES.has(type);
}

export function widthAttr(width: FrameNode["width"]): string {
  if (width === undefined || width === "fill") return "100%";
  if (width === "hug") return "auto";
  return `${width}`;
}

// Width-capping CSS only — a numeric width gets the fluid-but-capped `width:100%; max-width:Npx`
// pair (matches masterShell.ts's own 600px Inner table), "fill"/undefined stays fluid with no
// cap, "hug" gets no width declaration at all (bare `width="auto"` attribute does the sizing).
// Applied to BOTH the frame's own <td> and its inner content `<table>` (2026-08-17) — see
// visualBoxStyle below for why the <td> needs it too, not just the table.
export function widthCapCss(width: FrameNode["width"]): string {
  if (typeof width === "number") return `width: 100%; max-width: ${width}px;`;
  if (width === "hug") return "";
  return "width: 100%;";
}

// The frame's own visual identity (fill/border/cornerRadius/shadow) plus its width-capping CSS —
// applied to the frame's own <td> (2026-08-17 fix), NOT the inner content `<table>` anymore.
//
// BUG this fixes (found on a real generated file, KitchenTableInsight.com/desktop.json): fill/
// border used to live on the inner `<table>`, while `padding` lived on the OUTER `<td>` wrapping
// that table — two separate boxes, so the padding rendered OUTSIDE the coloured/bordered area
// instead of inside it (e.g. a card with `fill:#F9F9F9` + `padding:12` showed a transparent
// 12px gutter around a smaller pink box, rather than 12px of breathing room *inside* a pink box
// that fills the frame's full bounds — the opposite of what a Figma frame's `padding` means).
// Fix: fill/border/cornerRadius/shadow now sit on the exact same `<td>` as `padding` — standard
// CSS box-model semantics guarantee the background/border always underlies the padding area of
// its own box, so the two can never separate again. The inner `<table>` becomes purely
// structural (no visual identity of its own), same role `renderColumnContent`'s "plain content
// table" always had.
//
// The <td> also needs its own width-capping (not just the table) — otherwise, with no width on
// the <td> itself, its background would spread across whatever width its parent cell gives it
// (typically the full row), while the *content* (inside the still-capped inner table) stays
// centered at the narrower `node.width` — a colored box wider than the "card" it's supposed to
// be. Duplicating the same width CSS onto both boxes is a deliberate belt-and-suspenders (the
// codebase already does this for `bgcolor` attribute + CSS `background-color`), not a stray
// leftover from the previous single-table version.
export function visualBoxStyle(node: FrameNode): string {
  const hasRadius = node.cornerRadius !== undefined;
  const declarations = [widthCapCss(node.width)];
  if (node.fill) declarations.push(fillToCss(node.fill));
  if (node.border) declarations.push(borderToCss(node.border));
  if (hasRadius) declarations.push(cornerRadiusToCss(node.cornerRadius as NonNullable<FrameNode["cornerRadius"]>));
  if (node.shadow) declarations.push(shadowToCss(node.shadow));
  return declarations.filter(Boolean).join(" ");
}

// Full longhand, never the 4-value `padding:` shorthand — some email clients have documented
// bugs parsing/applying the multi-value shorthand per side reliably (2026-08-14, user
// feedback); every OTHER `padding: 0;`/`margin: 0;` in this codebase is a plain reset (a single
// uniform value, not four different ones) and stays shorthand, since that specific failure
// mode doesn't apply to it. Zero sides are omitted entirely (same feedback: "only write
// paddings that have real values") — the CSS initial value for an omitted longhand is already
// 0, so this changes nothing about the rendered result.
export function insetPadding(node: FrameNode, extraBottomGapPx: number): string {
  const bottom = node.padding.bottom + extraBottomGapPx;
  return [
    node.padding.top ? `padding-top: ${node.padding.top}px;` : "",
    node.padding.right ? `padding-right: ${node.padding.right}px;` : "",
    bottom ? `padding-bottom: ${bottom}px;` : "",
    node.padding.left ? `padding-left: ${node.padding.left}px;` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function isVisibleOn(node: DesignNode, viewport: Viewport): boolean {
  if (!node.visibility || node.visibility === "both") return true;
  return node.visibility === (viewport === "desktop" ? "desktopOnly" : "mobileOnly");
}

function visibleChildren(children: DesignNode[], viewport: Viewport): DesignNode[] {
  return children.filter((child) => isVisibleOn(child, viewport));
}

// `gap` is applied as extra bottom spacing on every non-last child, keyed off the child's
// position in the full list (not just among bare-fragment siblings).
//
// CORRECTION (2026-08-13, found against real content — figma-to-html/KitchenTableInsight.com):
// the first two cuts of this rewrite either (a) made `gap` a no-op for self-wrapping children
// entirely, or (b) fixed that by wrapping a gapped self-wrapping child in an EXTRA `<table>` —
// which then produced pathological nesting depth on real content (11 nested `<table>`s / 31
// total on one modest newsletter — nearly every real frame nests other frames/text, and each
// gap between them cost a whole extra table). Fix: thread the gap directly into the SAME `<td>`
// each self-wrapping renderer already emits at its own outermost level, instead of wrapping
// externally — every self-wrapping type's `renderNode()` call now takes an `extraBottomGapPx`
// it folds into its own existing bottom padding, so gap costs zero extra markup. Bare-fragment
// children (divider/spacer/etc.) still get the simple `<td style="padding-bottom:…">` wrap
// they always did — no change there, and no dedicated empty spacer row either way.
function renderColumnContent(children: DesignNode[], viewport: Viewport, gapPx: number | undefined): string {
  const visible = visibleChildren(children, viewport);
  const lastIndex = visible.length - 1;
  return visible
    .map((node, index) => {
      const gap = Boolean(gapPx) && index !== lastIndex ? (gapPx as number) : 0;
      if (isSelfWrapping(node.type)) return renderNode(node, viewport, gap);
      const html = renderNode(node, viewport);
      const gapStyle = gap ? ` style="padding-bottom: ${gap}px;"` : "";
      return `<tr><td${gapStyle}>${html}</td></tr>`;
    })
    .join("");
}

// Reusable outside this module: a frame's column-direction content and a RowNode column's
// internal stacking (renderRow.ts) are the exact same "list of children stacking vertically"
// operation — this is the single place that logic lives.
export function renderChildRows(children: DesignNode[], viewport: Viewport, gapPx?: number): string {
  return renderColumnContent(children, viewport, gapPx);
}

// A self-wrapping child's html is a bare `<tr>…</tr>` with no enclosing `<table>` — dropping it
// straight into a sibling `<td>` (row-direction placement) would nest a `<tr>` directly inside a
// `<td>`, which is invalid markup. Wrap it in its own plain content table first; bare-fragment
// children go into the `<td>` unwrapped, as before. Unlike renderColumnContent's gap, THIS
// wrapper is structurally required regardless of gap (row-direction gap is horizontal,
// `padding-right` on the outer `<td>` below — an unrelated axis, no folding-in possible), so it
// stays as its own extra table.
//
// Width of that wrapper table (2026-08-19, root-caused on FamilyCenterOfWellness's `ads-header`):
// a `width:"hug"` frame child renders its own content centered via `renderFrame`'s unconditional
// `align="center"` (a confirmed, correct behavior for every other case — see renderFrame's own
// comment). Wrapping that hug-width frame in a `width="100%"` table gives `align="center"` a full
// cell's worth of room to center *within*, which visibly drifts the content away from the cell's
// natural left edge instead of leaving it flush. Since a hug-width frame is meant to shrink to its
// own content by definition, the fix is to give it a shrink-to-fit (`width="auto"`) wrapper
// instead — this removes the extra room to drift into without touching renderFrame's centering
// logic at all. Every other case (fill/numeric-width frames, and every non-frame self-wrapping
// type) keeps the original `width="100%"` wrapper — byte-identical output.
function wrapForRowCell(node: DesignNode, html: string): string {
  if (!isSelfWrapping(node.type)) return html;
  const shrinkToFit = node.type === "frame" && node.width === "hug";
  const width = shrinkToFit ? "auto" : "100%";
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${width}">${html}</table>`;
}

// justify:"spaceBetween" has no flexbox equivalent in table layout; the real technique wraps
// the LAST cell's content in its own align="right" table so it pushes to the far edge while
// every earlier cell stays plain/left-aligned — this applies to any row with 2+ children, not
// only exactly 2 (e.g. "logo + nav links" on the left, one CTA pushed right). There is no
// per-middle-child alignment (no way to push a *middle* child to center, say) — that would be
// a distinct feature, tracked as an open question in figma-import-status.md, not implemented.
function renderRowContent(children: DesignNode[], viewport: Viewport, gapPx: number | undefined, justify: FrameNode["justify"]): string {
  const visible = visibleChildren(children, viewport);
  const lastIndex = visible.length - 1;
  const useSpaceBetween = justify === "spaceBetween" && lastIndex > 0;
  const cells = visible.map((node, index) => {
    const isLast = index === lastIndex;
    const gapStyle = gapPx && !isLast ? `padding-right: ${gapPx}px;` : "";
    const cellContent = wrapForRowCell(node, renderNode(node, viewport));
    if (useSpaceBetween && isLast) {
      return (
        `<td align="right" style="${gapStyle}">` +
        `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="padding: 0; margin: 0;">` +
        `<tr><td>${cellContent}</td></tr></table></td>`
      );
    }
    return `<td style="${gapStyle}">${cellContent}</td>`;
  });
  return `<tr>${cells.join("")}</tr>`;
}

// Self-wrapping (2026-08-13 rewrite): a frame is 2 levels, not 3 — a padded `<td align="center">`
// wraps ONE content `<table>` whose children render straight into it as `<tr>` rows — no inner
// plain content table. `align="center"` is unconditional (2026-08-17, confirmed against the
// user's own real container markup, both a numeric-width outer container and a fluid 100%-width
// inner container carry it). `extraBottomGapPx` (see renderColumnContent) folds a parent's gap
// into this frame's own bottom inset instead of costing an extra wrapper table.
//
// This frame's own `<td>` carries BOTH its `padding` AND its visual identity (fill/border/
// cornerRadius/shadow, via visualBoxStyle) — 2026-08-17 fix, see visualBoxStyle's own comment for
// the bug this closes (padding used to land on a different box than the fill/border, so it
// rendered outside the coloured area instead of inside it). The inner `<table>` is now purely
// structural, carrying no visual identity of its own.
// The outer `<td>` carries NO `width=` attribute (2026-08-19, user-confirmed correction against
// real reference markup) — only `align="center"`, letting it span whatever the parent row
// actually gives it. Centering + width-capping is entirely the inner `<table>`'s job: it carries
// both the numeric `width=` attribute AND its own `align="center"` (previously missing — the
// <td>'s align alone doesn't center a narrower block-level table within a wider cell on its own
// in every client, the table needs its own align too), plus the `max-width` CSS cap.
// `responsiveClass` (added for mergeDesignTrees.ts's responsive assembler, see
// figma-import-status.md's Stage 3 entry) is purely additive: undefined (every existing call
// site) renders byte-identical output to before. When set, it's attached to this frame's own
// outer `<td>` alongside its inline style — the same "class + `!important` override" technique
// the master shell's own `@media` utility tiers already use everywhere else, so a class resolved
// against `utilityClassRegistry.ts` composes with the existing inline styles rather than fighting
// them (email-safe: inline styles apply first, the `!important` class rule wins only once its
// `@media` query is active).
function renderFrame(node: FrameNode, viewport: Viewport, extraBottomGapPx: number, responsiveClass?: string): string {
  const width = widthAttr(node.width);
  const content =
    node.direction === "column"
      ? renderColumnContent(node.children, viewport, node.gap)
      : renderRowContent(node.children, viewport, node.gap, node.justify);
  const tdStyle = `${insetPadding(node, extraBottomGapPx)} margin: 0; ${visualBoxStyle(node)}`.trim();
  const classAttr = responsiveClass ? ` class="${responsiveClass}"` : "";
  return (
    `<tr><td align="center"${classAttr}${bgcolorAttr(node.fill)} style="${tdStyle}">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="${width}" style="border-collapse: collapse; padding: 0; margin: 0; ${widthCapCss(node.width)}">${content}</table>` +
    `</td></tr>`
  );
}

function renderNodeByType(node: DesignNode, viewport: Viewport, extraBottomGapPx: number, responsiveClass?: string): string {
  switch (node.type) {
    case "frame":
      return renderFrame(node, viewport, extraBottomGapPx, responsiveClass);
    case "text":
      return renderText(node, extraBottomGapPx, responsiveClass);
    case "image":
      return renderImage(node, extraBottomGapPx, responsiveClass);
    case "spacer":
      return renderSpacer(node, extraBottomGapPx);
    case "button":
      return renderButton(node, extraBottomGapPx);
    case "buttonRow":
      return renderButtonRow(node, extraBottomGapPx);
    case "row":
      return renderRow(node, viewport, extraBottomGapPx);
    case "divider":
      return renderDivider(node);
    case "dividerLogo":
      return renderDividerLogo(node);
    case "headerImage":
      return renderHeaderImage(node);
    case "promoCopy":
      return renderPromoCopy();
    case "cardList":
      return renderCardList(node, extraBottomGapPx);
  }
}

// `extraBottomGapPx` only ever gets passed by renderColumnContent, folding a parent frame's
// `gap` into a self-wrapping child's own outermost `<td>` (see the CORRECTION comment above) —
// bare-fragment types never receive it (their gap is applied externally, unchanged).
//
// `node.name` → `<!-- Name --> ... <!-- Name end -->` (2026-08-14): the schema has always
// documented this as the source of the top-level block comments `templateManager.extractBlocks()`
// parses, but nothing ever actually emitted it, at any depth. Wiring it in here (the single
// dispatch point every other render function already calls through) covers every node — nested
// or top-level — for free. `promoCopy` is excluded because `renderPromoCopy()` already emits its
// own fixed `<!--=== PROMO-COPY ===-->` comment pair; wrapping it again would double-comment a
// node whose content is never authored per-node anyway.
export function renderNode(node: DesignNode, viewport: Viewport, extraBottomGapPx = 0, responsiveClass?: string): string {
  if (!isVisibleOn(node, viewport)) return "";
  const html = renderNodeByType(node, viewport, extraBottomGapPx, responsiveClass);
  if (node.type === "promoCopy") return html;
  return wrapNameComment(node.name, html);
}

export function renderDocumentContent(nodes: DesignNode[], viewport: Viewport): string {
  return nodes
    .map((node) => ({ node, html: renderNode(node, viewport) }))
    .filter(({ html }) => html !== "")
    .map(({ node, html }) => (isSelfWrapping(node.type) ? html : `<tr><td style="margin: 0; padding: 0;">${html}</td></tr>`))
    .join("");
}
