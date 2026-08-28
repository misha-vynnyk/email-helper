/**
 * Background-removal controls: toggle + Wand/Eraser sub-tools + replace-mode
 * picker (transparent / solid color / another image). Lives in ImageEditorModal,
 * static images only for now — GIF background removal is Phase 4.
 */

import { Eraser, ImageOff, Palette, Image as ImageIcon, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BackgroundEditState, BackgroundOperation, BackgroundReplaceMode } from "../types";
import InstantAlphaCanvas, { BackgroundTool } from "./InstantAlphaCanvas";

interface BackgroundPanelProps {
  imageUrl: string;
  value: BackgroundEditState | undefined;
  onChange: (value: BackgroundEditState | undefined) => void;
}

const DEFAULT_STATE: BackgroundEditState = { removed: false, operations: [], replaceMode: "transparent" };
const DEFAULT_BRUSH_RADIUS = 0.03;

const REPLACE_MODES: { mode: BackgroundReplaceMode; label: string; icon: typeof ImageOff }[] = [
  { mode: "transparent", label: "Transparent", icon: ImageOff },
  { mode: "color", label: "Color", icon: Palette },
  { mode: "image", label: "Image", icon: ImageIcon },
];

export default function BackgroundPanel({ imageUrl, value, onChange }: BackgroundPanelProps) {
  const state = value ?? DEFAULT_STATE;
  const bgImageUrlRef = useRef(state.replaceImageUrl);

  const [tool, setTool] = useState<BackgroundTool>("wand");
  const [eraserMode, setEraserMode] = useState<"erase" | "restore">("erase");
  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_RADIUS);

  // Only the true unmount case needs cleanup here — replacement cleanup happens
  // inline in handleImageFile, right before the old URL is discarded.
  useEffect(() => () => {
    if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
  }, []);

  const update = (patch: Partial<BackgroundEditState>) => onChange({ ...state, ...patch });

  const handleToggle = () => update({ removed: !state.removed });

  const handleModeChange = (mode: BackgroundReplaceMode) => update({ replaceMode: mode });

  const handleCommit = (operation: BackgroundOperation) => update({ operations: [...state.operations, operation] });

  const handleUndoLast = () => update({ operations: state.operations.slice(0, -1) });

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    if (bgImageUrlRef.current) URL.revokeObjectURL(bgImageUrlRef.current);
    const url = URL.createObjectURL(file);
    bgImageUrlRef.current = url;
    update({ replaceImageUrl: url });
  };

  return (
    <div className='w-full flex flex-col gap-3'>
      <label className='flex items-center justify-between cursor-pointer w-full max-w-sm mx-auto'>
        <span className='text-sm font-semibold text-foreground'>Remove background</span>
        <input type='checkbox' checked={state.removed} onChange={handleToggle} className='w-4 h-4 accent-primary' />
      </label>

      {state.removed && (
        <>
          <div className='flex gap-1.5 w-full max-w-sm mx-auto'>
            <button
              onClick={() => setTool("wand")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tool === "wand" ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wand2 size={13} />
              Wand
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tool === "eraser" ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eraser size={13} />
              Eraser
            </button>
          </div>

          {tool === "eraser" && (
            <div className='w-full max-w-sm mx-auto flex flex-col gap-2'>
              <div className='flex gap-1.5'>
                {(["erase", "restore"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setEraserMode(mode)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      eraserMode === mode ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span className='shrink-0'>Brush size</span>
                <input
                  type='range'
                  min={0.005}
                  max={0.1}
                  step={0.005}
                  value={brushRadius}
                  onChange={(e) => setBrushRadius(Number(e.target.value))}
                  className='flex-1 accent-primary'
                />
              </label>
            </div>
          )}

          <InstantAlphaCanvas
            imageUrl={imageUrl}
            operations={state.operations}
            tool={tool}
            eraserMode={eraserMode}
            brushRadius={brushRadius}
            onCommit={handleCommit}
            onUndoLast={handleUndoLast}
          />

          <div className='flex gap-1.5 w-full max-w-sm mx-auto'>
            {REPLACE_MODES.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  state.replaceMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {state.replaceMode === "color" && (
            <label className='flex items-center justify-between text-sm w-full max-w-sm mx-auto'>
              <span className='text-muted-foreground'>Fill color</span>
              <input
                type='color'
                value={state.replaceColor ?? "#ffffff"}
                onChange={(e) => update({ replaceColor: e.target.value })}
                className='w-9 h-7 rounded cursor-pointer border border-slate-200 dark:border-slate-700'
              />
            </label>
          )}

          {state.replaceMode === "image" && (
            <label className='flex items-center justify-between text-sm cursor-pointer w-full max-w-sm mx-auto'>
              <span className='text-muted-foreground truncate'>{state.replaceImageUrl ? "Change image…" : "Choose image…"}</span>
              <input type='file' accept='image/*' className='hidden' onChange={(e) => handleImageFile(e.target.files?.[0])} />
              {state.replaceImageUrl && <img src={state.replaceImageUrl} alt='' className='w-9 h-7 object-cover rounded border border-slate-200 dark:border-slate-700' />}
            </label>
          )}
        </>
      )}
    </div>
  );
}
