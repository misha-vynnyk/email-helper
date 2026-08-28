/**
 * Interactive crop-rect overlay over an image. The wrapper is `inline-block` around a
 * `block` <img>, so the wrapper's box exactly matches the image's rendered bounds (no
 * object-fit letterboxing to account for) — pointer deltas in that box can be divided
 * directly by the box's client width/height to get normalized (0–1) crop-rect deltas.
 */

import { useRef } from "react";

import { CropHandle, clampRect, moveRect, resizeRectByHandle } from "./cropMath";
import { CropRect } from "../types";
import { usePointerDrag } from "./usePointerDrag";

interface CropCanvasProps {
  imageUrl: string;
  rect: CropRect;
  onChange: (rect: CropRect) => void;
}

const HANDLES: { handle: CropHandle; left: string; top: string; cursor: string }[] = [
  { handle: "nw", left: "0%", top: "0%", cursor: "nwse-resize" },
  { handle: "n", left: "50%", top: "0%", cursor: "ns-resize" },
  { handle: "ne", left: "100%", top: "0%", cursor: "nesw-resize" },
  { handle: "w", left: "0%", top: "50%", cursor: "ew-resize" },
  { handle: "e", left: "100%", top: "50%", cursor: "ew-resize" },
  { handle: "sw", left: "0%", top: "100%", cursor: "nesw-resize" },
  { handle: "s", left: "50%", top: "100%", cursor: "ns-resize" },
  { handle: "se", left: "100%", top: "100%", cursor: "nwse-resize" },
];

function ResizeHandle({ handle, left, top, cursor, rect, onChange, boxRef }: { handle: CropHandle; left: string; top: string; cursor: string; rect: CropRect; onChange: (r: CropRect) => void; boxRef: React.RefObject<HTMLElement> }) {
  const baselineRef = useRef(rect);

  const { handlers } = usePointerDrag({
    cursor,
    onDragStart: () => {
      baselineRef.current = rect;
    },
    onDrag: (delta) => {
      const box = boxRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onChange(resizeRectByHandle(baselineRef.current, handle, delta.dx / width, delta.dy / height));
    },
    onDragEnd: (delta) => {
      const box = boxRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onChange(resizeRectByHandle(baselineRef.current, handle, delta.dx / width, delta.dy / height));
    },
  });

  return (
    <div
      {...handlers}
      style={{ left, top, cursor, transform: "translate(-50%, -50%)" }}
      className='absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-sm touch-none'
    />
  );
}

export default function CropCanvas({ imageUrl, rect, onChange }: CropCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baselineRef = useRef(rect);

  const { handlers: moveHandlers } = usePointerDrag({
    cursor: "grabbing",
    onDragStart: () => {
      baselineRef.current = rect;
    },
    onDrag: (delta) => {
      const box = containerRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onChange(moveRect(baselineRef.current, delta.dx / width, delta.dy / height));
    },
    onDragEnd: (delta) => {
      const box = containerRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onChange(moveRect(baselineRef.current, delta.dx / width, delta.dy / height));
    },
  });

  const safeRect = clampRect(rect);
  const maskClass = "absolute bg-slate-950/55";

  return (
    <div ref={containerRef} className='relative inline-block max-w-full select-none'>
      <img src={imageUrl} alt='' draggable={false} className='block max-w-full max-h-[55vh] rounded-lg' />

      {/* Darkening mask around the crop rect — non-interactive and separately clipped to the
       * image's rounded corners, so it never competes with (or clips) the handles below. A
       * single box-shadow trick would need `overflow-hidden` on the same layer as the handles,
       * which cuts them off whenever the rect touches an edge (the default full-image rect). */}
      <div className='absolute inset-0 overflow-hidden rounded-lg pointer-events-none'>
        <div className={maskClass} style={{ left: 0, right: 0, top: 0, height: `${safeRect.y * 100}%` }} />
        <div className={maskClass} style={{ left: 0, right: 0, bottom: 0, top: `${(safeRect.y + safeRect.height) * 100}%` }} />
        <div className={maskClass} style={{ left: 0, top: `${safeRect.y * 100}%`, width: `${safeRect.x * 100}%`, height: `${safeRect.height * 100}%` }} />
        <div className={maskClass} style={{ right: 0, top: `${safeRect.y * 100}%`, left: `${(safeRect.x + safeRect.width) * 100}%`, height: `${safeRect.height * 100}%` }} />
      </div>

      {/* Interactive layer — deliberately not clipped, so handles stay fully hit-testable
       * even when the rect (and therefore a handle's center) sits flush on an image edge. */}
      <div className='absolute inset-0'>
        <div
          {...moveHandlers}
          style={{
            left: `${safeRect.x * 100}%`,
            top: `${safeRect.y * 100}%`,
            width: `${safeRect.width * 100}%`,
            height: `${safeRect.height * 100}%`,
          }}
          className='absolute border-2 border-white/90 cursor-grab touch-none'
        >
          {HANDLES.map(({ handle, left, top, cursor }) => (
            <ResizeHandle key={handle} handle={handle} left={left} top={top} cursor={cursor} rect={safeRect} onChange={onChange} boxRef={containerRef} />
          ))}
        </div>
      </div>
    </div>
  );
}
