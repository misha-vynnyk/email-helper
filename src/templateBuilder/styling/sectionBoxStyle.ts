import type { CSSProperties } from "react";

import type { SectionBlock } from "../types";

export interface ComputedSectionBox {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  fill?: string;
  border?: { widthPx: number; color: string };
  cornerRadius?: number;
  shadow?: { xPx: number; yPx: number; blurPx: number; color: string };
  ownWidthPx: number;
  childrenAvailableWidthPx: number;
}

/**
 * Pure box-model computation shared by the email exporter (`render/renderSection.ts`) and the
 * canvas WYSIWYG preview (`canvas/CanvasWysiwygShell.tsx`) — single source of truth for the
 * padding/fill/border/cornerRadius/shadow/width math, so the two rendering paths can never drift.
 *
 * `ownWidthPx` falls back to `availableWidthPx` when `block.widthPx` is undefined (a nested
 * instance) even though nothing renders that fallback number directly as its own width — it still
 * feeds `childrenAvailableWidthPx`, which the email exporter needs to be a real, non-negative
 * number regardless of nesting depth.
 */
export function computeSectionBox(block: SectionBlock, availableWidthPx: number): ComputedSectionBox {
  const ownWidthPx = block.widthPx ?? availableWidthPx;
  return {
    paddingTop: block.padding.top,
    paddingRight: block.padding.right,
    paddingBottom: block.padding.bottom,
    paddingLeft: block.padding.left,
    fill: block.fill,
    border: block.border,
    cornerRadius: block.cornerRadius,
    shadow: block.shadow,
    ownWidthPx,
    childrenAvailableWidthPx: Math.max(0, ownWidthPx - block.padding.left - block.padding.right),
  };
}

export interface ToReactStyleOptions {
  /** "fixed" = own widthPx is a real, top-level px value; "fill" = nested instance, stretch to 100% of the parent instead of computed.ownWidthPx (which is only a fallback for childrenAvailableWidthPx math, not a real own-width in that case). */
  widthMode: "fixed" | "fill";
}

/** Canvas-only CSS formatting — the email exporter keeps building its own style string directly
 * (see `render/renderSection.ts`), since its exact format/order is part of its test contract. */
export function toReactStyle(computed: ComputedSectionBox, options: ToReactStyleOptions): CSSProperties {
  return {
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,
    backgroundColor: computed.fill,
    border: computed.border ? `${computed.border.widthPx}px solid ${computed.border.color}` : undefined,
    borderRadius: computed.cornerRadius,
    boxShadow: computed.shadow ? `${computed.shadow.xPx}px ${computed.shadow.yPx}px ${computed.shadow.blurPx}px ${computed.shadow.color}` : undefined,
    width: options.widthMode === "fixed" ? computed.ownWidthPx : "100%",
    // A "fixed" box sits in a block-layout parent (CanvasRootDropZone) narrower than the parent's
    // own width — without this it's left-aligned instead of centered like the email export's
    // `align="center"` table. A "fill" box is already 100% of its parent, so centering is moot.
    marginLeft: options.widthMode === "fixed" ? "auto" : undefined,
    marginRight: options.widthMode === "fixed" ? "auto" : undefined,
  };
}
