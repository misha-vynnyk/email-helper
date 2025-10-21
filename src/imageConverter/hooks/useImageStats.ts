import { useMemo } from 'react';

import { ImageFile } from '../types';

export interface ImageStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  originalTotalSize: number;
  convertedTotalSize: number;
  savedSize: number;
  savedPercent: number;
}

export function useImageStats(files: ImageFile[]): ImageStats {
  return useMemo(() => {
    const total = files.length;
    const completed = files.filter((f) => f.status === 'done').length;
    const failed = files.filter((f) => f.status === 'error').length;
    const processing = files.filter((f) => f.status === 'processing').length;
    const originalTotalSize = files.reduce((sum, f) => sum + f.originalSize, 0);
    const convertedTotalSize = files.reduce((sum, f) => sum + (f.convertedSize || 0), 0);
    const savedSize = originalTotalSize - convertedTotalSize;
    const savedPercent = originalTotalSize > 0 ? Math.round((savedSize / originalTotalSize) * 100) : 0;

    return {
      total,
      completed,
      failed,
      processing,
      originalTotalSize,
      convertedTotalSize,
      savedSize,
      savedPercent,
    };
  }, [files]);
}

