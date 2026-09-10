/**
 * Options bar for the active tool — a full-width horizontal strip above the
 * canvas, only mounted while Wand or Eraser is the active tool (Crop and Slice
 * need no controls beyond direct canvas interaction).
 *
 * Was a floating popover anchored to the icon rail before this — reviewed live
 * and rejected: it overlapped the image itself (right where Wand/Eraser need to
 * see pixels to pick a color or paint a stroke), which a "don't reserve
 * permanent space" win didn't make up for. A bar that pushes the canvas down
 * instead of floating over it keeps the same "only takes space when relevant"
 * property without ever covering the thing you're editing.
 *
 * Deliberately without a Wand<->Eraser shortcut button — the icon rail already
 * switches tools in one click, so a second shortcut for the same action was
 * reviewed as redundant complexity.
 */

import { BackgroundOperation, BackgroundReplaceMode, InstantAlphaPick } from "../types";
import BackgroundOptions from "./BackgroundOptions";
import { EditorTool } from "./EditorStage";

const TOOL_LABELS: Record<EditorTool, string> = {
  crop: "Crop",
  slice: "Slice",
  wand: "Wand",
  eraser: "Eraser",
};

interface EditorToolOptionsBarProps {
  tool: EditorTool;
  contiguousMode: boolean;
  onContiguousModeChange: (value: boolean) => void;
  pendingPick: InstantAlphaPick | null;
  onPendingPickChange: (pick: InstantAlphaPick | null) => void;
  operations: BackgroundOperation[];
  onUndoLast: () => void;
  eraserMode: "erase" | "restore";
  onEraserModeChange: (mode: "erase" | "restore") => void;
  brushRadius: number;
  onBrushRadiusChange: (radius: number) => void;
  replaceMode: BackgroundReplaceMode;
  onReplaceModeChange: (mode: BackgroundReplaceMode) => void;
  replaceColor?: string;
  onReplaceColorChange: (hex: string) => void;
  replaceImageUrl?: string;
  onReplaceImageFile: (file: File | undefined) => void;
  isGif: boolean;
}

export default function EditorToolOptionsBar({
  tool,
  contiguousMode,
  onContiguousModeChange,
  pendingPick,
  onPendingPickChange,
  operations,
  onUndoLast,
  eraserMode,
  onEraserModeChange,
  brushRadius,
  onBrushRadiusChange,
  replaceMode,
  onReplaceModeChange,
  replaceColor,
  onReplaceColorChange,
  replaceImageUrl,
  onReplaceImageFile,
  isGif,
}: EditorToolOptionsBarProps) {
  const hasOperations = operations.length > 0;

  return (
    <div className='w-full flex flex-wrap items-center gap-x-4 gap-y-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 px-4 py-2.5'>
      <span className='text-xs font-bold text-foreground uppercase tracking-wide shrink-0'>{TOOL_LABELS[tool]}</span>

      {tool === "wand" && (
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex gap-1.5 shrink-0'>
            {(
              [
                { value: true, label: "Contiguous" },
                { value: false, label: "Global" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => onContiguousModeChange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${contiguousMode === value ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {pendingPick ? (
            <>
              <label className='flex items-center gap-2 text-xs text-muted-foreground shrink-0 w-48'>
                <span className='shrink-0'>{contiguousMode ? "Tolerance" : "Fuzziness"}</span>
                <input
                  type='range'
                  min={0}
                  max={100}
                  step={0.5}
                  value={pendingPick.tolerance}
                  onChange={(e) => onPendingPickChange({ ...pendingPick, tolerance: Number(e.target.value) })}
                  className='flex-1 accent-primary'
                />
                <span className='shrink-0 tabular-nums w-9 text-right'>{Math.round(pendingPick.tolerance)}%</span>
              </label>
              <p className='text-[11px] text-muted-foreground shrink-0'>
                <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>⌫</kbd> remove ·{" "}
                <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>Esc</kbd> cancel
              </p>
            </>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              {contiguousMode ? "Click the background, drag outward to grow the selection." : "Click a color — every matching pixel in the image is selected, gradients fade smoothly."}
            </p>
          )}
        </div>
      )}

      {tool === "eraser" && <span className='text-[11px] text-muted-foreground shrink-0'>Paint to erase or restore.</span>}

      {isGif && <span className='text-[11px] text-muted-foreground shrink-0'>Applied the same way to every frame of the GIF.</span>}

      <div className='flex-1 min-w-2' />

      <BackgroundOptions
        tool={tool}
        hasOperations={hasOperations}
        eraserMode={eraserMode}
        onEraserModeChange={onEraserModeChange}
        brushRadius={brushRadius}
        onBrushRadiusChange={onBrushRadiusChange}
        replaceMode={replaceMode}
        onReplaceModeChange={onReplaceModeChange}
        replaceColor={replaceColor}
        onReplaceColorChange={onReplaceColorChange}
        replaceImageUrl={replaceImageUrl}
        onReplaceImageFile={onReplaceImageFile}
      />

      {hasOperations && (
        <button onClick={onUndoLast} className='shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'>
          Undo last (⌘Z)
        </button>
      )}
    </div>
  );
}
