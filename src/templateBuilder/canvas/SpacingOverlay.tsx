import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import { updateSectionStyle } from "../state/builderStore";
import { getNodeRect } from "./nodeRectRegistry";
import { gapAfterDrag } from "./resizeMath";
import { usePointerDrag } from "./usePointerDrag";

interface SpacingOverlayProps {
  sectionId: string;
  /** NodeDropZone's own div — the actual `position: relative` ancestor these handles are absolutely
   * positioned against. Deliberately NOT looked up via nodeRectRegistry (that registry only covers
   * the outer CanvasBlockShell box and the children, whose rects are used below — not this inner
   * div, which sits offset from the shell's top by its header/padding). */
  containerRef: RefObject<HTMLDivElement>;
  childIds: string[];
  /** The currently-effective gap (committed value, or the live drag preview one level up in
   * CanvasSectionBox) — used both to position the handles and, via `onPreview`, as the drag's
   * starting point. */
  gapPx: number;
  onPreview: (px: number | null) => void;
}

interface GapHandlePosition {
  /** id of the child immediately ABOVE this gap — unique per gap, used as the React key. */
  aboveChildId: string;
  top: number;
}

/** One drag handle per gap between adjacent children of a Section, positioned over the actual
 * flex `gap` NodeDropZone renders. There's no per-pair gap in the data model — `SectionBlock.gapPx`
 * is a single value for the whole section — so every handle drags the SAME value; dragging any one
 * of them moves them all together, which is the correct outcome, not a bug.
 *
 * Child positions come from `getNodeRect` (nodeRectRegistry.ts, already populated for every direct
 * child — leaf/ready-made chips via CanvasChipShell, nested Section/Row via CanvasBlockShell).
 * Both that and `containerRef`'s own `getBoundingClientRect()` are read in the same frame, so a
 * page scroll shifts both by the same amount and cancels out of the `top - containerTop`
 * difference. No portal (unlike SelectionToolbar): these handles never need to escape the
 * section's own box. */
export function SpacingOverlay({ sectionId, containerRef, childIds, gapPx, onPreview }: SpacingOverlayProps) {
  const [positions, setPositions] = useState<GapHandlePosition[]>([]);
  const baseGapRef = useRef(gapPx);

  const recompute = () => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    // Each interior child is read once here and reused for both of its adjacent gaps (it's the
    // BELOW child of one gap and the ABOVE child of the next) — not re-fetched per gap, since
    // `getNodeRect` is deliberately uncached (nodeRectRegistry.ts) and this runs on every resize/
    // gap-drag frame.
    const rects = childIds.map(getNodeRect);
    const next: GapHandlePosition[] = [];
    for (let i = 0; i < rects.length - 1; i++) {
      const a = rects[i];
      const b = rects[i + 1];
      // Skipped, not zero-filled, when a rect isn't registered yet (e.g. a child's very first
      // render) — an explicit gap in `next` would misalign it with `childIds` by index.
      if (a && b) next.push({ aboveChildId: childIds[i], top: (a.bottom + b.top) / 2 - containerRect.top });
    }
    setPositions(next);
  };

  // Always points at the CURRENT recompute closure (assigned on every render, no effect needed
  // for the assignment itself) — the ResizeObserver below installs its callback exactly once
  // (mount-only effect) and must never call a closure captured from that first render, or it
  // would keep reading whatever `childIds` existed at mount forever, silently going stale for any
  // section whose children changed since (added/removed child, live gap-drag preview, etc.).
  const recomputeRef = useRef(recompute);
  recomputeRef.current = recompute;

  // Deliberately scoped to [childIds, gapPx] — NOT run unconditionally on every render. `gapPx`
  // already reflects the live drag preview (CanvasSectionBox round-trips `onPreview`'s value
  // straight back down through this same prop), so this recomputes exactly when the rendered
  // layout could have actually changed. An unconditional `useLayoutEffect(recompute)` looks
  // tempting (nodeRectRegistry's own "no caching, recompute every call" convention) but is wrong
  // here specifically because `recompute` unconditionally calls `setPositions` — with no deps
  // array, every render schedules another `setPositions`, which schedules another render, forever
  // ("Maximum update depth exceeded", caught live via headless Chrome the moment a 2nd child made
  // childIds.length > 1 true for the first time).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(recompute, [childIds, gapPx]);

  // Catches everything the [childIds, gapPx] effect above can't: a child growing/shrinking from
  // its OWN content changing (text edit, image finishing load, font swap) with no change to the
  // section's own child list or gap. A plain `window.resize` listener does NOT fire for this —
  // ResizeObserver on the actual drop-zone element does, since it reports on the observed
  // element's own layout box changing for any reason, not just the viewport resizing.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => recomputeRef.current());
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isDragging, handlers } = usePointerDrag({
    cursor: "ns-resize",
    onDragStart: () => {
      baseGapRef.current = gapPx;
    },
    onDrag: ({ dy }) => onPreview(gapAfterDrag(baseGapRef.current, dy)),
    onDragEnd: ({ dy }) => {
      updateSectionStyle(sectionId, { gapPx: gapAfterDrag(baseGapRef.current, dy) });
      onPreview(null);
    },
  });

  return (
    <>
      {positions.map(({ aboveChildId, top }) => (
        <div
          key={aboveChildId}
          {...handlers}
          role='separator'
          aria-orientation='horizontal'
          aria-label='Resize gap'
          style={{ top }}
          className={`group/gap absolute left-1.5 right-1.5 -mt-2 flex h-4 cursor-ns-resize items-center justify-center transition-opacity ${
            isDragging ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}>
          <div className={`h-0.5 w-full rounded-full ${isDragging ? "bg-primary" : "bg-primary/40 group-hover/gap:bg-primary/60"}`} />
          {isDragging && <span className='absolute rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm border border-border'>{Math.round(gapPx)}px</span>}
        </div>
      ))}
    </>
  );
}
