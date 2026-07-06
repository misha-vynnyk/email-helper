/**
 * Resizable Preview Component
 * Chrome DevTools-style resizable preview with ruler
 */

import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ResizablePreviewProps {
  children: React.ReactNode;
  width: number | "responsive";
  onWidthChange: (width: number) => void;
  zoom: number;
}

export default function ResizablePreview({
  children,
  width,
  onWidthChange,
  zoom,
}: ResizablePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number>(typeof width === "number" ? width : 600);

  useEffect(() => {
    if (typeof width === "number") {
      setCurrentWidth(width);
    }
  }, [width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (width === "responsive") return;
      e.preventDefault();
      setIsDragging(true);
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || width === "responsive") return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distance = Math.abs(e.clientX - centerX);
      const newWidth = Math.max(200, Math.min(2000, (distance * 2) / zoom));

      setCurrentWidth(Math.round(newWidth));
    },
    [isDragging, zoom, width]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && width !== "responsive") {
      setIsDragging(false);
      onWidthChange(currentWidth);
    }
  }, [isDragging, currentWidth, onWidthChange, width]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isResponsive = width === "responsive";
  const displayWidth = isDragging ? currentWidth : typeof width === "number" ? width : 600;

  return (
    <div
      ref={containerRef}
      className='relative w-full'
    >
      {/* Ruler */}
      {!isResponsive && (
        <div className='flex justify-center mb-2 relative'>
          <div
            className='flex items-center justify-center text-primary font-mono text-[11px] font-semibold rounded-t border border-primary bg-primary/[0.08]'
            style={{
              width: `${displayWidth * zoom}px`,
              height: 20,
              transition: isDragging ? "none" : "width 0.3s ease",
            }}
          >
            {displayWidth}px
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className='flex justify-center relative'>
        {/* Left Handle */}
        {!isResponsive && (
          <div
            onMouseDown={handleMouseDown}
            className={`group absolute top-0 bottom-0 w-2 cursor-ew-resize ${isDragging ? "bg-primary" : "bg-transparent hover:bg-primary"}`}
            style={{
              left: `calc(50% - ${(displayWidth * zoom) / 2}px - 4px)`,
              transition: isDragging ? "none" : "all 0.3s ease",
            }}
          >
            <span
              className='absolute top-1/2 -translate-y-1/2 rounded bg-white'
              style={{ left: 3, width: 2, height: 30 }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            width: isResponsive ? "100%" : `${displayWidth}px`,
            transition: isDragging ? "none" : "width 0.3s ease",
          }}
        >
          {children}
        </div>

        {/* Right Handle */}
        {!isResponsive && (
          <div
            onMouseDown={handleMouseDown}
            className={`group absolute top-0 bottom-0 w-2 cursor-ew-resize ${isDragging ? "bg-primary" : "bg-transparent hover:bg-primary"}`}
            style={{
              right: `calc(50% - ${(displayWidth * zoom) / 2}px - 4px)`,
              transition: isDragging ? "none" : "all 0.3s ease",
            }}
          >
            <span
              className='absolute top-1/2 -translate-y-1/2 rounded bg-white'
              style={{ right: 3, width: 2, height: 30 }}
            />
          </div>
        )}
      </div>

      {/* Visual Feedback */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground px-4 py-2 rounded font-mono text-sm font-semibold pointer-events-none shadow-lg'
          style={{
            backgroundColor: "hsl(var(--primary) / 0.95)",
            zIndex: 10000,
          }}
        >
          {currentWidth}px
        </motion.div>
      )}
    </div>
  );
}
