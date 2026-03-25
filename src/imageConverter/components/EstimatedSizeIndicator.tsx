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
      <div className='p-4 rounded-xl bg-muted/50 border border-border/50 opacity-60'>
        <span className='text-xs text-muted-foreground block mb-1'>Estimated Output Size</span>
        <span className='text-sm text-muted-foreground'>Select only ONE file to see estimation</span>
      </div>
    );
  }

  if (!originalSize || originalSize === 0) {
    return (
      <div className='p-4 rounded-xl bg-muted/50 border border-border/50 opacity-60'>
        <span className='text-xs text-muted-foreground block mb-1'>Estimated Output Size</span>
        <span className='text-sm text-muted-foreground'>Select a file to see estimation</span>
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
  const isLikelyAnimated = originalFormat.includes("gif") && originalSize > 1024 * 1024;

  // Gradient based on compression quality
  const getGradientClass = () => {
    if (compressionRatio > 50) return "from-success to-success/80";
    if (compressionRatio > 30) return "from-primary to-primary/80";
    if (compressionRatio > 0) return "from-warning to-warning/80";
    return "from-destructive to-destructive/80";
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${getGradientClass()} text-white transition-all duration-300 shadow-md`}>
      <span className='text-xs font-medium opacity-90 block mb-3'>Estimated Output Size</span>

      <div className='flex items-center justify-between mb-3'>
        <div>
          <span className='text-2xl font-bold'>{formatFileSize(estimatedSize)}</span>
          <span className='text-xs opacity-80 block mt-0.5'>from {formatFileSize(originalSize)}</span>
        </div>
        <span className='flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold'>
          {isSmaller ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {isSmaller ? `-${compressionRatio}%` : `+${Math.abs(compressionRatio)}%`}
        </span>
      </div>

      {/* Size bar */}
      <div className='h-2 bg-white/20 rounded-full overflow-hidden mb-3'>
        <div
          className='h-full bg-white rounded-full transition-all duration-500'
          style={{ width: `${Math.min(100, (estimatedSize / originalSize) * 100)}%` }}
        />
      </div>

      <span className='text-xs opacity-80'>
        {isSmaller ? `You'll save ${formatFileSize(sizeDiff)}` : `Size increases by ${formatFileSize(sizeDiff)}`}
      </span>

      <p className='text-[10px] opacity-70 mt-2 italic'>
        {isGif && isLikelyAnimated
          ? "⚠️ Animated GIF: Compression varies greatly (±20-40%). Use Quality Slider."
          : "⚠️ Estimate based on format, quality & settings. Actual may vary ±10-20%."}
      </p>
    </div>
  );
}
