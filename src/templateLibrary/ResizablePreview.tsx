import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical as DragIcon } from "lucide-react";

interface ResizablePreviewProps {
  children: React.ReactNode;
  width: number | "responsive";
  onWidthChange: (width: number) => void;
  zoom: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function ResizablePreview({
  children,
  width,
  onWidthChange,
  zoom,
  minWidth = 280,
  maxWidth = 1600,
}: ResizablePreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSide, setDragSide] = useState<"left" | "right" | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number>(
    typeof width === "number" ? width : 600
  );
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Sync with prop
  useEffect(() => {
    if (typeof width === "number") {
      setCurrentWidth(width);
    }
  }, [width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      if (width === "responsive") return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setDragSide(side);
      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;
    },
    [width, currentWidth]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || width === "responsive") return;

      const deltaX = e.clientX - startXRef.current;
      // Multiply by 2 because we drag one side but expand both sides
      // Divide by zoom so mouse movement matches visual resize
      const widthChange = (dragSide === "right" ? deltaX : -deltaX) * 2 / zoom;
      const newWidth = Math.round(
        Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + widthChange))
      );

      setCurrentWidth(newWidth);
    },
    [isDragging, dragSide, zoom, width, minWidth, maxWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && width !== "responsive") {
      setIsDragging(false);
      setDragSide(null);
      onWidthChange(currentWidth);
    }
  }, [isDragging, currentWidth, onWidthChange, width]);

  // Global mouse events for dragging
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
  // Visual width = real width * zoom (for handle positioning)
  const visualWidth = displayWidth * zoom;

  return (
    <div className="relative w-full py-4">
      {/* Width Indicator */}
      {!isResponsive && (
        <div className="flex justify-center mb-2">
          <div
            className="h-7 bg-primary/10 border-2 border-primary border-b-0 rounded-t-lg flex items-center justify-center gap-2"
            style={{
              width: Math.min(visualWidth, window.innerWidth - 100),
              transition: isDragging ? "none" : "width 0.2s ease",
            }}
          >
            <span className="text-xs font-bold text-primary font-mono">
              {displayWidth}px
            </span>
            {zoom !== 1 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                (zoom {Math.round(zoom * 100)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content Container with handles */}
      <div className="flex justify-center items-start relative min-h-[200px]">
        {/* Left Handle */}
        {!isResponsive && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "left")}
            className="absolute top-0 bottom-0 w-7 cursor-ew-resize flex items-center justify-center z-10 group"
            style={{
              left: `calc(50% - ${visualWidth / 2}px - 28px)`,
              transition: isDragging ? "none" : "left 0.2s ease",
            }}
          >
            <div
              className={`w-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                isDragging
                  ? "bg-primary h-20"
                  : "bg-primary/50 h-14 group-hover:bg-primary group-hover:h-20 group-hover:shadow-[0_0_12px_rgba(var(--primary),0.5)]"
              }`}
            >
              <DragIcon size={14} className="text-primary-foreground rotate-90" />
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className="max-w-full relative"
          style={{
            width: displayWidth,
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: isDragging ? "none" : "transform 0.2s ease, width 0.2s ease",
          }}
        >
          {/* Border overlay when not responsive */}
          {!isResponsive && (
            <div className="absolute -top-[2px] -left-[2px] -right-[2px] -bottom-[2px] border-2 border-primary/30 rounded pointer-events-none z-[1]" />
          )}
          {children}
        </div>

        {/* Right Handle */}
        {!isResponsive && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "right")}
            className="absolute top-0 bottom-0 w-7 cursor-ew-resize flex items-center justify-center z-10 group"
            style={{
              right: `calc(50% - ${visualWidth / 2}px - 28px)`,
              transition: isDragging ? "none" : "right 0.2s ease",
            }}
          >
            <div
              className={`w-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                isDragging
                  ? "bg-primary h-20"
                  : "bg-primary/50 h-14 group-hover:bg-primary group-hover:h-20 group-hover:shadow-[0_0_12px_rgba(var(--primary),0.5)]"
              }`}
            >
              <DragIcon size={14} className="text-primary-foreground rotate-90" />
            </div>
          </div>
        )}
      </div>

      {/* Drag Feedback Tooltip */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-bold font-mono pointer-events-none z-[10000] shadow-lg flex items-center gap-3"
        >
          <span>{currentWidth}px</span>
          {zoom !== 1 && (
            <span className="text-xs opacity-80 font-normal">
              (zoom {Math.round(zoom * 100)}%)
            </span>
          )}
        </motion.div>
      )}

      {/* Breakpoint Hints */}
      {isDragging && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-[10000]">
          {[
            { width: 320, label: "Mobile S" },
            { width: 375, label: "Mobile M" },
            { width: 425, label: "Mobile L" },
            { width: 768, label: "Tablet" },
            { width: 1024, label: "Laptop" },
          ].map((bp) => {
            const isActive = Math.abs(currentWidth - bp.width) < 20;
            return (
              <div
                key={bp.width}
                className={`px-3 py-1.5 rounded-md text-xs shadow-md transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold border-none"
                    : "bg-background/95 text-muted-foreground font-normal border border-border"
                }`}
              >
                {bp.label} ({bp.width})
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
