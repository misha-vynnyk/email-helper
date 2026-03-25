/**
 * Compression Mode Selector — Dropdown with 4 modes.
 * Props-based. Tailwind styling.
 */

import { Gauge, Sparkles, Minimize2, ShieldCheck } from "lucide-react";
import { ConversionSettings, CompressionMode } from "../types";

interface CompressionModeSelectorProps {
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}

const modes: { value: CompressionMode; label: string; icon: React.ReactNode; description: string; details: string }[] = [
  { value: "balanced", label: "Balanced", icon: <Gauge size={16} />, description: "Manual quality control", details: "Standard compression. Adjust quality manually with slider below." },
  { value: "maximum-quality", label: "Maximum Quality", icon: <Sparkles size={16} />, description: "(auto quality: 90%+)", details: "Uses advanced algorithms. Quality automatically set to 90%+." },
  { value: "maximum-compression", label: "Maximum Compression", icon: <Minimize2 size={16} />, description: "(auto quality: ~75%)", details: "Aggressive compression. Quality optimized for maximum size reduction." },
  { value: "lossless", label: "Lossless", icon: <ShieldCheck size={16} />, description: "No quality loss (100%)", details: "Perfect quality (PNG/WebP only). Larger files, pixel-perfect." },
];

export default function CompressionModeSelector({ settings, updateSettings }: CompressionModeSelectorProps) {
  const currentMode = modes.find((m) => m.value === settings.compressionMode);
  const isLosslessAvailable = settings.format === "png" || settings.format === "webp";

  return (
    <div>
      <select
        value={settings.compressionMode}
        onChange={(e) => updateSettings({ compressionMode: e.target.value as CompressionMode })}
        className='w-full bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
      >
        {modes.map((mode) => (
          <option
            key={mode.value}
            value={mode.value}
            disabled={mode.value === "lossless" && !isLosslessAvailable}
          >
            {mode.label} — {mode.description}
          </option>
        ))}
      </select>

      {currentMode && (
        <p className='text-xs text-muted-foreground mt-1.5'>{currentMode.details}</p>
      )}

      {settings.compressionMode === "lossless" && !isLosslessAvailable && (
        <p className='text-xs text-warning mt-1.5'>⚠️ Lossless mode only available for PNG and WebP</p>
      )}

      {settings.compressionMode === "maximum-quality" && settings.processingMode === "client" && (
        <p className='text-xs text-info mt-1.5'>💡 Switch to Server mode for best results</p>
      )}
    </div>
  );
}
