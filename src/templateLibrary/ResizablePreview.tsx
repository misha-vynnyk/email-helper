/**
 * Resizable Preview Component
 * Chrome DevTools-style resizable preview with drag handles
 *
 * ВАЖЛИВО: Zoom застосовується через transform: scale() до дочірніх елементів,
 * а не до ширини контейнера. Це дозволяє media queries працювати коректно.
 */

import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { DragHandle as DragIcon } from "@mui/icons-material";
import { alpha, Box, Typography, useTheme } from "@mui/material";

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
  const theme = useTheme();
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
      // Множимо на 2, бо тягнемо з одного краю але розширюємо з обох сторін
      // Ділимо на zoom, щоб рух миші відповідав візуальній зміні розміру
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
  // Візуальна ширина = реальна ширина * zoom (для позиціонування хендлів)
  const visualWidth = displayWidth * zoom;

  return (
    <Box sx={{ position: "relative", width: "100%", py: 2 }}>
      {/* Width Indicator */}
      {!isResponsive && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: Math.min(visualWidth, window.innerWidth - 100),
              height: 28,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `2px solid ${theme.palette.primary.main}`,
              borderBottom: "none",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              transition: isDragging ? "none" : "width 0.2s ease",
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: theme.palette.primary.main,
                fontFamily: "monospace",
              }}
            >
              {displayWidth}px
            </Typography>
            {zoom !== 1 && (
              <Typography
                sx={{
                  fontSize: "10px",
                  color: theme.palette.text.secondary,
                  fontFamily: "monospace",
                }}
              >
                (zoom {Math.round(zoom * 100)}%)
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Content Container with handles */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "relative",
          minHeight: 200,
        }}
      >
        {/* Left Handle */}
        {!isResponsive && (
          <Box
            onMouseDown={(e) => handleMouseDown(e, "left")}
            sx={{
              position: "absolute",
              left: `calc(50% - ${visualWidth / 2}px - 28px)`,
              top: 0,
              bottom: 0,
              width: 28,
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transition: isDragging ? "none" : "left 0.2s ease",
              "&:hover .handle-bar, &:active .handle-bar": {
                backgroundColor: theme.palette.primary.main,
                height: 80,
                boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
          >
            <Box
              className="handle-bar"
              sx={{
                width: 6,
                height: isDragging ? 80 : 56,
                backgroundColor: isDragging
                  ? theme.palette.primary.main
                  : alpha(theme.palette.primary.main, 0.5),
                borderRadius: 3,
                transition: isDragging ? "none" : "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DragIcon
                sx={{
                  fontSize: 14,
                  color: theme.palette.primary.contrastText,
                  transform: "rotate(90deg)",
                }}
              />
            </Box>
          </Box>
        )}

        {/* Content - центрований, масштабований через zoom */}
        <Box
          sx={{
            width: displayWidth,
            maxWidth: "100%",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: isDragging ? "none" : "transform 0.2s ease, width 0.2s ease",
            position: "relative",
            // Рамка навколо контенту
            "&::before": !isResponsive ? {
              content: '""',
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 1,
              pointerEvents: "none",
              zIndex: 1,
            } : undefined,
          }}
        >
          {children}
        </Box>

        {/* Right Handle */}
        {!isResponsive && (
          <Box
            onMouseDown={(e) => handleMouseDown(e, "right")}
            sx={{
              position: "absolute",
              right: `calc(50% - ${visualWidth / 2}px - 28px)`,
              top: 0,
              bottom: 0,
              width: 28,
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transition: isDragging ? "none" : "right 0.2s ease",
              "&:hover .handle-bar, &:active .handle-bar": {
                backgroundColor: theme.palette.primary.main,
                height: 80,
                boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
          >
            <Box
              className="handle-bar"
              sx={{
                width: 6,
                height: isDragging ? 80 : 56,
                backgroundColor: isDragging
                  ? theme.palette.primary.main
                  : alpha(theme.palette.primary.main, 0.5),
                borderRadius: 3,
                transition: isDragging ? "none" : "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DragIcon
                sx={{
                  fontSize: 14,
                  color: theme.palette.primary.contrastText,
                  transform: "rotate(90deg)",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Drag Feedback Tooltip */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: "18px",
            fontWeight: 700,
            fontFamily: "monospace",
            pointerEvents: "none",
            zIndex: 10000,
            boxShadow: theme.shadows[8],
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{currentWidth}px</span>
          {zoom !== 1 && (
            <Typography
              component="span"
              sx={{
                fontSize: 12,
                opacity: 0.8,
                fontWeight: 400,
              }}
            >
              (zoom {Math.round(zoom * 100)}%)
            </Typography>
          )}
        </motion.div>
      )}

      {/* Breakpoint Hints */}
      {isDragging && (
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
            zIndex: 10000,
          }}
        >
          {[
            { width: 320, label: "Mobile S" },
            { width: 375, label: "Mobile M" },
            { width: 425, label: "Mobile L" },
            { width: 768, label: "Tablet" },
            { width: 1024, label: "Laptop" },
          ].map((bp) => {
            const isActive = Math.abs(currentWidth - bp.width) < 20;
            return (
              <Box
                key={bp.width}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  backgroundColor: isActive
                    ? theme.palette.primary.main
                    : alpha(theme.palette.background.paper, 0.95),
                  color: isActive
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: theme.shadows[4],
                  transition: "all 0.15s ease",
                  border: isActive ? "none" : `1px solid ${theme.palette.divider}`,
                }}
              >
                {bp.label} ({bp.width})
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
