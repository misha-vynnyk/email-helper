/**
 * Estimated Size Indicator — Shows estimated output size with gradient.
 * Props-based. Tailwind styling.
 */

import { TrendingDown, TrendingUp } from "lucide-react";
import { ConversionSettings } from "../types";
import {
  estimateOutputSize,
  formatFileSize,
  calculateCompressionRatio,
} from "../utils/estimatedSizeCalculator";

interface EstimatedSizeIndicatorProps {
  originalSize: number;
  originalFormat: string;
  settings: ConversionSettings;
  disabled?: boolean;
}

export default function EstimatedSizeIndicator({
  originalSize,
  originalFormat,
  settings,
  disabled = false,
}: EstimatedSizeIndicatorProps) {
  if (disabled) {
    return (
      <div className='p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 opacity-60'>
        <span className='text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2'>Estimation Engine</span>
        <span className='text-xs font-bold text-muted-foreground italic'>Select a single file for deep-size analysis</span>
      </div>
    );
  }

  if (!originalSize || originalSize === 0) {
    return (
      <div className='p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 opacity-60'>
        <span className='text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2'>Estimation Engine</span>
        <span className='text-xs font-bold text-muted-foreground italic'>Waiting for file selection...</span>
      </div>
    );
  }

  const effectiveFormat = originalFormat || `image/${settings.format}`;
  const estimatedSize = estimateOutputSize(originalSize, effectiveFormat, settings);

  if (!estimatedSize || estimatedSize === 0 || isNaN(estimatedSize)) return null;

  const compressionRatio = calculateCompressionRatio(originalSize, estimatedSize);
  const isSmaller = estimatedSize < originalSize;
  const sizeDiff = Math.abs(originalSize - estimatedSize);

  const isGif = settings.format === "gif";
  const isLikelyAnimated = (originalFormat || "").includes("gif") && originalSize > 1024 * 1024;

  // Modern vibrant gradients
  const getGradientClass = () => {
    if (compressionRatio > 60) return "from-emerald-500 to-teal-600 shadow-emerald-500/20";
    if (compressionRatio > 30) return "from-primary to-indigo-600 shadow-primary/20";
    if (compressionRatio > 0) return "from-amber-400 to-orange-500 shadow-amber-500/20";
    return "from-rose-500 to-red-600 shadow-rose-500/20";
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${getGradientClass()} text-white transition-all duration-300 shadow-lg relative overflow-hidden`}>
      {/* Decorative glass circle */}
      <div className='absolute -top-8 -right-8 w-20 h-20 bg-white/10 rounded-full blur-2xl' />
      
      <div className='relative z-10'>
        <span className='text-[10px] font-semibold uppercase tracking-wider opacity-80 block mb-2'>Estimated Size</span>

        <div className='flex items-end justify-between mb-3'>
          <div className='flex flex-col'>
            <span className='text-2xl font-bold tracking-tight'>
              {formatFileSize(estimatedSize).split(' ')[0]}
              <span className='text-sm ml-1 opacity-70'>{formatFileSize(estimatedSize).split(' ')[1]}</span>
            </span>
            <span className='text-[9px] font-medium opacity-60 mt-0.5'>from {formatFileSize(originalSize)}</span>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <div className='flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-semibold'>
              {isSmaller ? <TrendingDown size={14} strokeWidth={3} /> : <TrendingUp size={14} strokeWidth={3} />}
              {isSmaller ? `${compressionRatio}%` : `${Math.abs(compressionRatio)}%`}
            </div>
          </div>
        </div>

        {/* High-fidelity progress bar */}
        <div className='relative h-1.5 bg-black/10 rounded-full overflow-hidden mb-2'>
          <div
            className='absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500 ease-out'
            style={{ width: `${Math.min(100, (estimatedSize / originalSize) * 100)}%` }}
          />
        </div>

        <div className='flex items-center justify-between'>
           <span className='text-[9px] font-medium opacity-80'>
              {isSmaller ? `Save ~${formatFileSize(sizeDiff)}` : `+${formatFileSize(sizeDiff)} Increase`}
           </span>
           <div className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
        </div>

        {/* Important context with glass style */}
        <div className='mt-3 p-2 bg-black/10 rounded-lg border border-white/10'>
           <p className='text-[8px] font-medium leading-relaxed opacity-80'>
              {isGif && isLikelyAnimated
                ? "⚠️ Motion Graphics Index: Animation complexity may yield variable results (±30%)."
                : "⚠️ Calibration Note: AI estimation based on modern codec logic. Margin: ±15%."}
           </p>
        </div>
      </div>
    </div>
  );
}

