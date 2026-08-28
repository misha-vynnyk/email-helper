/**
 * Two-tool interactive surface for background editing:
 *
 * - Wand: click a background pixel, drag outward to grow the color-tolerance
 *   selection live. Releasing the pointer FREEZES it as a pending pick — it is
 *   only committed (added to the operation log) on Backspace/Delete, or discarded
 *   on Escape / starting a new pick elsewhere. This mirrors Photoshop/GIMP's
 *   marquee-then-delete flow instead of committing destructively on mouse-up.
 * - Eraser: paints directly onto the accumulated mask (erase or restore), for
 *   touching up spots the wand missed or wrongly removed. A brush stroke has no
 *   ambiguity to review, so it commits immediately on pointer-up.
 *
 * Renders at native resolution (only downscaled above SAFETY_MAX_DIMENSION) so the
 * live preview matches the final bake pixel-for-pixel — the earlier fixed 800px
 * proxy made the selection look coarser while dragging than the final result.
 * OKLab is precomputed once per loaded image (see instantAlpha.ts) so recomputing
 * the wand's mask on every drag frame doesn't redo that conversion each time.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { BackgroundOperation, BrushStroke, InstantAlphaPick, InstantAlphaSeed } from "../types";
import { computeInstantAlphaMaskFromOklab, DEFAULT_TOLERANCE, OklabBuffers, precomputeOklab } from "./bgRemoval/instantAlpha";
import { paintStroke, unionMasks } from "./bgRemoval/maskOps";
import { computeMaskFromOperations } from "./bgRemoval/replayOperations";

export type BackgroundTool = "wand" | "eraser";

interface InstantAlphaCanvasProps {
  imageUrl: string;
  operations: BackgroundOperation[];
  tool: BackgroundTool;
  eraserMode: "erase" | "restore";
  brushRadius: number; // normalized 0-1, relative to image width
  onCommit: (operation: BackgroundOperation) => void;
  onUndoLast: () => void;
}

const SAFETY_MAX_DIMENSION = 2400;
const TOLERANCE_PER_PIXEL = 0.6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

export default function InstantAlphaCanvas({ imageUrl, operations, tool, eraserMode, brushRadius, onCommit, onUndoLast }: InstantAlphaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const oklabRef = useRef<OklabBuffers | null>(null);
  const committedMaskRef = useRef<Uint8ClampedArray | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [pendingPick, setPendingPick] = useState<InstantAlphaPick | null>(null);

  const activeWandDragRef = useRef<{ seed: InstantAlphaSeed; startClientX: number; startClientY: number; tolerance: number } | null>(null);
  const strokePointsRef = useRef<InstantAlphaSeed[]>([]);
  const rafScheduledRef = useRef(false);

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
        const pendingMask = computeInstantAlphaMaskFromOklab(oklab, canvas.width, canvas.height, seedX, seedY, live.tolerance);
        displayMask = unionMasks([committed, pendingMask]);
      }
    } else if (strokePointsRef.current.length > 0) {
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
  }, [tool, pendingPick, eraserMode, brushRadius]);

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
    setPendingPick(null);
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
  // run on every drag frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!imageReady || !canvas || !original) return;
    committedMaskRef.current = computeMaskFromOperations(original.data, canvas.width, canvas.height, operations);
    draw();
  }, [imageReady, operations, draw]);

  // Slider-driven (or any other state-level) pendingPick changes redraw too —
  // raw pointer-drag frames instead go through the ref+rAF path above.
  useEffect(() => {
    if (imageReady) draw();
  }, [imageReady, pendingPick, draw]);

  // Discard an in-progress pick when switching tools.
  useEffect(() => {
    setPendingPick(null);
  }, [tool]);

  // Backspace/Delete commits the pending wand pick; Escape discards it.
  useEffect(() => {
    if (tool !== "wand" || !pendingPick) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onCommit(pendingPick);
        setPendingPick(null);
      } else if (e.key === "Escape") {
        setPendingPick(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tool, pendingPick, onCommit]);

  // Ctrl/Cmd+Z undoes the last committed operation, wand or eraser.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndoLast();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndoLast]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const seed: InstantAlphaSeed = { x: clamp((e.clientX - rect.left) / rect.width, 0, 1), y: clamp((e.clientY - rect.top) / rect.height, 0, 1) };

    if (tool === "wand") {
      activeWandDragRef.current = { seed, startClientX: e.clientX, startClientY: e.clientY, tolerance: DEFAULT_TOLERANCE };
      setPendingPick({ type: "pick", seed, tolerance: DEFAULT_TOLERANCE });
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
      const rect = canvas.getBoundingClientRect();
      strokePointsRef.current.push({ x: clamp((e.clientX - rect.left) / rect.width, 0, 1), y: clamp((e.clientY - rect.top) / rect.height, 0, 1) });
      scheduleDraw();
    }
  };

  const handlePointerUp = () => {
    if (tool === "wand") {
      const active = activeWandDragRef.current;
      if (active) setPendingPick({ type: "pick", seed: active.seed, tolerance: active.tolerance });
      activeWandDragRef.current = null;
    } else if (strokePointsRef.current.length > 0) {
      const stroke: BrushStroke = { type: "stroke", points: strokePointsRef.current, radius: brushRadius, mode: eraserMode };
      strokePointsRef.current = [];
      onCommit(stroke);
    }
  };

  return (
    <div className='flex flex-col items-center gap-2 w-full'>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className='max-w-full max-h-[45vh] rounded-lg cursor-crosshair touch-none'
        style={{
          backgroundImage:
            "linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        }}
      />

      {tool === "wand" && pendingPick ? (
        <div className='w-full max-w-sm flex flex-col gap-1.5'>
          <label className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span className='shrink-0'>Tolerance</span>
            <input
              type='range'
              min={0}
              max={100}
              step={0.5}
              value={pendingPick.tolerance}
              onChange={(e) => setPendingPick((prev) => (prev ? { ...prev, tolerance: Number(e.target.value) } : prev))}
              className='flex-1 accent-primary'
            />
            <span className='shrink-0 tabular-nums w-9 text-right'>{Math.round(pendingPick.tolerance)}%</span>
          </label>
          <p className='text-[11px] text-muted-foreground text-center'>
            Press <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>⌫ Backspace</kbd> to remove,{" "}
            <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>Esc</kbd> to cancel
          </p>
        </div>
      ) : (
        <p className='text-[11px] text-muted-foreground'>
          {tool === "wand" ? "Click the background, drag outward to grow the selection" : "Paint to erase or restore"}
        </p>
      )}

      {operations.length > 0 && (
        <button onClick={onUndoLast} className='text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'>
          Undo last (⌘Z)
        </button>
      )}
    </div>
  );
}
