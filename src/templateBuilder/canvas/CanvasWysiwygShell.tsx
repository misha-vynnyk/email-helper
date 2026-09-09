import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical, Lock, Unlock } from "lucide-react";
import { type CSSProperties, memo, type ReactNode,useRef, useState } from "react";

import { SPACING_SNAP_STEPS_PX } from "../responsiveUtilityCatalog";
import { useResponsiveConflict } from "../state/responsiveConflict";
import { formatCornerRadiusReactValue } from "../styling/boxStyle";
import { type ContainerPadding, type CornerRadiusValue,toggleCornerRadiusLock } from "../types";
import { cornerRadiusFromPointerOffset, paddingAfterEdgeDrag } from "./resizeMath";
import { snapBadgeClassName, snapToNearest } from "./snapValue";
import { usePointerDrag } from "./usePointerDrag";

type Edge = "top" | "right" | "bottom" | "left";
type Corner = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

const MAX_CORNER_RADIUS = 200;
// Corner radius has no shared "responsive utility scale" to reuse (SPACING_SNAP_STEPS_PX is
// padding-specific) — a small hand-picked list, per canva-plan-v2.md Stage 3's own note that this
// scale needed choosing at implementation time. Values beyond MAX_CORNER_RADIUS would never be
// reachable anyway (cornerRadiusFromPointerOffset already clamps there), so the list stops at 200.
const CORNER_RADIUS_SNAP_STEPS_PX = [0, 4, 8, 12, 16, 24, 32, 50, 100, 200];
const OPPOSITE_EDGE: Record<Edge, Edge> = { top: "bottom", right: "left", bottom: "top", left: "right" };
// The chrome strip below sits at `-top-6` (-24px) relative to the box. Reserving exactly 24px of
// margin above the box (as a prior version of this file did) leaves zero clearance: the chrome's
// own row height eats into that reserve, so it sits flush against (or clips into) whatever's above
// it — the scroll container's edge for the first Section, the previous Section's box for a
// stacked one. `CHROME_CLEARANCE_PX` is the extra breathing room on top of the chrome's own
// offset, confirmed live via headless Chrome (see canva-plan-v2.md Stage 1).
const CHROME_OFFSET_PX = 24;
const CHROME_CLEARANCE_PX = 8;
const SECTION_TOP_RESERVE_PX = CHROME_OFFSET_PX + CHROME_CLEARANCE_PX;
const ZERO_CORNER_RADII: CornerRadiusValue = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
const CORNER_CURSOR: Record<Corner, string> = { topLeft: "nwse-resize", topRight: "nesw-resize", bottomRight: "nwse-resize", bottomLeft: "nesw-resize" };
const CORNER_POSITION_CLASS: Record<Corner, string> = { topLeft: "-top-1 -left-1", topRight: "-top-1 -right-1", bottomRight: "-bottom-1 -right-1", bottomLeft: "-bottom-1 -left-1" };

/** Re-signs a corner-radius drag's raw cumulative `{dx, dy}` (from the pointerdown origin) into
 * "distance moved TOWARD the box's center" for whichever corner the handle sits at — the only
 * thing `cornerRadiusFromPointerOffset` needs, and the only place that per-corner sign mapping
 * lives. `baseRadius` (the corner's radius when the drag started) is added on top so the result is
 * an absolute distance from the box's true geometric corner, not a delta from the start radius —
 * matching `cornerRadiusFromPointerOffset`'s own "absolute offset from the corner" contract. */
function cornerOffsetFromDelta(corner: Corner, dx: number, dy: number, baseRadius: number): { dxFromCorner: number; dyFromCorner: number } {
  const xSign = corner === "topLeft" || corner === "bottomLeft" ? 1 : -1;
  const ySign = corner === "topLeft" || corner === "topRight" ? 1 : -1;
  return { dxFromCorner: baseRadius + xSign * dx, dyFromCorner: baseRadius + ySign * dy };
}

function radiusAtCorner(corner: Corner, cornerRadii: CornerRadiusValue | undefined, cornerRadius: number | undefined): number {
  return cornerRadii ? cornerRadii[corner] : (cornerRadius ?? 0);
}

interface CanvasWysiwygShellProps {
  /** Node id — only used to look up responsive-class conflicts for the padding/corner handles below. */
  id: string;
  label: ReactNode;
  /** toReactStyle(computeSectionBox(...)) — the block's real padding/fill/border/cornerRadius/shadow/width, applied directly to this component's single root element. */
  computedStyle: CSSProperties;
  isSelected: boolean;
  isDragging: boolean;
  isOver: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  onSelect: () => void;
  /** { transform, transition } from dnd-kit, merged into this component's own `effectiveStyle`. */
  positionStyle: CSSProperties;
  /** Raw (pre-computed-box-model) values — the padding/corner-radius drag handles edit these
   * directly and commit through `onPaddingChange`/`onCornerRadiusChange`, independent of whatever
   * `computedStyle` already resolved them to. */
  padding: ContainerPadding;
  cornerRadius?: number;
  cornerRadii?: CornerRadiusValue;
  onPaddingChange: (padding: ContainerPadding) => void;
  onCornerRadiusChange: (patch: { cornerRadius?: number; cornerRadii?: CornerRadiusValue }) => void;
  children: ReactNode;
}

/**
 * WYSIWYG counterpart to `CanvasBlockShell` — used by `CanvasSectionBox` and, since
 * canva-plan-v2.md Stage 2 gave `RowBlock` the same fill/border/cornerRadius/shadow fields as
 * `SectionBlock`, by `CanvasRowBox` too. The root element carries the block's REAL computed box
 * style (padding/fill/border/cornerRadius/shadow/width) instead of a fixed schematic placeholder,
 * so children render inset by the container's actual padding.
 *
 * The selection ring and the grip/label/lock-toggle chrome are `position: absolute` children of
 * that same root element rather than a separate box, deliberately — an absolutely positioned
 * descendant's `inset`/`top` offsets resolve against the root's padding edge regardless of the
 * root's own padding value, so the chrome can sit outside the visible box (`-top-6`) and the ring
 * can trace its edges (`inset-0`, `border-radius: inherit`) without either fighting the section's
 * real padding/border/radius the way nesting them inside a separately-padded wrapper would.
 *
 * No remove button lives in this chrome strip — that duplicated `SelectionToolbar`'s own
 * duplicate/remove pair (centered above the selected block), and on Section specifically it sat
 * right next to the corner-radius lock toggle with no breathing room, cramping both. Deletion goes
 * through `SelectionToolbar` exclusively now; this component no longer takes an `onRemove` prop.
 *
 * `marginTop: SECTION_TOP_RESERVE_PX` (inline, not a `mt-6` class) reserves the headroom the
 * `-top-6` chrome needs above it. This has to be an inline style, not a Tailwind class:
 * `CanvasRootDropZone`'s `space-y-3` compiles to `.space-y-3 > :not([hidden]) ~ :not([hidden])`,
 * whose specificity beats a plain `.mt-6` class for every non-first sibling — confirmed live, a
 * `mt-6` class was silently overridden back down to `space-y-3`'s 12px on every Section but the
 * first. An inline style always wins the cascade regardless of a parent's utility classes.
 *
 * The reserve is `CHROME_OFFSET_PX + CHROME_CLEARANCE_PX`, not just the chrome's own -24px offset
 * — an earlier version used exactly 24px here, which left zero clearance: the first top-level
 * Section's chrome was clipped by the scroll container's own padding, and a Section stacked right
 * below another had its chrome overlapping the box above it (both confirmed live). Bumping the
 * reserve by `CHROME_CLEARANCE_PX` fixes both without special-casing "first child" vs. "stacked" —
 * the one accepted side effect is a Section nested directly inside another Section's flex-gap
 * child list gets `gapPx + SECTION_TOP_RESERVE_PX` instead of `gapPx + CHROME_OFFSET_PX` (margin
 * adds to flex `gap` there, unlike `space-y-3`'s override semantics) — a few extra px, not worth a
 * parent-kind branch for.
 *
 * Padding-edge (4) and corner-radius (1 locked / 4 unlocked) drag handles — canva-plan-v1.md Stage
 * 4 — render only when `isSelected`, to keep unselected sections visually quiet on a canvas that
 * may hold many. Every handle previews locally (`paddingPreview`/`cornerRadiusPreview` state,
 * overlaid on top of `computedStyle` for this render only) and commits through the
 * `onPaddingChange`/`onCornerRadiusChange` props on `onDragEnd` — same commit-on-release
 * discipline as the Stage 1/2 handles (column divider, gap), so a drag doesn't spam undo history
 * with one step per pointermove frame.
 */
export const CanvasWysiwygShell = memo(function CanvasWysiwygShell({
  id,
  label,
  computedStyle,
  isSelected,
  isDragging,
  isOver,
  setNodeRef,
  attributes,
  listeners,
  onSelect,
  positionStyle,
  padding,
  cornerRadius,
  cornerRadii,
  onPaddingChange,
  onCornerRadiusChange,
  children,
}: CanvasWysiwygShellProps) {
  const ringState = isSelected ? "selected" : isOver ? "over" : "idle";
  const ringClass = isSelected ? "border-primary" : isOver ? "border-primary/50 bg-primary/5" : "border-dashed border-border/60 hover:border-border";

  const isLocked = cornerRadii === undefined;
  const [paddingPreview, setPaddingPreview] = useState<ContainerPadding | null>(null);
  const [cornerRadiusPreview, setCornerRadiusPreview] = useState<number | CornerRadiusValue | null>(null);
  const paddingBaseRef = useRef(padding);
  const cornerBaseRef = useRef(0);

  const conflictTop = useResponsiveConflict(id, "padding-top");
  const conflictRight = useResponsiveConflict(id, "padding-right");
  const conflictBottom = useResponsiveConflict(id, "padding-bottom");
  const conflictLeft = useResponsiveConflict(id, "padding-left");
  const conflictRadius = useResponsiveConflict(id, "border-radius");

  // Named `useEdgeDrag`/`useCornerDrag` (not `edgeDrag`/`cornerDrag`) specifically so
  // eslint-plugin-react-hooks recognizes them as custom hooks and validates the `usePointerDrag`
  // call inside them — they're still called unconditionally, in the same fixed order, the same
  // number of times on every render (that's what the rule actually requires; nothing about it
  // depends on a hook being declared at module scope instead of inline in the parent component).
  // Snaps the dragged edge's value to the shared spacing scale plus the CURRENT opposite edge's
  // value (symmetric-padding snap, e.g. dragging top toward matching bottom) — `paddingBaseRef`
  // holds the pre-drag padding, so the opposite edge's value is stable for the whole gesture (only
  // the edge actually being dragged changes). Deliberately NOT also snapping to the parent
  // container's padding (canva-plan-v2.md Stage 3's plan floated this) — that needs a new
  // "parent padding" prop threaded down from CanvasSectionBox/CanvasRowBox for a refinement neither
  // consumer currently needs; trimmed to keep this change scoped to what the drag handle itself
  // already knows.
  function snapPaddingEdge(edge: Edge, raw: ContainerPadding): ContainerPadding {
    const candidates = [...SPACING_SNAP_STEPS_PX, paddingBaseRef.current[OPPOSITE_EDGE[edge]]];
    return { ...raw, [edge]: snapToNearest(raw[edge], candidates).value };
  }

  function useEdgeDrag(edge: Edge, axis: "dx" | "dy") {
    return usePointerDrag({
      cursor: axis === "dx" ? "ew-resize" : "ns-resize",
      onDragStart: () => {
        paddingBaseRef.current = padding;
      },
      onDrag: (delta) => setPaddingPreview(snapPaddingEdge(edge, paddingAfterEdgeDrag(paddingBaseRef.current, edge, delta[axis]))),
      onDragEnd: (delta) => {
        onPaddingChange(snapPaddingEdge(edge, paddingAfterEdgeDrag(paddingBaseRef.current, edge, delta[axis])));
        setPaddingPreview(null);
      },
    });
  }

  // Live preview value for `edge` is EXACTLY one of the snap candidates when a snap is in effect
  // (snapToNearest returns the candidate itself, not an approximation) — so membership-checking
  // the already-computed preview is enough to derive "is this edge currently snapped" for the
  // handle highlight below, with no separate snapped-state bookkeeping needed.
  function isPaddingEdgeSnapped(edge: Edge): boolean {
    if (paddingPreview === null) return false;
    const candidates = [...SPACING_SNAP_STEPS_PX, paddingBaseRef.current[OPPOSITE_EDGE[edge]]];
    return candidates.includes(paddingPreview[edge]);
  }
  const topDrag = useEdgeDrag("top", "dy");
  const rightDrag = useEdgeDrag("right", "dx");
  const bottomDrag = useEdgeDrag("bottom", "dy");
  const leftDrag = useEdgeDrag("left", "dx");

  function useCornerDrag(corner: Corner) {
    return usePointerDrag({
      cursor: CORNER_CURSOR[corner],
      onDragStart: () => {
        cornerBaseRef.current = radiusAtCorner(corner, cornerRadii, cornerRadius);
      },
      onDrag: ({ dx, dy }) => {
        const { dxFromCorner, dyFromCorner } = cornerOffsetFromDelta(corner, dx, dy, cornerBaseRef.current);
        const raw = cornerRadiusFromPointerOffset(dxFromCorner, dyFromCorner, MAX_CORNER_RADIUS);
        const r = snapToNearest(raw, CORNER_RADIUS_SNAP_STEPS_PX).value;
        setCornerRadiusPreview(isLocked ? r : { ...(cornerRadii ?? ZERO_CORNER_RADII), [corner]: r });
      },
      onDragEnd: ({ dx, dy }) => {
        const { dxFromCorner, dyFromCorner } = cornerOffsetFromDelta(corner, dx, dy, cornerBaseRef.current);
        const raw = cornerRadiusFromPointerOffset(dxFromCorner, dyFromCorner, MAX_CORNER_RADIUS);
        const r = snapToNearest(raw, CORNER_RADIUS_SNAP_STEPS_PX).value;
        if (isLocked) onCornerRadiusChange({ cornerRadius: r, cornerRadii: undefined });
        else onCornerRadiusChange({ cornerRadius, cornerRadii: { ...(cornerRadii ?? ZERO_CORNER_RADII), [corner]: r } });
        setCornerRadiusPreview(null);
      },
    });
  }
  const topLeftDrag = useCornerDrag("topLeft");
  const topRightDrag = useCornerDrag("topRight");
  const bottomRightDrag = useCornerDrag("bottomRight");
  const bottomLeftDrag = useCornerDrag("bottomLeft");
  const cornerHandles: Record<Corner, typeof topLeftDrag> = { topLeft: topLeftDrag, topRight: topRightDrag, bottomRight: bottomRightDrag, bottomLeft: bottomLeftDrag };

  function cornerRadiusPreviewValue(corner: Corner): number | null {
    if (cornerRadiusPreview === null) return null;
    return typeof cornerRadiusPreview === "number" ? cornerRadiusPreview : cornerRadiusPreview[corner];
  }

  // Same "the live preview IS the snap candidate when snapped" trick as isPaddingEdgeSnapped.
  function isCornerRadiusSnapped(corner: Corner): boolean {
    const value = cornerRadiusPreviewValue(corner);
    return value !== null && CORNER_RADIUS_SNAP_STEPS_PX.includes(value);
  }

  const effectiveStyle: CSSProperties = {
    ...computedStyle,
    ...(paddingPreview
      ? { paddingTop: paddingPreview.top, paddingRight: paddingPreview.right, paddingBottom: paddingPreview.bottom, paddingLeft: paddingPreview.left }
      : {}),
    ...(cornerRadiusPreview !== null ? { borderRadius: formatCornerRadiusReactValue(cornerRadiusPreview) } : {}),
    ...positionStyle,
    marginTop: SECTION_TOP_RESERVE_PX,
    opacity: isDragging ? 0.4 : 1,
  };

  const cornersToRender: Corner[] = isLocked ? ["topRight"] : ["topLeft", "topRight", "bottomRight", "bottomLeft"];

  return (
    <div
      ref={setNodeRef}
      data-testid='wysiwyg-box'
      style={effectiveStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className='relative min-h-12 cursor-pointer transition-colors'>
      <div
        data-testid='wysiwyg-ring'
        data-state={ringState}
        style={{ borderRadius: effectiveStyle.borderRadius }}
        className={`pointer-events-none absolute inset-0 border-2 transition-colors ${ringClass}`}
      />
      <div className='pointer-events-none absolute -top-6 left-0 right-0 flex items-center justify-between text-xs font-semibold text-muted-foreground'>
        <div className='pointer-events-auto flex items-center gap-2'>
          <button type='button' {...attributes} {...listeners} className='cursor-grab hover:text-foreground' aria-label='Drag to reorder'>
            <GripVertical size={14} />
          </button>
          {label}
        </div>
        <div className='pointer-events-auto flex items-center gap-2'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onCornerRadiusChange(toggleCornerRadiusLock(cornerRadius, cornerRadii));
            }}
            className='hover:text-foreground'
            aria-label={isLocked ? "Unlock corner radius (edit each corner independently)" : "Lock corner radius (all corners follow one value)"}
            title={isLocked ? "Corner radius: locked (uniform)" : "Corner radius: unlocked (per-corner)"}>
            {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>
      </div>

      {isSelected && (
        <>
          <div
            {...topDrag.handlers}
            role='separator'
            aria-orientation='horizontal'
            aria-label='Resize top padding'
            title={conflictTop ? "This edge also has a responsive padding-top override that may take precedence on smaller viewports" : undefined}
            className={`absolute -top-1 left-3 right-3 h-2 cursor-ns-resize rounded transition-colors ${
              topDrag.isDragging ? (isPaddingEdgeSnapped("top") ? "bg-emerald-400" : "bg-primary/60") : conflictTop ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}>
            {/* Below the handle (into the box), not above — the floating SelectionToolbar (portaled,
                z-50) always sits directly above the box and paints over anything placed there;
                confirmed live via elementFromPoint at the badge's own coordinates. */}
            {topDrag.isDragging && paddingPreview && (
              <span className={`${snapBadgeClassName(isPaddingEdgeSnapped("top"))} top-full left-1/2 mt-1 -translate-x-1/2`}>{paddingPreview.top}px</span>
            )}
          </div>
          <div
            {...rightDrag.handlers}
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize right padding'
            title={conflictRight ? "This edge also has a responsive padding-right override that may take precedence on smaller viewports" : undefined}
            className={`absolute -right-1 top-3 bottom-3 w-2 cursor-ew-resize rounded transition-colors ${
              rightDrag.isDragging ? (isPaddingEdgeSnapped("right") ? "bg-emerald-400" : "bg-primary/60") : conflictRight ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}>
            {rightDrag.isDragging && paddingPreview && (
              <span className={`${snapBadgeClassName(isPaddingEdgeSnapped("right"))} left-full top-1/2 ml-1 -translate-y-1/2`}>{paddingPreview.right}px</span>
            )}
          </div>
          <div
            {...bottomDrag.handlers}
            role='separator'
            aria-orientation='horizontal'
            aria-label='Resize bottom padding'
            title={conflictBottom ? "This edge also has a responsive padding-bottom override that may take precedence on smaller viewports" : undefined}
            className={`absolute -bottom-1 left-3 right-3 h-2 cursor-ns-resize rounded transition-colors ${
              bottomDrag.isDragging ? (isPaddingEdgeSnapped("bottom") ? "bg-emerald-400" : "bg-primary/60") : conflictBottom ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}>
            {bottomDrag.isDragging && paddingPreview && (
              <span className={`${snapBadgeClassName(isPaddingEdgeSnapped("bottom"))} top-full left-1/2 mt-1 -translate-x-1/2`}>{paddingPreview.bottom}px</span>
            )}
          </div>
          <div
            {...leftDrag.handlers}
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize left padding'
            title={conflictLeft ? "This edge also has a responsive padding-left override that may take precedence on smaller viewports" : undefined}
            className={`absolute -left-1 top-3 bottom-3 w-2 cursor-ew-resize rounded transition-colors ${
              leftDrag.isDragging ? (isPaddingEdgeSnapped("left") ? "bg-emerald-400" : "bg-primary/60") : conflictLeft ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}>
            {leftDrag.isDragging && paddingPreview && (
              <span className={`${snapBadgeClassName(isPaddingEdgeSnapped("left"))} right-full top-1/2 mr-1 -translate-y-1/2`}>{paddingPreview.left}px</span>
            )}
          </div>

          {cornersToRender.map((corner) => {
            const isLeftCorner = corner === "topLeft" || corner === "bottomLeft";
            const radiusValue = cornerRadiusPreviewValue(corner);
            return (
              <div
                key={corner}
                {...cornerHandles[corner].handlers}
                role='button'
                tabIndex={-1}
                aria-label={isLocked ? "Resize corner radius" : `Resize ${corner} corner radius`}
                title={conflictRadius ? "This section also has a responsive border-radius override that may take precedence on smaller viewports" : undefined}
                style={{ cursor: CORNER_CURSOR[corner] }}
                className={`absolute h-2.5 w-2.5 rounded-full border-2 border-background transition-colors ${CORNER_POSITION_CLASS[corner]} ${
                  cornerHandles[corner].isDragging
                    ? isCornerRadiusSnapped(corner)
                      ? "bg-emerald-400"
                      : "bg-primary"
                    : conflictRadius
                      ? "bg-amber-400"
                      : "bg-primary/60 hover:bg-primary"
                }`}>
                {cornerHandles[corner].isDragging && radiusValue !== null && (
                  // Always below the handle (never above, regardless of top/bottom corner) — the
                  // floating SelectionToolbar (portaled, z-50) always sits directly above the box,
                  // so a badge placed above it would render but be visually painted over/hidden
                  // (confirmed live: elementFromPoint at the badge's own coordinates resolved to
                  // the toolbar, not the badge, even though the badge's own computed style/DOM
                  // presence looked perfectly normal).
                  <span className={`${snapBadgeClassName(isCornerRadiusSnapped(corner))} top-full mt-1 ${isLeftCorner ? "left-0" : "right-0"}`}>{radiusValue}px</span>
                )}
              </div>
            );
          })}
        </>
      )}

      {children}
    </div>
  );
});
