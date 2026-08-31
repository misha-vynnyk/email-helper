/**
 * Left context panel for the active tool — sits between the icon rail
 * (EditorToolbar) and the canvas (EditorStage), mirroring the icon-rail +
 * settings-panel layout of dedicated design tools. Replaces the strip of
 * controls that used to live stacked below the canvas: Wand's Contiguous/Global
 * toggle and tolerance slider, and Eraser's mode/brush size and the
 * replace-mode picker (both via BackgroundOptions) live here now, so the
 * canvas itself stays uncluttered.
 *
 * Deliberately narrow (w-48, not w-56) and without a Wand<->Eraser shortcut
 * button — the icon rail already switches tools in one click, so a second
 * shortcut for the same action was reviewed as redundant complexity.
 */

import { BackgroundOperation, BackgroundReplaceMode, InstantAlphaPick } from "../types";
import BackgroundOptions from "./BackgroundOptions";
import { EditorTool } from "./EditorStage";

const TOOL_LABELS: Record<EditorTool, string> = {
  crop: "Crop",
  wand: "Wand",
  eraser: "Eraser",
};

interface EditorSidePanelProps {
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

export default function EditorSidePanel({
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
}: EditorSidePanelProps) {
  const hasOperations = operations.length > 0;

  return (
    <div className='w-48 shrink-0 flex flex-col gap-3'>
      <div className='text-xs font-bold text-foreground uppercase tracking-wide'>{TOOL_LABELS[tool]}</div>

      {tool === "crop" && <p className='text-[11px] text-muted-foreground'>Drag the frame or its handles to crop.</p>}

      {tool === "wand" && (
        <div className='flex flex-col gap-1.5'>
          <div className='flex gap-1.5'>
            {(
              [
                { value: true, label: "Contiguous" },
                { value: false, label: "Global" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => onContiguousModeChange(value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${contiguousMode === value ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
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
                  onChange={(e) => onPendingPickChange({ ...pendingPick, tolerance: Number(e.target.value) })}
                  className='flex-1 accent-primary'
                />
                <span className='shrink-0 tabular-nums w-9 text-right'>{Math.round(pendingPick.tolerance)}%</span>
              </label>
              <p className='text-[11px] text-muted-foreground'>
                Press <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>⌫ Backspace</kbd> to remove,{" "}
                <kbd className='px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>Esc</kbd> to cancel
              </p>
            </>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              {contiguousMode ? "Click the background, drag outward to grow the selection." : "Click a color — every matching pixel in the image is selected, gradients fade smoothly."}
            </p>
          )}
        </div>
      )}

      {tool === "eraser" && <p className='text-[11px] text-muted-foreground'>Paint to erase or restore.</p>}

      {isGif && tool !== "crop" && <p className='text-[11px] text-muted-foreground'>Applied the same way to every frame of the GIF.</p>}

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

      {tool !== "crop" && hasOperations && (
        <button onClick={onUndoLast} className='self-start text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'>
          Undo last (⌘Z)
        </button>
      )}
    </div>
  );
}
