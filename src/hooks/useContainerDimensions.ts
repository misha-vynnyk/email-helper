/**
 * Custom hook to track container dimensions using ResizeObserver
 */

import { useEffect, useRef, useState, RefObject } from "react";

interface Dimensions {
  width: number;
  height: number;
}

export function useContainerDimensions(): [RefObject<HTMLDivElement | null>, Dimensions] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions((prev) => {
          // Avoid unnecessary re-renders if dimensions haven't changed
          if (prev.width === width && prev.height === height) {
            return prev;
          }
          return { width, height };
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return [containerRef, dimensions];
}
