/**
 * Tool-specific controls for background editing: Eraser brush settings, and the
 * replace-mode picker (transparent / solid color / another image). The replace-mode
 * picker stays visible whenever a background edit exists, regardless of which tool
 * is currently active, so switching to Crop to check framing doesn't hide it.
 *
 * Laid out as inline flex-wrap groups (not a stacked column) — this renders inside
 * EditorToolOptionsBar, a horizontal strip above the canvas, not a vertical panel.
 */

import { Image as ImageIcon, ImageOff, Palette } from "lucide-react";

import { BackgroundReplaceMode } from "../types";
import { EditorTool } from "./EditorStage";

interface BackgroundOptionsProps {
  tool: EditorTool;
  hasOperations: boolean;
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
}

const REPLACE_MODES: { mode: BackgroundReplaceMode; label: string; icon: typeof ImageOff }[] = [
  { mode: "transparent", label: "Transparent", icon: ImageOff },
  { mode: "color", label: "Color", icon: Palette },
  { mode: "image", label: "Image", icon: ImageIcon },
];

export default function BackgroundOptions({
  tool,
  hasOperations,
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
}: BackgroundOptionsProps) {
  if (tool !== "eraser" && !hasOperations) return null;

  return (
    <div className='flex flex-wrap items-center gap-3'>
      {tool === "eraser" && (
        <div className='flex items-center gap-3 shrink-0'>
          <div className='flex gap-1.5'>
            {(["erase", "restore"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onEraserModeChange(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
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
              onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
              className='w-24 accent-primary'
            />
          </label>
        </div>
      )}

      {hasOperations && (
        <div className='flex flex-wrap items-center gap-2 shrink-0'>
          <div className='flex gap-1'>
            {REPLACE_MODES.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => onReplaceModeChange(mode)}
                title={label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  replaceMode === mode ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {replaceMode === "color" && (
            <input
              type='color'
              value={replaceColor ?? "#ffffff"}
              onChange={(e) => onReplaceColorChange(e.target.value)}
              className='w-8 h-7 rounded cursor-pointer border border-slate-200 dark:border-slate-700'
            />
          )}

          {replaceMode === "image" && (
            <label className='flex items-center gap-2 text-xs cursor-pointer'>
              <span className='text-muted-foreground'>{replaceImageUrl ? "Change…" : "Choose…"}</span>
              <input type='file' accept='image/*' className='hidden' onChange={(e) => onReplaceImageFile(e.target.files?.[0])} />
              {replaceImageUrl && <img src={replaceImageUrl} alt='' className='w-8 h-7 object-cover rounded border border-slate-200 dark:border-slate-700' />}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
