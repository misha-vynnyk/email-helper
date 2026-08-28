/**
 * Tool-specific controls for background editing: Eraser brush settings, and the
 * replace-mode picker (transparent / solid color / another image). The replace-mode
 * picker stays visible whenever a background edit exists, regardless of which tool
 * is currently active, so switching to Crop to check framing doesn't hide it.
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
    <div className='w-full max-w-sm mx-auto flex flex-col gap-2.5'>
      {tool === "eraser" && (
        <div className='flex flex-col gap-2'>
          <div className='flex gap-1.5'>
            {(["erase", "restore"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onEraserModeChange(mode)}
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
              onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
              className='flex-1 accent-primary'
            />
          </label>
        </div>
      )}

      {hasOperations && (
        <>
          <div className='flex gap-1.5'>
            {REPLACE_MODES.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => onReplaceModeChange(mode)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  replaceMode === mode ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {replaceMode === "color" && (
            <label className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Fill color</span>
              <input
                type='color'
                value={replaceColor ?? "#ffffff"}
                onChange={(e) => onReplaceColorChange(e.target.value)}
                className='w-9 h-7 rounded cursor-pointer border border-slate-200 dark:border-slate-700'
              />
            </label>
          )}

          {replaceMode === "image" && (
            <label className='flex items-center justify-between text-sm cursor-pointer'>
              <span className='text-muted-foreground truncate'>{replaceImageUrl ? "Change image…" : "Choose image…"}</span>
              <input type='file' accept='image/*' className='hidden' onChange={(e) => onReplaceImageFile(e.target.files?.[0])} />
              {replaceImageUrl && <img src={replaceImageUrl} alt='' className='w-9 h-7 object-cover rounded border border-slate-200 dark:border-slate-700' />}
            </label>
          )}
        </>
      )}
    </div>
  );
}
