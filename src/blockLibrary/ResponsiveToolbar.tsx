/**
 * Responsive Toolbar Component
 * Chrome DevTools-style responsive viewport selector
 */

import { Monitor, RotateCw, Smartphone, Tablet as TabletIcon } from "lucide-react";
import React from "react";

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: "Mobile S", width: 320, height: 568, icon: <Smartphone size={16} /> },
  { name: "Mobile M", width: 375, height: 667, icon: <Smartphone size={16} /> },
  { name: "Mobile L", width: 425, height: 812, icon: <Smartphone size={16} /> },
  { name: "Tablet", width: 768, height: 1024, icon: <TabletIcon size={16} /> },
  { name: "Laptop", width: 1024, height: 768, icon: <Monitor size={16} /> },
  { name: "Desktop", width: 1440, height: 900, icon: <Monitor size={16} /> },
];

interface ResponsiveToolbarProps {
  width: number | "responsive";
  onWidthChange: (width: number | "responsive") => void;
  orientation: "portrait" | "landscape";
  onOrientationChange: (orientation: "portrait" | "landscape") => void;
}

export default function ResponsiveToolbar({
  width,
  onWidthChange,
  orientation,
  onOrientationChange,
}: ResponsiveToolbarProps) {
  const [customWidth, setCustomWidth] = React.useState<number>(
    typeof width === "number" ? width : 375
  );

  const handlePresetChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    if (value === "responsive") {
      onWidthChange("responsive");
    } else if (value === "custom") {
      onWidthChange(customWidth);
    } else {
      const preset = VIEWPORT_PRESETS.find((p) => p.name === value);
      if (preset) {
        const targetWidth = orientation === "portrait" ? preset.width : preset.height;
        setCustomWidth(targetWidth);
        onWidthChange(targetWidth);
      }
    }
  };

  const handleCustomWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(event.target.value) || 375;
    setCustomWidth(newWidth);
    if (width !== "responsive") {
      onWidthChange(newWidth);
    }
  };

  const toggleOrientation = () => {
    const newOrientation = orientation === "portrait" ? "landscape" : "portrait";
    onOrientationChange(newOrientation);

    // Swap width if using preset
    if (typeof width === "number") {
      const preset = VIEWPORT_PRESETS.find((p) => {
        const targetWidth = orientation === "portrait" ? p.width : p.height;
        return targetWidth === width;
      });

      if (preset) {
        const newWidth = newOrientation === "portrait" ? preset.width : preset.height;
        setCustomWidth(newWidth);
        onWidthChange(newWidth);
      }
    }
  };

  const getCurrentPreset = (): string => {
    if (width === "responsive") return "responsive";

    const matchingPreset = VIEWPORT_PRESETS.find((p) => {
      const targetWidth = orientation === "portrait" ? p.width : p.height;
      return targetWidth === width;
    });

    return matchingPreset ? matchingPreset.name : "custom";
  };

  return (
    <div className='flex items-center gap-4'>
      {/* Preset Selector */}
      <select
        value={getCurrentPreset()}
        onChange={handlePresetChange}
        className='h-8 min-w-[150px] rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
      >
        <option value='responsive'>Responsive</option>
        {VIEWPORT_PRESETS.map((preset) => (
          <option
            key={preset.name}
            value={preset.name}
          >
            {preset.name} ({orientation === "portrait" ? preset.width : preset.height}px)
          </option>
        ))}
        <option value='custom'>Custom</option>
      </select>

      {/* Width Input */}
      {width !== "responsive" && (
        <>
          <div className='relative w-[100px]'>
            <input
              type='number'
              value={customWidth}
              onChange={handleCustomWidthChange}
              className='h-8 w-full rounded-lg border border-input bg-background pl-2 pr-7 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
            />
            <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground'>
              px
            </span>
          </div>

          {/* Orientation Toggle */}
          <button
            onClick={toggleOrientation}
            title='Rotate viewport'
            className='flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
          >
            <RotateCw size={16} />
          </button>

          {/* Orientation Label */}
          <span className='min-w-[60px] text-xs text-muted-foreground'>
            {orientation === "portrait" ? "Portrait" : "Landscape"}
          </span>
        </>
      )}

      {/* Current Dimensions Display */}
      {width !== "responsive" && (
        <span className='text-xs font-semibold text-primary'>{customWidth} × auto</span>
      )}
    </div>
  );
}
