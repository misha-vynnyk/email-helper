import { useRef, useState } from "react";

export interface PointerDragOptions {
  cursor: string;
  onDragStart?: () => void;
  onDrag: (delta: { dx: number; dy: number }) => void;
  onDragEnd: (delta: { dx: number; dy: number }) => void;
}

export interface PointerDragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

/** One shared drag gesture for every canvas resize handle (column divider now; padding/corner
 * handles in a later stage) — Pointer Events + `setPointerCapture` instead of the `document`-level
 * mousemove/mouseup pattern `src/blockLibrary/ResizablePreview.tsx` uses: pointer capture routes
 * every event for this pointer id to the capturing element regardless of where the cursor
 * physically is, so it keeps working even if the pointer leaves the element (or the window)
 * mid-drag, with no separate document listeners to attach/detach. All four returned handlers must
 * be spread onto the SAME element that calls `setPointerCapture` in `onPointerDown` — that's what
 * pointer capture requires.
 *
 * `onDrag`/`onDragEnd` both receive the cumulative delta from the pointerdown origin, not a
 * per-move delta — callers doing incremental math (e.g. column-width percent) work off a
 * `onDragStart`-captured baseline plus this cumulative delta, not by accumulating deltas
 * themselves.
 *
 * `onPointerCancel` is treated the same as `onPointerUp` (commits at the last known delta) rather
 * than aborting — a true abort would need a way to tell the caller "revert your local preview"
 * with no corresponding store write, and a preview left desynced from the store until some
 * unrelated re-render is a worse failure mode than "committed wherever the pointer last was".
 * Revisit if `pointercancel` starts firing often in practice (e.g. once touch input is a target). */
export function usePointerDrag({ cursor, onDragStart, onDrag, onDragEnd }: PointerDragOptions): { isDragging: boolean; handlers: PointerDragHandlers } {
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const delta = (e: React.PointerEvent) => {
    const start = startRef.current;
    return start ? { dx: e.clientX - start.x, dy: e.clientY - start.y } : { dx: 0, dy: 0 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
    onDragStart?.();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    onDrag(delta(e));
  };

  const end = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const finalDelta = delta(e);
    e.currentTarget.releasePointerCapture(e.pointerId);
    startRef.current = null;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    onDragEnd(finalDelta);
  };

  return { isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}
