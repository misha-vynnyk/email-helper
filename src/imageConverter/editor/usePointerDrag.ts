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

/** One shared drag gesture for every crop-rect handle and the move-whole-rect gesture —
 * Pointer Events + `setPointerCapture` so the gesture keeps working even if the pointer
 * leaves the handle (or the window) mid-drag, with no document-level listeners to
 * attach/detach. All four returned handlers must be spread onto the SAME element that
 * calls `setPointerCapture` in `onPointerDown`.
 *
 * `onDrag`/`onDragEnd` both receive the cumulative delta from the pointerdown origin, not
 * a per-move delta — callers apply it against a baseline rect captured in `onDragStart`,
 * not by accumulating deltas themselves. */
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
