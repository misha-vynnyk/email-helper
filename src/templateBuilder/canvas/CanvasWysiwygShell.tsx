import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical, Lock, Trash2, Unlock } from "lucide-react";
import { type CSSProperties, memo, type ReactNode,useRef, useState } from "react";

import { useResponsiveConflict } from "../state/responsiveConflict";
import { formatCornerRadiusReactValue } from "../styling/sectionBoxStyle";
import { type ContainerPadding, type CornerRadiusValue,toggleCornerRadiusLock } from "../types";
import { cornerRadiusFromPointerOffset, paddingAfterEdgeDrag } from "./resizeMath";
import { usePointerDrag } from "./usePointerDrag";

type Edge = "top" | "right" | "bottom" | "left";
type Corner = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

const MAX_CORNER_RADIUS = 200;
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
  onRemove: () => void;
  removeAriaLabel: string;
  /** { transform, transition } from dnd-kit — same object CanvasBlockShell's `style` prop carries. */
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
 * WYSIWYG counterpart to `CanvasBlockShell`, for Section only: the root element carries the
 * block's REAL computed box style (padding/fill/border/cornerRadius/shadow/width) instead of a
 * fixed schematic placeholder, so children render inset by the section's actual padding.
 *
 * The selection ring and the grip/label/remove chrome are `position: absolute` children of that
 * same root element rather than a separate box, deliberately — an absolutely positioned
 * descendant's `inset`/`top` offsets resolve against the root's padding edge regardless of the
 * root's own padding value, so the chrome can sit outside the visible box (`-top-6`) and the ring
 * can trace its edges (`inset-0`, `border-radius: inherit`) without either fighting the section's
 * real padding/border/radius the way nesting them inside a separately-padded wrapper would.
 *
 * `marginTop: 24` (inline, not a `mt-6` class) reserves the headroom the `-top-6` chrome needs
 * above it — without it, the first top-level Section's chrome is clipped by the scroll
 * container's own padding, and a Section stacked right below another has its chrome overlapping
 * the box above it (both confirmed live). This has to be an inline style, not a Tailwind class:
 * `CanvasRootDropZone`'s `space-y-3` compiles to `.space-y-3 > :not([hidden]) ~ :not([hidden])`,
 * whose specificity beats a plain `.mt-6` class for every non-first sibling — confirmed live, a
 * `mt-6` class was silently overridden back down to `space-y-3`'s 12px on every Section but the
 * first. An inline style always wins the cascade regardless of a parent's utility classes.
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
  onRemove,
  removeAriaLabel,
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
  function useEdgeDrag(edge: Edge, axis: "dx" | "dy") {
    return usePointerDrag({
      cursor: axis === "dx" ? "ew-resize" : "ns-resize",
      onDragStart: () => {
        paddingBaseRef.current = padding;
      },
      onDrag: (delta) => setPaddingPreview(paddingAfterEdgeDrag(paddingBaseRef.current, edge, delta[axis])),
      onDragEnd: (delta) => {
        onPaddingChange(paddingAfterEdgeDrag(paddingBaseRef.current, edge, delta[axis]));
        setPaddingPreview(null);
      },
    });
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
        const r = cornerRadiusFromPointerOffset(dxFromCorner, dyFromCorner, MAX_CORNER_RADIUS);
        setCornerRadiusPreview(isLocked ? r : { ...(cornerRadii ?? ZERO_CORNER_RADII), [corner]: r });
      },
      onDragEnd: ({ dx, dy }) => {
        const { dxFromCorner, dyFromCorner } = cornerOffsetFromDelta(corner, dx, dy, cornerBaseRef.current);
        const r = cornerRadiusFromPointerOffset(dxFromCorner, dyFromCorner, MAX_CORNER_RADIUS);
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

  const effectiveStyle: CSSProperties = {
    ...computedStyle,
    ...(paddingPreview
      ? { paddingTop: paddingPreview.top, paddingRight: paddingPreview.right, paddingBottom: paddingPreview.bottom, paddingLeft: paddingPreview.left }
      : {}),
    ...(cornerRadiusPreview !== null ? { borderRadius: formatCornerRadiusReactValue(cornerRadiusPreview) } : {}),
    ...positionStyle,
    marginTop: 24,
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
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className='text-muted-foreground hover:text-destructive'
            aria-label={removeAriaLabel}>
            <Trash2 size={14} />
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
              topDrag.isDragging ? "bg-primary/60" : conflictTop ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}
          />
          <div
            {...rightDrag.handlers}
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize right padding'
            title={conflictRight ? "This edge also has a responsive padding-right override that may take precedence on smaller viewports" : undefined}
            className={`absolute -right-1 top-3 bottom-3 w-2 cursor-ew-resize rounded transition-colors ${
              rightDrag.isDragging ? "bg-primary/60" : conflictRight ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}
          />
          <div
            {...bottomDrag.handlers}
            role='separator'
            aria-orientation='horizontal'
            aria-label='Resize bottom padding'
            title={conflictBottom ? "This edge also has a responsive padding-bottom override that may take precedence on smaller viewports" : undefined}
            className={`absolute -bottom-1 left-3 right-3 h-2 cursor-ns-resize rounded transition-colors ${
              bottomDrag.isDragging ? "bg-primary/60" : conflictBottom ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}
          />
          <div
            {...leftDrag.handlers}
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize left padding'
            title={conflictLeft ? "This edge also has a responsive padding-left override that may take precedence on smaller viewports" : undefined}
            className={`absolute -left-1 top-3 bottom-3 w-2 cursor-ew-resize rounded transition-colors ${
              leftDrag.isDragging ? "bg-primary/60" : conflictLeft ? "bg-amber-400/50 hover:bg-amber-400/70" : "hover:bg-primary/30"
            }`}
          />

          {cornersToRender.map((corner) => (
            <div
              key={corner}
              {...cornerHandles[corner].handlers}
              role='button'
              tabIndex={-1}
              aria-label={isLocked ? "Resize corner radius" : `Resize ${corner} corner radius`}
              title={conflictRadius ? "This section also has a responsive border-radius override that may take precedence on smaller viewports" : undefined}
              style={{ cursor: CORNER_CURSOR[corner] }}
              className={`absolute h-2.5 w-2.5 rounded-full border-2 border-background transition-colors ${CORNER_POSITION_CLASS[corner]} ${
                cornerHandles[corner].isDragging ? "bg-primary" : conflictRadius ? "bg-amber-400" : "bg-primary/60 hover:bg-primary"
              }`}
            />
          ))}
        </>
      )}

      {children}
    </div>
  );
});
