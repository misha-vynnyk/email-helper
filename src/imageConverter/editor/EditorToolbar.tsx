/**
 * The single tool switcher for the image editor — replaces the old two-level
 * navigation (a Crop/Background tab, with Wand/Eraser nested inside Background).
 * Picking Wand or Eraser directly here IS how background removal starts; there's
 * no separate "enable background removal" toggle to find first.
 *
 * Rendered as a vertical rail of icon-only pills to the left of the canvas
 * (Photoshop/GIMP-style tool dock) rather than a horizontal row above it — frees
 * up the vertical space the stacked Wand/Eraser controls below the canvas need.
 * Labels live in `title` (native tooltip on hover) instead of on-button text.
 */

import { Crop, Eraser, Wand2 } from "lucide-react";

import { EditorTool } from "./EditorStage";

interface EditorToolbarProps {
  tool: EditorTool;
  onChange: (tool: EditorTool) => void;
  showBackgroundTools: boolean;
}

const TOOLS: { tool: EditorTool; label: string; icon: typeof Crop }[] = [
  { tool: "crop", label: "Crop", icon: Crop },
  { tool: "wand", label: "Wand", icon: Wand2 },
  { tool: "eraser", label: "Eraser", icon: Eraser },
];

export default function EditorToolbar({ tool, onChange, showBackgroundTools }: EditorToolbarProps) {
  const visibleTools = showBackgroundTools ? TOOLS : TOOLS.filter((t) => t.tool === "crop");
  if (visibleTools.length < 2) return null;

  return (
    <div className='flex flex-col gap-1.5 shrink-0'>
      {visibleTools.map(({ tool: t, label, icon: Icon }) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-pressed={tool === t}
          title={label}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            tool === t ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
