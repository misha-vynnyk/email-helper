/**
 * Quality Control — Auto/Manual quality with slider, plus a Lossless toggle
 * for formats that support it (PNG/WebP).
 * Props-based. Tailwind styling.
 */

import { Lock, ShieldCheck, SlidersHorizontal, Sparkles, Unlock } from "lucide-react";
import { useEffect, useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";

import { CompressionMode, ImageFormat } from "../types";

// Below this, output gets visibly degraded (blocky/blurry) for most images —
// matches the "Low" boundary in getQualityLevel below, so the default
// (locked) range never overlaps the tier the app itself calls low quality.
// The range stays reachable — just gated behind an explicit unlock — so someone
// who genuinely wants extreme compression still can, but can't get there by
// an accidental drag.
const EXTREME_QUALITY_THRESHOLD = 40;

interface QualityControlProps {
  autoQuality: boolean;
  quality: number;
  onAutoQualityChange: (auto: boolean) => void;
  onQualityChange: (quality: number) => void;
  compressionMode: CompressionMode;
  onCompressionModeChange: (mode: CompressionMode) => void;
  format: ImageFormat;
  disabled?: boolean;
}

const getQualityLevel = (quality: number): { label: string; color: string } => {
  if (quality >= 90) return { label: "Excellent", color: "text-success" };
  if (quality >= 75) return { label: "High", color: "text-success" };
  if (quality >= 60) return { label: "Good", color: "text-warning" };
  if (quality >= 40) return { label: "Medium", color: "text-warning" };
  return { label: "Low", color: "text-destructive" };
};

export default function QualityControl({
  autoQuality,
  quality,
  onAutoQualityChange,
  onQualityChange,
  compressionMode,
  onCompressionModeChange,
  format,
  disabled = false,
}: QualityControlProps) {
  const isLosslessAvailable = format === "png" || format === "webp";
  const isLossless = compressionMode === "lossless";

  // If the user was on Lossless and then switches format away from PNG/WebP,
  // fall back to Balanced — otherwise compressionMode stays "lossless" while
  // the format no longer supports it.
  useEffect(() => {
    if (isLossless && !isLosslessAvailable) {
      onCompressionModeChange("balanced");
    }
  }, [isLossless, isLosslessAvailable, onCompressionModeChange]);

  // Local, instantly-updating slider value — the drag thumb and % label follow
  // every tick immediately. Only the debounced value is pushed up to settings,
  // so a fast drag doesn't fire an abort+reprocess cycle (and a burst of worker
  // conversions) on every intermediate tick.
  const [localQuality, setLocalQuality] = useState(quality);
  useEffect(() => setLocalQuality(quality), [quality]);
  const debouncedQuality = useDebounce(localQuality, 300);
  useEffect(() => {
    if (debouncedQuality !== quality) onQualityChange(debouncedQuality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuality]);

  const effectiveQuality = isLossless ? 100 : localQuality;
  const qualityLevel = getQualityLevel(effectiveQuality);

  // Auto-unlocked if a previously saved quality is already below the floor —
  // an old choice stays visible/valid, only new drags below it need the toggle.
  const [extremeUnlocked, setExtremeUnlocked] = useState(quality < EXTREME_QUALITY_THRESHOLD);
  const sliderMin = extremeUnlocked ? 1 : EXTREME_QUALITY_THRESHOLD;

  const toggleExtremeUnlocked = () => {
    setExtremeUnlocked((prev) => {
      const next = !prev;
      if (!next && localQuality < EXTREME_QUALITY_THRESHOLD) {
        setLocalQuality(EXTREME_QUALITY_THRESHOLD);
      }
      return next;
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-xs font-black uppercase tracking-widest text-muted-foreground/80'>Quality Engine</h4>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${qualityLevel.color} bg-current/10 overflow-hidden`}>
           <div className='w-1.5 h-1.5 rounded-full bg-current' />
           <span className='text-[10px] font-black uppercase tracking-tight'>{qualityLevel.label}</span>
        </div>
      </div>

      {isLosslessAvailable && (
        <label className='flex items-center justify-between gap-2 px-1 cursor-pointer'>
          <span className='flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-muted-foreground'>
            <ShieldCheck size={12} />
            Lossless (bit-perfect)
          </span>
          <input
            type='checkbox'
            checked={isLossless}
            disabled={disabled}
            onChange={(e) => onCompressionModeChange(e.target.checked ? "lossless" : "balanced")}
            className='w-4 h-4 accent-primary cursor-pointer disabled:opacity-50'
          />
        </label>
      )}

      {isLossless ? (
        <div className='flex items-center justify-between px-1 py-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground'>
          <span>Quality</span>
          <span className='text-lg font-black text-primary tabular-nums'>100%</span>
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
                <span className='text-lg font-black text-primary tabular-nums'>{localQuality}%</span>
              </div>
              <div className='relative h-6 flex items-center group'>
                <input
                  type='range'
                  min={sliderMin}
                  max={100}
                  value={localQuality}
                  onChange={(e) => setLocalQuality(Math.max(sliderMin, Math.min(100, Number(e.target.value))))}
                  disabled={disabled}
                  className='w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all'
                />
              </div>
              <div className='flex justify-between text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60'>
                <span>{extremeUnlocked ? "Max Compression" : `Max Compression (${EXTREME_QUALITY_THRESHOLD}%)`}</span>
                <span>Max Quality</span>
              </div>
              <button
                type='button'
                onClick={toggleExtremeUnlocked}
                disabled={disabled}
                className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight transition-colors disabled:opacity-50 ${
                  extremeUnlocked ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {extremeUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
                {extremeUnlocked
                  ? `Extreme compression unlocked (<${EXTREME_QUALITY_THRESHOLD}%)`
                  : `Unlock extreme compression (<${EXTREME_QUALITY_THRESHOLD}%)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
