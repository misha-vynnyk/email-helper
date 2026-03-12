import { formatSize } from "../utils/formatters";

interface ImageProcessorStatsProps {
  doneCount: number;
  totalOriginal: number;
  totalConverted: number;
}

export function ImageProcessorStats({ doneCount, totalOriginal, totalConverted }: ImageProcessorStatsProps) {
  if (doneCount <= 0) return null;

  return (
    <div className='mt-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50'>
      <span className='text-xs text-muted-foreground'>
        💾 {formatSize(totalOriginal)} → {formatSize(totalConverted)} ({totalOriginal > 0 ? `-${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%` : "0%"})
      </span>
    </div>
  );
}
