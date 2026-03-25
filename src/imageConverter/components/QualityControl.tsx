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

const getCompressionModeLabel = (mode: CompressionMode): string => {
  switch (mode) {
    case "maximum-quality": return "Maximum Quality mode (92%)";
    case "maximum-compression": return "Maximum Compression mode (75%)";
    case "lossless": return "Lossless mode (100%)";
    default: return "";
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
    <div>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-sm font-semibold text-foreground'>Quality Control</h4>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${qualityLevel.color} bg-current/10`}>
          {qualityLevel.label}
        </span>
      </div>

      {isControlledByCompressionMode ? (
        /* Locked state for non-balanced modes */
        <div className='p-4 rounded-xl bg-info/5 border border-info/20'>
          <div className='flex items-center gap-2 mb-2'>
            <Lock size={14} className='text-info' />
            <span className='text-sm font-medium text-foreground'>Quality set automatically</span>
          </div>
          <p className='text-xs text-muted-foreground mb-3'>
            {getCompressionModeLabel(compressionMode)}
          </p>
          <div className='text-center'>
            <span className='text-3xl font-bold text-primary'>{effectiveQuality}%</span>
          </div>
        </div>
      ) : (
        <>
          {/* Auto / Manual radio */}
          <div className='flex flex-col gap-2 mb-3'>
            <label className='flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors'>
              <input
                type='radio'
                checked={autoQuality}
                onChange={() => onAutoQualityChange(true)}
                disabled={disabled}
                className='accent-primary'
              />
              <Sparkles size={14} className='text-muted-foreground' />
              <div>
                <span className='text-sm font-medium text-foreground block'>Auto Quality</span>
                <span className='text-xs text-muted-foreground'>Automatically calculate optimal quality</span>
              </div>
            </label>

            <label className='flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors'>
              <input
                type='radio'
                checked={!autoQuality}
                onChange={() => onAutoQualityChange(false)}
                disabled={disabled}
                className='accent-primary'
              />
              <SlidersHorizontal size={14} className='text-muted-foreground' />
              <div>
                <span className='text-sm font-medium text-foreground block'>Manual Quality</span>
                <span className='text-xs text-muted-foreground'>Set quality level manually</span>
              </div>
            </label>
          </div>

          {/* Slider */}
          {!autoQuality && (
            <div className='px-1'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm text-muted-foreground'>Quality</span>
                <span className='text-xl font-bold text-primary'>{quality}%</span>
              </div>
              <input
                type='range'
                min={1}
                max={100}
                value={quality}
                onChange={(e) => onQualityChange(Math.max(1, Math.min(100, Number(e.target.value))))}
                disabled={disabled}
                className='w-full accent-primary h-2 rounded-full cursor-pointer disabled:opacity-50'
              />
              <div className='flex justify-between mt-1'>
                <span className='text-[10px] text-muted-foreground'>Smaller file</span>
                <span className='text-[10px] text-muted-foreground'>Better quality</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
