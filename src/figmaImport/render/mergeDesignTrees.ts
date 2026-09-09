/**
 * Stage 3 "one adaptive .html" assembler — diffs `desktop.json`/`mobile.json` per shared `id`
 * and produces a single merged Content-slot HTML, resolving each real diff against
 * `utilityClassRegistry.ts` (existing class reused, or a new one minted) instead of the
 * per-viewport-only rendering `renderDocumentContent` does today. See the plan write-up in
 * figma-import-status.md's Stage 3 entry for the full design rationale — summary:
 *
 * - Two nodes that render byte-identically on both viewports need nothing extra: included once.
 * - Two nodes with the SAME shape (type, and for a frame: same `direction` + identical ordered
 *   child `id`s) but different leaf style values (frame padding/no-radius/no-shadow; text
 *   fontSize/lineHeight/align/padding; image align/padding) get ONE rendering (desktop's literal
 *   values, unchanged) plus a `@media (max-width:602px)` override class carrying mobile's value —
 *   matched against the registry's existing classes, or minted fresh if no scale tick fits.
 * - Anything else that renders differently (different type, different direction, reordered/
 *   added/removed children, or a diff on a node type this module doesn't leaf-diff) is NOT
 *   partially merged — both the desktop and the mobile rendering are emitted in full, each toggled
 *   via the existing `.hidden`/`.block` class pair at the same breakpoint (the mechanism the
 *   schema's `visibility: "desktopOnly"/"mobileOnly"` field and the plan's "header-swap" case
 *   already describe but never had a real single-document implementation of, until this). This
 *   roughly doubles markup for a genuinely-diverging subtree — accepted per the plan's own stated
 *   goal (handle the general diff, not just style-only cases), not a bug.
 *
 * Deliberately NOT covered (recorded in `diagnostics`, desktop's value silently wins — never a
 * silent drop, always logged): color/fontFamily/fontWeight/letterSpacing/textTransform diffs,
 * run-level (not just defaultStyle) text diffs, and any diff at all on
 * button/divider/dividerLogo/headerImage/spacer/cardList/buttonRow (those fall straight to the
 * side-by-side toggle path on any real difference — no leaf-diffing implemented for them yet).
 *
 * ONE exception to "structural divergence always toggles both variants" (2026-08-19, direct user
 * pushback on the original MVP): a frame that's `direction:"row"` on desktop and
 * `direction:"column"` on mobile, with the SAME ordered child `id`s on both sides (`isRowToStack`
 * below) — the classic "row of cards becomes a stack" pattern (confirmed on real content,
 * `FamilyCenterOfWellness.com`'s `benefit-cards`/`ads-cards`) — is NOT toggled. It's rendered
 * ONCE as a single adaptive row (`mergeRowToStack`), reusing `renderRow.ts`'s own inline-block/
 * `min-width` column shell, so it naturally reflows from side-by-side to stacked via CSS instead
 * of shipping two copies of the same cards gated by `display:none/block`. The column's own
 * "become 100% once stacked" override resolves through `resolveWidth("base","full")` — same
 * "base" tier every other resolve in this module uses (see `diffFrameLeafClasses` etc. below),
 * NOT `renderRow.ts`'s own literal `"sm-w-full"` default: `assembleResponsiveDocument()` (see
 * `masterShell.ts`) folds every class this module registers into ONE
 * `@media (max-width:602px)` block regardless of its name's tier prefix, so a `"sm-"`-prefixed
 * class here would just be a confusingly-named alias for the same 602px behavior, not an actual
 * second breakpoint — picking "base" keeps the naming honest about what actually fires. Any OTHER
 * structural divergence (different type, reordered/added/removed children, or a leaf-diffable
 * type recursing into a genuinely different shape) still uses the side-by-side toggle — there's
 * no general "diff arbitrary structure" technique in table-based email, only this one specific,
 * well-understood pattern.
 */
import type { DesignNode, FrameNode, ImageNode, TextNode } from "../types";
import { bgcolorAttr, wrapNameComment } from "./cssUtils";
import {
  insetPadding,
  isSelfWrapping,
  renderNode,
  type Viewport,
  visualBoxStyle,
  widthAttr,
  widthCapCss,
} from "./renderNode";
import { wrapRowColumn, wrapRowShell } from "./renderRow";
import {
  type PaddingSide,
  type ResolvedClass,
  resolveDisplay,
  resolveLineHeight,
  resolveMisc,
  resolvePadding,
  resolveTextAlign,
  resolveTextSize,
  resolveWidth,
} from "./utilityClassRegistry";

export interface MergeResult {
  contentHtml: string;
  cssRules: Map<string, string>; // className -> full ".class { … !important; }" rule
  diagnostics: string[];
}

interface MergeContext {
  cssRules: Map<string, string>;
  diagnostics: string[];
}

interface MergedNode {
  html: string;
  selfWrapping: boolean; // whether `html` is already a complete `<tr>…</tr>` (or concatenation of
  // such) — mirrors `isSelfWrapping(node.type)` for the common case, but is always `true` after a
  // structural-fallback render even for normally-bare-fragment types (divider/headerImage/…),
  // since `wrapNodeToggle` always adds its own `<tr><td>` wrapper regardless of the underlying
  // type. Callers (mergeColumnContent/mergeRowContent) must key off this field, not the static
  // per-type set, or they'd double-wrap a fallback result.
}

function registerClass(ctx: MergeContext, resolved: ResolvedClass): string {
  if (!ctx.cssRules.has(resolved.className)) ctx.cssRules.set(resolved.className, resolved.cssRule);
  return resolved.className;
}

function wrapNodeToggle(node: DesignNode, html: string, className: string, displayValue: "block" | "none"): string {
  const inner = isSelfWrapping(node.type)
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${html}</table>`
    : html;
  return `<tr><td class="${className}" style="display: ${displayValue};">${inner}</td></tr>`;
}

// Both variants rendered in full, toggled via the base (602px) `.hidden`/`.block` pair — see the
// module doc comment above for why this is the deliberate fallback for any real structural
// divergence, not a bug.
function structuralFallback(dNode: DesignNode, mNode: DesignNode, ctx: MergeContext): MergedNode {
  const hidden = registerClass(ctx, resolveDisplay("base", "hidden"));
  const block = registerClass(ctx, resolveDisplay("base", "block"));
  const desktopWrapped = wrapNodeToggle(dNode, renderNode(dNode, "desktop"), hidden, "block");
  const mobileWrapped = wrapNodeToggle(mNode, renderNode(mNode, "mobile"), block, "none");
  ctx.diagnostics.push(
    `id="${dNode.id}": desktop/mobile structure diverges (not just a leaf style value) — rendered both, toggled via .${hidden}/.${block} at 602px`,
  );
  return { html: desktopWrapped + mobileWrapped, selfWrapping: true };
}

// A node that exists on only one side (schema's `visibility: "desktopOnly"/"mobileOnly"`,
// already required by `validate.ts`'s cross-file check for this to be valid input) — the other
// viewport simply shows nothing in its place, so only one variant renders, toggled the same way.
function singleSideNode(node: DesignNode, side: Viewport, ctx: MergeContext): MergedNode {
  if (side === "desktop") {
    const hidden = registerClass(ctx, resolveDisplay("base", "hidden"));
    return { html: wrapNodeToggle(node, renderNode(node, "desktop"), hidden, "block"), selfWrapping: true };
  }
  const block = registerClass(ctx, resolveDisplay("base", "block"));
  return { html: wrapNodeToggle(node, renderNode(node, "mobile"), block, "none"), selfWrapping: true };
}

function sameShape(d: DesignNode, m: DesignNode): boolean {
  if (d.type !== m.type) return false;
  if (d.type === "frame" && m.type === "frame") {
    if (d.direction !== m.direction) return false;
    if (d.children.length !== m.children.length) return false;
    return d.children.every((child, i) => child.id === m.children[i].id);
  }
  return true;
}

// The one carve-out from "any direction mismatch is a structural fallback" — see the module doc
// comment. Deliberately narrow: same children, same order, ONLY the direction flips row→column.
// Not a type predicate on purpose — `d.type === "frame"` alone doesn't imply this shape (a frame
// failing the rest of the checks is still a frame), so narrowing on it would wrongly exclude
// "frame" from `dNode`'s type in the caller's subsequent `switch (dNode.type)`.
function isRowToStack(d: DesignNode, m: DesignNode): boolean {
  return (
    d.type === "frame" &&
    m.type === "frame" &&
    d.direction === "row" &&
    m.direction === "column" &&
    d.children.length === m.children.length &&
    d.children.every((child, i) => child.id === m.children[i].id)
  );
}

// Desktop's per-child numeric `width` (the classic "N fixed-px cards in a row" authoring pattern
// — see `benefit-cards` in FamilyCenterOfWellness.com) gives the real proportion each column
// should occupy; falls back to an even split when that's not uniformly available (mixed/auto
// widths have no shared basis for a meaningful ratio).
function columnWidthPercents(children: DesignNode[]): number[] {
  const widths = children.map((c) => (c.type === "frame" && typeof c.width === "number" ? c.width : undefined));
  if (widths.every((w): w is number => w !== undefined)) {
    const total = widths.reduce((sum, w) => sum + w, 0);
    return widths.map((w) => Math.round((w / total) * 100));
  }
  const evenSplit = Math.round(100 / children.length);
  return children.map(() => evenSplit);
}

// A card's own fixed `width:184`-style field only means "my share of the desktop row" — once
// merged into one adaptive row, the inline-block column (sized via `columnWidthPercents` above)
// already owns that story, at BOTH viewports. Left as-is, the card's own width would keep
// capping it to its desktop pixel value even after `sm-w-full` stacks the column to 100% on
// mobile, leaving dead space instead of actually filling the stacked row. Only overridden when
// desktop's width is a literal number (the pattern this exists for) — `"fill"`/`"hug"`/unset are
// already correct as authored and left untouched. Both sides are normalized together so this
// never shows up as a spurious width diagnostic from the recursive `mergeNode` call below.
function neutralizeCardWidth(dChild: DesignNode, mChild: DesignNode): [DesignNode, DesignNode] {
  if (dChild.type !== "frame" || typeof dChild.width !== "number") return [dChild, mChild];
  return [{ ...dChild, width: "fill" }, mChild.type === "frame" ? { ...mChild, width: "fill" } : mChild];
}

// The adaptive replacement for `structuralFallback` when `isRowToStack` matches: ONE row,
// rendered once, using `renderRow.ts`'s own inline-block/`min-width` column shell — the same
// CSS-only reflow technique `RowNode` already relies on, instead of shipping both the row and the
// stacked variant and toggling visibility. The "become 100% once stacked" class resolves at the
// "base" tier (→ `w-full`, not `renderRow.ts`'s own literal `"sm-w-full"` default) — see the
// module doc comment above for why. `dNode.gap` (horizontal, since this is a row) folds in as
// `padding-right` on every non-last column, mirroring how `renderRowContent` already applies a
// row's own gap — this merge path doesn't drop it.
function mergeRowToStack(dNode: FrameNode, mNode: FrameNode, ctx: MergeContext, extraBottomGapPx: number): MergedNode {
  const percents = columnWidthPercents(dNode.children);
  const wFull = registerClass(ctx, resolveWidth("base", "full") as ResolvedClass);
  const gapPx = dNode.gap ?? 0;
  const lastIndex = dNode.children.length - 1;
  const cells = dNode.children
    .map((dChild, index) => {
      const mChild = mNode.children[index];
      const [nd, nm] = neutralizeCardWidth(dChild, mChild);
      const merged = mergeNode(nd, nm, ctx, 0);
      const inner = merged.selfWrapping ? merged.html : `<tr><td>${merged.html}</td></tr>`;
      const extraTdStyle = gapPx && index !== lastIndex ? `padding-right: ${gapPx}px;` : "";
      return wrapRowColumn(percents[index], inner, wFull, extraTdStyle);
    })
    .join("");
  ctx.diagnostics.push(
    `id="${dNode.id}": desktop row / mobile stacked column merged into one adaptive row (inline-block + min-width technique, .${wFull} at 602px) instead of duplicated toggle markup`,
  );
  return { html: wrapNameComment(dNode.name, wrapRowShell(cells, extraBottomGapPx)), selfWrapping: true };
}

const PADDING_SIDE_KEY: Record<"top" | "right" | "bottom" | "left", PaddingSide> = {
  top: "pt",
  right: "pr",
  bottom: "pb",
  left: "pl",
};

function diffFramePadding(d: FrameNode, m: FrameNode, ctx: MergeContext, classes: string[]): void {
  (["top", "right", "bottom", "left"] as const).forEach((side) => {
    if (d.padding[side] === m.padding[side]) return;
    classes.push(registerClass(ctx, resolvePadding("base", PADDING_SIDE_KEY[side], m.padding[side])));
  });
}

function hasRadius(radius: FrameNode["cornerRadius"]): boolean {
  if (radius === undefined) return false;
  if (typeof radius === "number") return radius !== 0;
  return Object.values(radius).some((v) => (v ?? 0) !== 0);
}

// Leaf-diffable frame fields: padding sides, and radius/shadow as an on/off toggle only (there's
// no utility-class scale for "a *specific* different radius/shadow value", only "remove it") —
// everything else (gap/fill/border/width/justify/crossAlign) has no matching category at all, so
// a real difference there is recorded as a diagnostic and desktop's value silently wins (the base
// render is always built from desktop's literal fields, unchanged).
function diffFrameLeafClasses(d: FrameNode, m: FrameNode, ctx: MergeContext): string | undefined {
  const classes: string[] = [];
  diffFramePadding(d, m, ctx, classes);

  const dRadius = hasRadius(d.cornerRadius);
  const mRadius = hasRadius(m.cornerRadius);
  if (dRadius && !mRadius) {
    classes.push(registerClass(ctx, resolveMisc("base", "noRadius")));
  } else if (dRadius !== mRadius || JSON.stringify(d.cornerRadius) !== JSON.stringify(m.cornerRadius)) {
    ctx.diagnostics.push(`frame id="${d.id}": cornerRadius differs in a way no utility class can express — desktop's value wins`);
  }

  const dShadow = Boolean(d.shadow);
  const mShadow = Boolean(m.shadow);
  if (dShadow && !mShadow) {
    classes.push(registerClass(ctx, resolveMisc("base", "noShadow")));
  } else if (dShadow !== mShadow) {
    ctx.diagnostics.push(`frame id="${d.id}": shadow differs in a way no utility class can express — desktop's value wins`);
  }

  if (d.gap !== m.gap) ctx.diagnostics.push(`frame id="${d.id}": gap differs (${d.gap} vs ${m.gap}) — no utility-class category for gap, desktop's value wins`);
  if (JSON.stringify(d.fill) !== JSON.stringify(m.fill)) ctx.diagnostics.push(`frame id="${d.id}": fill differs — not supported, desktop's value wins`);
  if (JSON.stringify(d.border) !== JSON.stringify(m.border)) ctx.diagnostics.push(`frame id="${d.id}": border differs — not supported, desktop's value wins`);
  if (d.width !== m.width) ctx.diagnostics.push(`frame id="${d.id}": width differs (${JSON.stringify(d.width)} vs ${JSON.stringify(m.width)}) — numeric/hug/fill width has no utility-class scale, desktop's value wins`);

  return classes.length ? classes.join(" ") : undefined;
}

function mergeFrameInner(d: FrameNode, m: FrameNode, ctx: MergeContext, extraBottomGapPx: number): MergedNode {
  const childHtml = d.direction === "column" ? mergeColumnContent(d.children, m.children, ctx, d.gap) : mergeRowContent(d.children, m.children, ctx, d.gap, d.justify);
  const responsiveClass = diffFrameLeafClasses(d, m, ctx);
  const width = widthAttr(d.width);
  const tdStyle = `${insetPadding(d, extraBottomGapPx)} margin: 0; ${visualBoxStyle(d)}`.trim();
  const classAttr = responsiveClass ? ` class="${responsiveClass}"` : "";
  const html =
    `<tr><td align="center"${classAttr}${bgcolorAttr(d.fill)} style="${tdStyle}">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="${width}" style="border-collapse: collapse; padding: 0; margin: 0; ${widthCapCss(d.width)}">${childHtml}</table>` +
    `</td></tr>`;
  return { html: wrapNameComment(d.name, html), selfWrapping: true };
}

function diffTextLeafClasses(d: TextNode, m: TextNode, ctx: MergeContext): string | undefined {
  const classes: string[] = [];
  const dSize = d.defaultStyle.fontSizePx;
  const mSize = m.defaultStyle.fontSizePx;
  if (dSize !== mSize) {
    if (dSize !== undefined && mSize !== undefined) classes.push(registerClass(ctx, resolveTextSize("base", mSize)));
    else ctx.diagnostics.push(`text id="${d.id}": fontSizePx differs but is unset on one side — skipped`);
  }

  const dLine = d.defaultStyle.lineHeight;
  const mLine = m.defaultStyle.lineHeight;
  if (dLine !== mLine) {
    if (dLine !== undefined && mLine !== undefined) classes.push(registerClass(ctx, resolveLineHeight("base", mLine)));
    else ctx.diagnostics.push(`text id="${d.id}": lineHeight differs but is unset (falls back to "normal") on one side — skipped`);
  }

  const dAlign = d.align ?? "left";
  const mAlign = m.align ?? "left";
  if (dAlign !== mAlign) {
    const resolved = resolveTextAlign("base", mAlign);
    if (resolved) classes.push(registerClass(ctx, resolved));
    else ctx.diagnostics.push(`text id="${d.id}": align differs (${dAlign} → ${mAlign}) but no class exists for that value at this tier`);
  }

  if (d.padding.top !== m.padding.top) classes.push(registerClass(ctx, resolvePadding("base", "pt", m.padding.top)));
  if (d.padding.bottom !== m.padding.bottom) classes.push(registerClass(ctx, resolvePadding("base", "pb", m.padding.bottom)));

  (["fontFamily", "fontWeight", "color", "letterSpacing", "textTransform", "italic", "underline", "href"] as const).forEach((key) => {
    if (d.defaultStyle[key] !== m.defaultStyle[key]) {
      ctx.diagnostics.push(`text id="${d.id}": defaultStyle.${key} differs — no utility-class category for it, desktop's value wins`);
    }
  });
  if (JSON.stringify(d.runs) !== JSON.stringify(m.runs)) {
    ctx.diagnostics.push(`text id="${d.id}": per-run overrides differ between desktop/mobile — only defaultStyle is diffed, desktop's runs win`);
  }

  return classes.length ? classes.join(" ") : undefined;
}

function mergeTextInner(d: TextNode, m: TextNode, ctx: MergeContext, extraBottomGapPx: number): MergedNode {
  const responsiveClass = diffTextLeafClasses(d, m, ctx);
  const html = renderNode(d, "desktop", extraBottomGapPx, responsiveClass);
  return { html, selfWrapping: true };
}

function diffImageLeafClasses(d: ImageNode, m: ImageNode, ctx: MergeContext): string | undefined {
  const classes: string[] = [];
  const dAlign = d.align ?? "center";
  const mAlign = m.align ?? "center";
  if (dAlign !== mAlign) {
    const resolved = resolveTextAlign("base", mAlign);
    if (resolved) classes.push(registerClass(ctx, resolved));
    else ctx.diagnostics.push(`image id="${d.id}": align differs (${dAlign} → ${mAlign}) but no class exists for that value at this tier`);
  }
  if (d.padding.top !== m.padding.top) classes.push(registerClass(ctx, resolvePadding("base", "pt", m.padding.top)));
  if (d.padding.bottom !== m.padding.bottom) classes.push(registerClass(ctx, resolvePadding("base", "pb", m.padding.bottom)));
  if (d.widthPx !== m.widthPx) ctx.diagnostics.push(`image id="${d.id}": widthPx differs (${d.widthPx} vs ${m.widthPx}) — no px-based width-class scale, desktop's value wins`);
  if (d.altDescription !== m.altDescription) ctx.diagnostics.push(`image id="${d.id}": altDescription differs — desktop's text wins`);
  if (d.href !== m.href) ctx.diagnostics.push(`image id="${d.id}": href differs — desktop's value wins`);
  return classes.length ? classes.join(" ") : undefined;
}

function mergeImageInner(d: ImageNode, m: ImageNode, ctx: MergeContext, extraBottomGapPx: number): MergedNode {
  const responsiveClass = diffImageLeafClasses(d, m, ctx);
  const html = renderNode(d, "desktop", extraBottomGapPx, responsiveClass);
  return { html, selfWrapping: true };
}

function mergeNode(dNode: DesignNode, mNode: DesignNode, ctx: MergeContext, extraBottomGapPx = 0): MergedNode {
  const dRendered = renderNode(dNode, "desktop", extraBottomGapPx);
  const mRendered = renderNode(mNode, "mobile", extraBottomGapPx);
  if (dRendered === mRendered) {
    return { html: dRendered, selfWrapping: isSelfWrapping(dNode.type) };
  }
  if (isRowToStack(dNode, mNode)) {
    return mergeRowToStack(dNode as FrameNode, mNode as FrameNode, ctx, extraBottomGapPx);
  }
  if (!sameShape(dNode, mNode)) {
    return structuralFallback(dNode, mNode, ctx);
  }
  switch (dNode.type) {
    case "frame":
      return mergeFrameInner(dNode, mNode as FrameNode, ctx, extraBottomGapPx);
    case "text":
      return mergeTextInner(dNode, mNode as TextNode, ctx, extraBottomGapPx);
    case "image":
      return mergeImageInner(dNode, mNode as ImageNode, ctx, extraBottomGapPx);
    default:
      // Same shape (same `type`) but not one of the three leaf-diffable types, and not textually
      // identical — no leaf-diffing implemented for button/divider/dividerLogo/headerImage/
      // spacer/row/cardList/buttonRow yet (see module doc comment), so any real difference here
      // falls back to the safe side-by-side toggle.
      return structuralFallback(dNode, mNode, ctx);
  }
}

// Mirrors `renderColumnContent` in renderNode.ts, but calls `mergeNode` on each *pair* instead of
// `renderNode` on a single node. Only reachable once the caller's `sameShape` check has already
// confirmed `dChildren`/`mChildren` carry identical ordered `id`s, so a simple positional zip is
// safe — no per-child id-matching needed here (that only happens at `mergeDesignTrees`'s own
// top level; a visibility/id mismatch among NESTED children instead fails `sameShape` and falls
// back to a whole-parent-frame side-by-side toggle — coarser, but always correct).
function mergeColumnContent(dChildren: DesignNode[], mChildren: DesignNode[], ctx: MergeContext, gapPx: number | undefined): string {
  const lastIndex = dChildren.length - 1;
  return dChildren
    .map((dChild, index) => {
      const mChild = mChildren[index];
      const gap = Boolean(gapPx) && index !== lastIndex ? (gapPx as number) : 0;
      const merged = mergeNode(dChild, mChild, ctx, gap);
      if (merged.selfWrapping) return merged.html;
      const gapStyle = gap ? ` style="padding-bottom: ${gap}px;"` : "";
      return `<tr><td${gapStyle}>${merged.html}</td></tr>`;
    })
    .join("");
}

// Mirrors `renderRowContent` in renderNode.ts (including the `justify:"spaceBetween"` align-right
// wrapper for the last cell) — same positional-zip precondition as `mergeColumnContent` above.
function mergeRowContent(
  dChildren: DesignNode[],
  mChildren: DesignNode[],
  ctx: MergeContext,
  gapPx: number | undefined,
  justify: FrameNode["justify"],
): string {
  const lastIndex = dChildren.length - 1;
  const useSpaceBetween = justify === "spaceBetween" && lastIndex > 0;
  const cells = dChildren.map((dChild, index) => {
    const mChild = mChildren[index];
    const isLast = index === lastIndex;
    const gapStyle = gapPx && !isLast ? `padding-right: ${gapPx}px;` : "";
    const merged = mergeNode(dChild, mChild, ctx, 0);
    const wrappedCell = merged.selfWrapping
      ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${merged.html}</table>`
      : merged.html;
    if (useSpaceBetween && isLast) {
      return (
        `<td align="right" style="${gapStyle}">` +
        `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="padding: 0; margin: 0;">` +
        `<tr><td>${wrappedCell}</td></tr></table></td>`
      );
    }
    return `<td style="${gapStyle}">${wrappedCell}</td>`;
  });
  return `<tr>${cells.join("")}</tr>`;
}

// Top-level entry: pairs `desktopNodes`/`mobileNodes` by `id` (desktop's own order first, then
// any mobile-only ids appended — a real position-preserving merge across genuinely reordered
// top-level sections isn't attempted, since the two files documenting "the same content, a
// different order" hasn't come up in a real template yet; tracked as a known simplification, not
// silently assumed correct for every future template).
export function mergeDesignTrees(desktopNodes: DesignNode[], mobileNodes: DesignNode[]): MergeResult {
  const ctx: MergeContext = { cssRules: new Map(), diagnostics: [] };
  const dMap = new Map(desktopNodes.map((n) => [n.id, n]));
  const mMap = new Map(mobileNodes.map((n) => [n.id, n]));

  const orderedIds: string[] = desktopNodes.map((n) => n.id);
  mobileNodes.forEach((n) => {
    if (!dMap.has(n.id)) orderedIds.push(n.id);
  });

  const parts = orderedIds
    .map((id) => {
      const dNode = dMap.get(id);
      const mNode = mMap.get(id);
      if (dNode && mNode) return mergeNode(dNode, mNode, ctx, 0);
      if (dNode) return singleSideNode(dNode, "desktop", ctx);
      if (mNode) return singleSideNode(mNode, "mobile", ctx);
      return undefined;
    })
    .filter((p): p is MergedNode => Boolean(p) && p!.html !== "");

  const contentHtml = parts.map((p) => (p.selfWrapping ? p.html : `<tr><td style="margin: 0; padding: 0;">${p.html}</td></tr>`)).join("");

  return { contentHtml, cssRules: ctx.cssRules, diagnostics: ctx.diagnostics };
}
