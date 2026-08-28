/**
 * The single tool switcher for the image editor — replaces the old two-level
 * navigation (a Crop/Background tab, with Wand/Eraser nested inside Background).
 * Picking Wand or Eraser directly here IS how background removal starts; there's
 * no separate "enable background removal" toggle to find first.
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
    <div className='flex gap-1.5 w-full max-w-sm mx-auto'>
      {visibleTools.map(({ tool: t, label, icon: Icon }) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-pressed={tool === t}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tool === t ? "bg-primary text-primary-foreground" : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
