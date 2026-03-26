/**
 * Quality Control — Auto/Manual quality with slider.
 * Props-based. Tailwind styling.
 */

import { Sparkles, SlidersHorizontal, Lock } from "lucide-react";
import { CompressionMode } from "../types";

interface QualityControlProps {
  autoQuality: boolean;
  quality: number;
  onAutoQualityChange: (auto: boolean) => void;
  onQualityChange: (quality: number) => void;
  compressionMode?: CompressionMode;
  disabled?: boolean;
}

const getQualityLevel = (quality: number): { label: string; color: string } => {
  if (quality >= 90) return { label: "Excellent", color: "text-success" };
  if (quality >= 75) return { label: "High", color: "text-success" };
  if (quality >= 60) return { label: "Good", color: "text-warning" };
  if (quality >= 40) return { label: "Medium", color: "text-warning" };
  return { label: "Low", color: "text-destructive" };
};

const getCompressionModeQuality = (mode: CompressionMode): number => {
  switch (mode) {
    case "maximum-quality": return 92;
    case "maximum-compression": return 75;
    case "lossless": return 100;
    default: return 85;
  }
};

export default function QualityControl({

  autoQuality,
  quality,
  onAutoQualityChange,
  onQualityChange,
  compressionMode = "balanced",
  disabled = false,
}: QualityControlProps) {
  const isControlledByCompressionMode = compressionMode !== "balanced";
  const effectiveQuality = isControlledByCompressionMode ? getCompressionModeQuality(compressionMode) : quality;
  const qualityLevel = getQualityLevel(effectiveQuality);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-xs font-black uppercase tracking-widest text-muted-foreground/80'>Quality Engine</h4>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${qualityLevel.color} bg-current/10 overflow-hidden`}>
           <div className='w-1.5 h-1.5 rounded-full bg-current' />
           <span className='text-[10px] font-black uppercase tracking-tight'>{qualityLevel.label}</span>
        </div>
      </div>

      {isControlledByCompressionMode ? (
        /* Locked state for non-balanced modes */
        <div className='relative overflow-hidden p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-border/50 group'>
          <div className='relative z-10 flex items-center justify-between'>
            <div className='flex flex-col'>
              <div className='flex items-center gap-2 mb-1'>
                <Lock size={12} className='text-primary' />
                <span className='text-xs font-bold text-foreground'>Active Profile</span>
              </div>
              <p className='text-[10px] text-muted-foreground uppercase font-medium tracking-tight'>
                {compressionMode.replace("-", " ")}
              </p>
            </div>
            <div className='text-right'>
              <span className='text-3xl font-black text-primary tabular-nums tracking-tighter'>{effectiveQuality}%</span>
            </div>
          </div>
          {/* Subtle decoration */}
          <Sparkles size={40} className='absolute -bottom-4 -right-4 text-primary/10 -rotate-12 transition-transform group-hover:rotate-0 duration-700' />
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {/* Quality Mode Switcher */}
          <div className='flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl'>
            <button
              onClick={() => onAutoQualityChange(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                autoQuality ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles size={14} />
              Auto
            </button>
            <button
              onClick={() => onAutoQualityChange(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                !autoQuality ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal size={14} />
              Manual
            </button>
          </div>

          {/* Slider for Manual Mode */}
          {!autoQuality && (
            <div className='space-y-3 px-1'>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] uppercase font-black tracking-widest text-muted-foreground'>Intensity</span>
                <span className='text-lg font-black text-primary tabular-nums'>{quality}%</span>
              </div>
              <div className='relative h-6 flex items-center group'>
                <input
                  type='range'
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => onQualityChange(Math.max(1, Math.min(100, Number(e.target.value))))}
                  disabled={disabled}
                  className='w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all'
                />
              </div>
              <div className='flex justify-between text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60'>
                <span>Max Compression</span>
                <span>Max Quality</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

