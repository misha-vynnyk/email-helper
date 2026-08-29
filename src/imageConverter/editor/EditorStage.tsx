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
 */

import { Eraser, Wand2 } from "lucide-react";
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
  onToolChange: (tool: EditorTool) => void;
  rect: CropRect;
  onRectChange: (rect: CropRect) => void;
  operations: BackgroundOperation[];
  eraserMode: "erase" | "restore";
  brushRadius: number;
  onCommit: (operation: BackgroundOperation) => void;
  onUndoLast: () => void;
  isGif?: boolean;
  /** Mirrors the in-progress wand pick up to the parent, so Apply can fold it into
   * the operation log even if the user never pressed Backspace to commit it — see
   * ImageEditorModal's handleApply. */
  onPendingPickChange?: (pick: InstantAlphaPick | null) => void;
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
  onToolChange,
  rect,
  onRectChange,
  operations,
  eraserMode,
  brushRadius,
  onCommit,
  onUndoLast,
  isGif,
  onPendingPickChange,
}: EditorStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const oklabRef = useRef<OklabBuffers | null>(null);
  const committedMaskRef = useRef<Uint8ClampedArray | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [pendingPick, setPendingPick] = useState<InstantAlphaPick | null>(null);
  // Photoshop/Photopea calls this the "Contiguous" checkbox on the Magic Wand —
  // unchecked, a click selects every matching-color pixel in the image (Color
  // Range), not just the flood-filled region touching the seed. Persists across
  // picks/tool switches like brushRadius does, since it's a mode, not per-pick state.
  const [contiguousMode, setContiguousMode] = useState(true);

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
    setPendingPick(null);
  }, [tool]);

  useEffect(() => {
    onPendingPickChange?.(pendingPick);
  }, [pendingPick, onPendingPickChange]);

  // Keep a pending pick's stored mode in sync if the Contiguous/Global toggle changes
  // while it's still uncommitted, so Backspace commits whatever the toggle currently shows.
  useEffect(() => {
    setPendingPick((prev) => (prev ? { ...prev, contiguous: contiguousMode } : prev));
  }, [contiguousMode]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;
    canvas.setPointerCapture(e.pointerId);
    const box = canvas.getBoundingClientRect();
    const seed: InstantAlphaSeed = { x: clamp((e.clientX - box.left) / box.width, 0, 1), y: clamp((e.clientY - box.top) / box.height, 0, 1) };

    if (tool === "wand") {
      activeWandDragRef.current = { seed, startClientX: e.clientX, startClientY: e.clientY, tolerance: DEFAULT_TOLERANCE };
      setPendingPick({ type: "pick", seed, tolerance: DEFAULT_TOLERANCE, contiguous: contiguousMode });
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
      if (active) setPendingPick({ type: "pick", seed: active.seed, tolerance: active.tolerance, contiguous: contiguousMode });
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
    <div className='flex flex-col items-center gap-2 w-full'>
      <div ref={containerRef} className='relative inline-block max-w-full select-none'>
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

      {(tool === "wand" || tool === "eraser") && (
        // Quick round-trip between Wand and Eraser without reaching for the main
        // toolbar — press to hop into the other tool, do the touch-up, press again
        // to hop back. Just a shortcut onto the same `activeTool` state the toolbar
        // already controls, so nothing about the underlying tool switch changes —
        // the auto-commit-on-switch fix above still applies here too.
        <button
          onClick={() => onToolChange(tool === "wand" ? "eraser" : "wand")}
          className='flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700'
        >
          {tool === "wand" ? (
            <>
              <Eraser size={12} />
              Quick erase
            </>
          ) : (
            <>
              <Wand2 size={12} />
              Back to Wand
            </>
          )}
        </button>
      )}

      {tool === "wand" && (
        <div className='w-full max-w-sm flex flex-col gap-1.5'>
          <div className='flex gap-1.5'>
            {([
              { value: true, label: "Contiguous" },
              { value: false, label: "Global (Color Range)" },
            ] as const).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setContiguousMode(value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  contiguousMode === value ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {pendingPick ? (
            <>
              <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span className='shrink-0'>{contiguousMode ? "Tolerance" : "Fuzziness"}</span>
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
            </>
          ) : (
            <p className='text-[11px] text-muted-foreground text-center'>
              {contiguousMode ? "Click the background, drag outward to grow the selection" : "Click a color — every matching pixel in the image is selected, gradients fade smoothly"}
            </p>
          )}
        </div>
      )}

      {tool === "eraser" && <p className='text-[11px] text-muted-foreground'>Paint to erase or restore</p>}

      {isGif && tool !== "crop" && <p className='text-[11px] text-muted-foreground'>Applied the same way to every frame of the GIF.</p>}

      {tool !== "crop" && operations.length > 0 && (
        <button onClick={onUndoLast} className='text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'>
          Undo last (⌘Z)
        </button>
      )}
    </div>
  );
}
