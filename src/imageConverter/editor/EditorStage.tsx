/**
 * The single interactive image surface shared by all three edit tools (Crop, Wand,
 * Eraser). Previously Crop and Background lived on separate tabs, each swapping in
 * its own canvas/img element — this merges them into one persistent stage so a crop
 * rect and a background edit can both be reviewed (and built up) without navigating
 * away from either.
 *
 * Renders at native resolution on a <canvas> (needed for pixel-accurate Wand/Eraser
 * painting and an accurate background-removal preview) with the crop-rect overlay
 * drawn on top:
 * - `tool === "crop"`: the rect is interactive (move + 8 resize handles), dimmed
 *   outside its bounds. The canvas underneath still shows the baked background edit,
 *   so cropping happens against the same pixels the final export will have.
 * - `tool === "wand" | "eraser"`: the canvas takes pointer input for painting: the
 *   crop rect (if not full-image) renders as a read-only dashed outline so its bounds
 *   stay visible without competing for input.
 *
 * Background painting logic (OKLab wand flood-fill + eraser brush + keyboard commit/
 * undo) is unchanged from the former InstantAlphaCanvas; crop-rect math/handles are
 * unchanged from the former CropCanvas — see cropMath.ts and bgRemoval/instantAlpha.ts.
 *
 * Renders ONLY the canvas + crop overlay — the Wand/Eraser controls that used to sit
 * in a strip below the canvas (Contiguous/Global, tolerance, replace-mode, undo, the
 * Wand<->Eraser quick-swap) now live in the sibling EditorSidePanel to its left, so
 * `pendingPick`/`contiguousMode` are controlled props from the parent (ImageEditorModal)
 * instead of local state — the panel needs to read and mutate them too (e.g. the
 * tolerance slider), not just this canvas's own pointer handlers.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { BackgroundOperation, BrushStroke, CropRect, InstantAlphaPick, InstantAlphaSeed } from "../types";
import { computeColorRangeMaskFromOklab, computeInstantAlphaMaskFromOklab, DEFAULT_TOLERANCE, OklabBuffers, precomputeOklab } from "./bgRemoval/instantAlpha";
import { paintStroke, unionMasks } from "./bgRemoval/maskOps";
import { computeMaskFromOperations } from "./bgRemoval/replayOperations";
import { CHECKERBOARD_STYLE } from "./checkerboardStyle";
import { clampRect, CropHandle, isFullRect, moveRect, resizeRectByHandle } from "./cropMath";
import { usePointerDrag } from "./usePointerDrag";

export type EditorTool = "crop" | "wand" | "eraser";

interface EditorStageProps {
  imageUrl: string;
  tool: EditorTool;
  rect: CropRect;
  onRectChange: (rect: CropRect) => void;
  operations: BackgroundOperation[];
  eraserMode: "erase" | "restore";
  brushRadius: number;
  onCommit: (operation: BackgroundOperation) => void;
  onUndoLast: () => void;
  /** Persists across picks/tool switches (Photoshop's "Contiguous" checkbox) —
   * lifted to the parent (EditorSidePanel owns the toggle UI) since this canvas
   * only needs to read it, not change it. */
  contiguousMode: boolean;
  /** The in-progress, not-yet-committed wand pick. Lifted to the parent (rather than
   * local state) so EditorSidePanel's tolerance slider can edit it, and so Apply can
   * fold it into the operation log even if the user never pressed Backspace — see
   * ImageEditorModal's handleApply/resolveEffectiveBackground. */
  pendingPick: InstantAlphaPick | null;
  onPendingPickChange: (pick: InstantAlphaPick | null) => void;
}

const SAFETY_MAX_DIMENSION = 2400;
const TOLERANCE_PER_PIXEL = 0.6;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function ResizeHandle({
  handle,
  left,
  top,
  cursor,
  rect,
  onChange,
  boxRef,
}: {
  handle: CropHandle;
  left: string;
  top: string;
  cursor: string;
  rect: CropRect;
  onChange: (r: CropRect) => void;
  boxRef: React.RefObject<HTMLElement>;
}) {
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

export default function EditorStage({
  imageUrl,
  tool,
  rect,
  onRectChange,
  operations,
  eraserMode,
  brushRadius,
  onCommit,
  onUndoLast,
  contiguousMode,
  pendingPick,
  onPendingPickChange,
}: EditorStageProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const oklabRef = useRef<OklabBuffers | null>(null);
  const committedMaskRef = useRef<Uint8ClampedArray | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  const activeWandDragRef = useRef<{ seed: InstantAlphaSeed; startClientX: number; startClientY: number; tolerance: number } | null>(null);
  const strokePointsRef = useRef<InstantAlphaSeed[]>([]);
  const rafScheduledRef = useRef(false);
  const rectBaselineRef = useRef(rect);
  const pendingPickRef = useRef(pendingPick);
  pendingPickRef.current = pendingPick;
  const prevToolRef = useRef(tool);
  // Read via ref, not a reactive dependency: onCommit (ImageEditorModal's
  // handleCommitOperation) is a fresh function identity on every parent render,
  // not just on real tool changes. Depending on it directly re-ran the effect below
  // on every pendingPick update too (pendingPick change → onPendingPickChange →
  // parent re-render → new onCommit) — its unconditional trailing setPendingPick(null)
  // was wiping out a pick the instant pointerUp set it.
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    const committed = committedMaskRef.current;
    const oklab = oklabRef.current;
    if (!canvas || !original || !committed || !oklab) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let displayMask: Uint8ClampedArray = committed;

    if (tool === "wand") {
      const live = activeWandDragRef.current ?? pendingPick;
      if (live) {
        const seedX = clamp(Math.round(live.seed.x * canvas.width), 0, canvas.width - 1);
        const seedY = clamp(Math.round(live.seed.y * canvas.height), 0, canvas.height - 1);
        const pendingMask = contiguousMode
          ? computeInstantAlphaMaskFromOklab(oklab, canvas.width, canvas.height, seedX, seedY, live.tolerance)
          : computeColorRangeMaskFromOklab(oklab, canvas.width, canvas.height, seedX, seedY, live.tolerance);
        displayMask = unionMasks([committed, pendingMask]);
      }
    } else if (tool === "eraser" && strokePointsRef.current.length > 0) {
      displayMask = paintStroke(committed, canvas.width, canvas.height, {
        type: "stroke",
        points: strokePointsRef.current,
        radius: brushRadius,
        mode: eraserMode,
      });
    }

    const preview = new Uint8ClampedArray(original.data);
    for (let p = 0; p < displayMask.length; p++) preview[p * 4 + 3] = displayMask[p];
    ctx.putImageData(new ImageData(preview, canvas.width, canvas.height), 0, 0);
  }, [tool, pendingPick, eraserMode, brushRadius, contiguousMode]);

  const scheduleDraw = useCallback(() => {
    if (rafScheduledRef.current) return;
    rafScheduledRef.current = true;
    requestAnimationFrame(() => {
      rafScheduledRef.current = false;
      draw();
    });
  }, [draw]);

  // Load the image once per URL, at native resolution (capped only for extreme
  // sizes), and precompute OKLab once so per-frame drag recompute stays cheap.
  useEffect(() => {
    let cancelled = false;
    setImageReady(false);
    onPendingPickChange(null);
    zoomRef.current = 1;
    setZoom(1);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, SAFETY_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      originalImageDataRef.current = imageData;
      oklabRef.current = precomputeOklab(imageData.data, canvas.width * canvas.height);
      setImageReady(true);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // Rebuild the committed baseline whenever the operation log changes (i.e. on
  // every commit/undo) — this is the O(width×height) replay, deliberately not
  // run on every drag frame. Reuses the OKLab buffer precomputed once per image
  // load (oklabRef) instead of recomputing it here.
  useEffect(() => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    const oklab = oklabRef.current;
    if (!imageReady || !canvas || !original || !oklab) return;
    committedMaskRef.current = computeMaskFromOperations(oklab, canvas.width, canvas.height, operations);
    draw();
  }, [imageReady, operations, draw]);

  // Slider-driven (or any other state-level) pendingPick changes redraw too —
  // raw pointer-drag frames instead go through the ref+rAF path above.
  useEffect(() => {
    if (imageReady) draw();
  }, [imageReady, pendingPick, draw]);

  // Auto-commit an in-progress pick when leaving the Wand tool, instead of discarding
  // it — switching to Eraser to touch up the very selection you just made used to
  // silently wipe the live preview (same failure mode Apply had before its own
  // auto-commit fix — see ImageEditorModal's resolveEffectiveBackground). Compares
  // against the tool the LAST run of this effect saw, so it only fires on an actual
  // wand→other transition, never on mount or on unrelated re-renders.
  useEffect(() => {
    if (prevToolRef.current === "wand" && tool !== "wand" && pendingPickRef.current) {
      onCommitRef.current(pendingPickRef.current);
    }
    prevToolRef.current = tool;
    onPendingPickChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // Keep a pending pick's stored mode in sync if the Contiguous/Global toggle changes
  // while it's still uncommitted, so Backspace commits whatever the toggle currently shows.
  useEffect(() => {
    if (pendingPickRef.current) onPendingPickChange({ ...pendingPickRef.current, contiguous: contiguousMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contiguousMode]);

  // Backspace/Delete commits the pending wand pick; Escape discards it.
  useEffect(() => {
    if (tool !== "wand" || !pendingPick) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onCommit(pendingPick);
        onPendingPickChange(null);
      } else if (e.key === "Escape") {
        onPendingPickChange(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tool, pendingPick, onCommit, onPendingPickChange]);

  // Ctrl/Cmd+Z undoes the last committed background operation, wand or eraser.
  useEffect(() => {
    if (tool === "crop") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndoLast();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tool, onUndoLast]);

  // Ctrl/Cmd+wheel zooms toward the cursor — the same gesture browsers report for
  // trackpad pinch-to-zoom (ctrlKey is set synthetically), so both work identically.
  // Plain wheel/two-finger scroll pans via the viewport's native overflow-auto
  // scrolling, no code needed. A native (non-React) listener is required: React
  // attaches its synthetic wheel handler as passive for scroll perf, so
  // preventDefault() inside a normal onWheel prop silently no-ops.
  useEffect(() => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container) return;
    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const oldZoom = zoomRef.current;
      // A regular mouse wheel notch reports deltaY ≈ ±100; a trackpad pinch reports
      // many small deltas in quick succession. This coefficient is tuned so one
      // notch is a modest ~15-20% step, not the ~170% jump a larger coefficient
      // produced — that jump was the "jerky" zoom, not a frame-timing issue.
      const newZoom = clamp(oldZoom * Math.exp(-e.deltaY * 0.002), 1, 5);
      if (newZoom === oldZoom) return;
      const rect = viewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const contentX = (viewport.scrollLeft + cursorX) / oldZoom;
      const contentY = (viewport.scrollTop + cursorY) / oldZoom;

      // Apply the new scale AND the compensating scroll offset synchronously, in
      // this same event handler — mutate the DOM directly rather than going through
      // React state first. Deferring the scroll fix to a later paint (e.g. a
      // requestAnimationFrame callback, or waiting for React's own re-render, both
      // of which land on a later frame than the style write) let the scaled image
      // visibly jump for one frame on every wheel tick, which is what read as
      // jittery/stuttery zoom. React's later re-render (triggered by setZoom below)
      // just reconciles to the same transform value — a harmless no-op paint.
      container.style.transform = `scale(${newZoom})`;
      viewport.scrollLeft = contentX * newZoom - cursorX;
      viewport.scrollTop = contentY * newZoom - cursorY;

      zoomRef.current = newZoom;
      setZoom(newZoom);
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  // Escape hatch back to 100% — no extra button, just the conventional
  // double-click-to-reset-zoom gesture (Figma, Google Maps, Photos, ...).
  const handleDoubleClick = () => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container || zoomRef.current === 1) return;
    container.style.transform = "scale(1)";
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
    zoomRef.current = 1;
    setZoom(1);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;
    canvas.setPointerCapture(e.pointerId);
    const box = canvas.getBoundingClientRect();
    const seed: InstantAlphaSeed = { x: clamp((e.clientX - box.left) / box.width, 0, 1), y: clamp((e.clientY - box.top) / box.height, 0, 1) };

    if (tool === "wand") {
      activeWandDragRef.current = { seed, startClientX: e.clientX, startClientY: e.clientY, tolerance: DEFAULT_TOLERANCE };
      onPendingPickChange({ type: "pick", seed, tolerance: DEFAULT_TOLERANCE, contiguous: contiguousMode });
    } else {
      strokePointsRef.current = [seed];
    }
    scheduleDraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tool === "wand") {
      const active = activeWandDragRef.current;
      if (!active) return;
      const distance = Math.hypot(e.clientX - active.startClientX, e.clientY - active.startClientY);
      active.tolerance = clamp(DEFAULT_TOLERANCE + distance * TOLERANCE_PER_PIXEL, 0, 100);
      scheduleDraw();
    } else {
      if (strokePointsRef.current.length === 0) return;
      const box = canvas.getBoundingClientRect();
      strokePointsRef.current.push({ x: clamp((e.clientX - box.left) / box.width, 0, 1), y: clamp((e.clientY - box.top) / box.height, 0, 1) });
      scheduleDraw();
    }
  };

  const handlePointerUp = () => {
    if (tool === "wand") {
      const active = activeWandDragRef.current;
      if (active) onPendingPickChange({ type: "pick", seed: active.seed, tolerance: active.tolerance, contiguous: contiguousMode });
      activeWandDragRef.current = null;
    } else if (strokePointsRef.current.length > 0) {
      const stroke: BrushStroke = { type: "stroke", points: strokePointsRef.current, radius: brushRadius, mode: eraserMode };
      strokePointsRef.current = [];
      onCommit(stroke);
    }
  };

  const { handlers: moveHandlers } = usePointerDrag({
    cursor: "grabbing",
    onDragStart: () => {
      rectBaselineRef.current = rect;
    },
    onDrag: (delta) => {
      const box = containerRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onRectChange(moveRect(rectBaselineRef.current, delta.dx / width, delta.dy / height));
    },
    onDragEnd: (delta) => {
      const box = containerRef.current;
      if (!box) return;
      const { width, height } = box.getBoundingClientRect();
      onRectChange(moveRect(rectBaselineRef.current, delta.dx / width, delta.dy / height));
    },
  });

  const safeRect = clampRect(rect);
  const maskClass = "absolute bg-slate-950/55";
  const isCropTool = tool === "crop";

  return (
    <div className='flex flex-col items-center w-full'>
      {/* The zoom badge below is a sibling of this scrolling element, not a child of
       * it — a child positioned absolute still scrolls along with the rest of the
       * content (its containing block's padding box doesn't stay pinned to the
       * visible frame the way `position: fixed` would), so it would drift off its
       * bottom-right corner as soon as a zoom recentered the scroll position. Being
       * outside the scroll container entirely sidesteps that. */}
      <div className='relative w-full'>
      <div ref={viewportRef} className='relative w-full max-h-[52vh] overflow-auto rounded-lg text-center' onDoubleClick={handleDoubleClick}>
        <div ref={containerRef} className='relative inline-block max-w-full select-none' style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          <canvas
            ref={canvasRef}
            onPointerDown={isCropTool ? undefined : handlePointerDown}
            onPointerMove={isCropTool ? undefined : handlePointerMove}
            onPointerUp={isCropTool ? undefined : handlePointerUp}
            onPointerCancel={isCropTool ? undefined : handlePointerUp}
            className='block max-w-full max-h-[52vh] rounded-lg touch-none'
            style={{ cursor: isCropTool ? "default" : "crosshair", ...CHECKERBOARD_STYLE }}
          />

        {isCropTool ? (
          <>
            {/* Darkening mask around the crop rect — non-interactive and separately clipped to
             * the canvas's rounded corners, so it never competes with (or clips) the handles
             * below. A single box-shadow trick would need `overflow-hidden` on the same layer
             * as the handles, which cuts them off whenever the rect touches an edge (the
             * default full-image rect). */}
            <div className='absolute inset-0 overflow-hidden rounded-lg pointer-events-none'>
              <div className={maskClass} style={{ left: 0, right: 0, top: 0, height: `${safeRect.y * 100}%` }} />
              <div className={maskClass} style={{ left: 0, right: 0, bottom: 0, top: `${(safeRect.y + safeRect.height) * 100}%` }} />
              <div className={maskClass} style={{ left: 0, top: `${safeRect.y * 100}%`, width: `${safeRect.x * 100}%`, height: `${safeRect.height * 100}%` }} />
              <div
                className={maskClass}
                style={{ right: 0, top: `${safeRect.y * 100}%`, left: `${(safeRect.x + safeRect.width) * 100}%`, height: `${safeRect.height * 100}%` }}
              />
            </div>

            {/* Interactive layer — deliberately not clipped, so handles stay fully hit-testable
             * even when the rect (and therefore a handle's center) sits flush on a canvas edge. */}
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
                  <ResizeHandle key={handle} handle={handle} left={left} top={top} cursor={cursor} rect={safeRect} onChange={onRectChange} boxRef={containerRef} />
                ))}
              </div>
            </div>
          </>
        ) : (
          !isFullRect(rect) && (
            <div
              className='absolute pointer-events-none border-2 border-dashed border-white/80 rounded-[2px]'
              style={{
                left: `${safeRect.x * 100}%`,
                top: `${safeRect.y * 100}%`,
                width: `${safeRect.width * 100}%`,
                height: `${safeRect.height * 100}%`,
              }}
            />
          )
        )}
        </div>
      </div>

      {zoom !== 1 && (
        <div className='pointer-events-none absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/70 text-white text-[10px] font-medium tabular-nums'>
          {Math.round(zoom * 100)}%
        </div>
      )}
      </div>
    </div>
  );
}
