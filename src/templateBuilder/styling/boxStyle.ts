import type { CSSProperties } from "react";

import type { ContainerBorder, ContainerFill, ContainerPadding, ContainerShadow, CornerRadiusValue, LinearGradientFill } from "../types";

/**
 * Structural subset of `SectionBlock`/`RowBlock` that `computeBoxStyle` actually reads — both
 * block types carry these same fields (canva-plan-v2.md Stage 2 added them to `RowBlock` to match
 * `SectionBlock`), so this is a `Pick`-style intersection rather than either concrete type. Deliberately
 * excludes `gapPx` (only `SectionBlock` has it, and `computeBoxStyle` never reads it — the vertical
 * gap between stacked children is unrelated to this box-model computation).
 */
export interface BoxStyleSource {
  padding: ContainerPadding;
  widthPx?: number;
  fill?: ContainerFill;
  border?: ContainerBorder;
  cornerRadius?: number;
  cornerRadii?: CornerRadiusValue;
  shadow?: ContainerShadow;
}

export interface ComputedBoxStyle {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  fill?: ContainerFill;
  border?: { widthPx: number; color: string };
  /** A plain number in locked/uniform mode, a `CornerRadiusValue` in unlocked per-corner mode (see `SectionBlock.cornerRadii`). */
  cornerRadius?: number | CornerRadiusValue;
  shadow?: { xPx: number; yPx: number; blurPx: number; color: string };
  ownWidthPx: number;
  childrenAvailableWidthPx: number;
}

/**
 * Pure box-model computation shared by the email exporter (`render/renderSection.ts`,
 * `render/renderRow.ts`) and the canvas WYSIWYG preview (`canvas/CanvasWysiwygShell.tsx`) —
 * single source of truth for the padding/fill/border/cornerRadius/shadow/width math, so the
 * rendering paths can never drift. Originally Section-only (`computeSectionBox`); generalized to
 * `BoxStyleSource` once `RowBlock` gained the same fields (canva-plan-v2.md Stage 2) — a second
 * real consumer, not a hypothetical one.
 *
 * `ownWidthPx` falls back to `availableWidthPx` when `block.widthPx` is undefined (a nested
 * instance) even though nothing renders that fallback number directly as its own width — it still
 * feeds `childrenAvailableWidthPx`, which the email exporter needs to be a real, non-negative
 * number regardless of nesting depth.
 */
export function computeBoxStyle(block: BoxStyleSource, availableWidthPx: number): ComputedBoxStyle {
  const ownWidthPx = block.widthPx ?? availableWidthPx;
  return {
    paddingTop: block.padding.top,
    paddingRight: block.padding.right,
    paddingBottom: block.padding.bottom,
    paddingLeft: block.padding.left,
    fill: block.fill,
    border: block.border,
    cornerRadius: block.cornerRadii ?? block.cornerRadius,
    shadow: block.shadow,
    ownWidthPx,
    childrenAvailableWidthPx: Math.max(0, ownWidthPx - block.padding.left - block.padding.right),
  };
}

/** `position` is stored as a 0-1 fraction (matching `figmaImport/schema.ts`'s `fillSchema`
 * convention); CSS gradient stops want a percentage. Rounds to 4 decimal places after the *100
 * multiply to avoid raw floating-point artifacts (e.g. `0.0744 * 100` producing a long tail of
 * 9s/0s) while still preserving real precision like the real template's `7.44%` stop. */
function formatGradientStopPosition(position: number): string {
  return `${Math.round(position * 1_000_000) / 10_000}%`;
}

/** Shared by canvas (`toReactStyle`, below) and the email exporter
 * (`render/containerStyleParts.ts`'s `buildContainerExtraStyleParts`) so the two can never
 * disagree on gradient CSS formatting — the same "single source of truth" reasoning as the rest
 * of this module. */
export function formatLinearGradientCss(fill: LinearGradientFill): string {
  const stops = fill.stops.map((stop) => `${stop.color} ${formatGradientStopPosition(stop.position)}`).join(", ");
  return `linear-gradient(${fill.angleDeg}deg, ${stops})`;
}

export interface ToReactStyleOptions {
  /** "fixed" = own widthPx is a real, top-level px value; "fill" = nested instance, stretch to 100% of the parent instead of computed.ownWidthPx (which is only a fallback for childrenAvailableWidthPx math, not a real own-width in that case). */
  widthMode: "fixed" | "fill";
}

/** `cornerRadius` is a plain number in locked/uniform mode (passed straight through, same as
 * before per-corner support existed — React appends "px" itself) or a `CornerRadiusValue` in
 * unlocked mode, formatted as the CSS 4-value shorthand (top-left top-right bottom-right
 * bottom-left — the same corner order `render/renderSection.ts`/`render/renderRow.ts` use for the
 * email export, so the two can never disagree on which number goes where). */
export function formatCornerRadiusReactValue(cornerRadius: number | CornerRadiusValue | undefined): CSSProperties["borderRadius"] {
  if (cornerRadius === undefined || typeof cornerRadius === "number") return cornerRadius;
  return `${cornerRadius.topLeft}px ${cornerRadius.topRight}px ${cornerRadius.bottomRight}px ${cornerRadius.bottomLeft}px`;
}

/** Canvas-only CSS formatting — the email exporter keeps building its own style string directly
 * (see `render/renderSection.ts`/`render/renderRow.ts`), since its exact format/order is part of
 * its test contract. */
export function toReactStyle(computed: ComputedBoxStyle, options: ToReactStyleOptions): CSSProperties {
  return {
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,
    backgroundColor: typeof computed.fill === "string" ? computed.fill : undefined,
    background: computed.fill && typeof computed.fill !== "string" ? formatLinearGradientCss(computed.fill) : undefined,
    border: computed.border ? `${computed.border.widthPx}px solid ${computed.border.color}` : undefined,
    borderRadius: formatCornerRadiusReactValue(computed.cornerRadius),
    boxShadow: computed.shadow ? `${computed.shadow.xPx}px ${computed.shadow.yPx}px ${computed.shadow.blurPx}px ${computed.shadow.color}` : undefined,
    width: options.widthMode === "fixed" ? computed.ownWidthPx : "100%",
    // A "fixed" box sits in a block-layout parent (CanvasRootDropZone) narrower than the parent's
    // own width — without this it's left-aligned instead of centered like the email export's
    // `align="center"` table. A "fill" box is already 100% of its parent, so centering is moot.
    marginLeft: options.widthMode === "fixed" ? "auto" : undefined,
    marginRight: options.widthMode === "fixed" ? "auto" : undefined,
  };
}
