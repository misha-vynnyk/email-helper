import React from "react";
import { RotateCw as RotateIcon } from "lucide-react";

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: "Mobile S", width: 320, height: 568 },
  { name: "Mobile M", width: 375, height: 667 },
  { name: "Mobile L", width: 425, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Laptop", width: 1024, height: 768 },
  { name: "Desktop", width: 1440, height: 900 },
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
    typeof width === "number" ? width : 600
  );

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
    const newWidth = parseInt(event.target.value) || 600;
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
    <div className="flex items-center gap-3">
      {/* Preset Selector */}
      <div className="relative">
        <select
          value={getCurrentPreset()}
          onChange={handlePresetChange}
          className="pl-3 pr-8 py-1.5 text-sm font-semibold rounded-lg border-2 border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 text-foreground transition-all outline-none appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="responsive">Responsive</option>
          {VIEWPORT_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} ({orientation === "portrait" ? preset.width : preset.height}px)
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      {/* Width Input */}
      {width !== "responsive" && (
        <>
          <div className="relative flex items-center">
            <input
              type="number"
              value={customWidth}
              onChange={handleCustomWidthChange}
              className="w-20 pl-3 pr-6 py-1.5 text-sm font-semibold rounded-lg border-2 border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 text-foreground transition-all outline-none"
            />
            <span className="absolute right-2 text-xs font-bold text-muted-foreground pointer-events-none">
              px
            </span>
          </div>

          {/* Orientation Toggle */}
          <button
            onClick={toggleOrientation}
            title={`Rotate viewport to ${orientation === "portrait" ? "landscape" : "portrait"}`}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
          >
            <RotateIcon size={16} strokeWidth={2.5} />
          </button>

          {/* Orientation Label */}
          <span className="text-xs font-bold text-muted-foreground min-w-[60px]">
            {orientation === "portrait" ? "Portrait" : "Landscape"}
          </span>
        </>
      )}

      {/* Current Dimensions Display */}
      {width !== "responsive" && (
        <span className="text-xs font-bold text-primary tracking-wide">
          {customWidth} × auto
        </span>
      )}
    </div>
  );
}
