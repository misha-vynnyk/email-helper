/**
 * Resizable Preview Component
 * Chrome DevTools-style resizable preview with ruler
 */

import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';

interface ResizablePreviewProps {
  children: React.ReactNode;
  width: number | 'responsive';
  onWidthChange: (width: number) => void;
  zoom: number;
}

export default function ResizablePreview({ children, width, onWidthChange, zoom }: ResizablePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number>(typeof width === 'number' ? width : 600);

  useEffect(() => {
    if (typeof width === 'number') {
      setCurrentWidth(width);
    }
  }, [width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (width === 'responsive') return;
      e.preventDefault();
      setIsDragging(true);
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || width === 'responsive') return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distance = Math.abs(e.clientX - centerX);
      const newWidth = Math.max(200, Math.min(2000, (distance * 2) / zoom));

      setCurrentWidth(Math.round(newWidth));
    },
    [isDragging, zoom, width]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && width !== 'responsive') {
      setIsDragging(false);
      onWidthChange(currentWidth);
    }
  }, [isDragging, currentWidth, onWidthChange, width]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isResponsive = width === 'responsive';
  const displayWidth = isDragging ? currentWidth : typeof width === 'number' ? width : 600;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      {/* Ruler */}
      {!isResponsive && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 1,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: `${displayWidth * zoom}px`,
              height: 20,
              backgroundColor: '#e3f2fd',
              border: '1px solid #1976d2',
              borderRadius: '4px 4px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1976d2',
              fontFamily: 'monospace',
              transition: isDragging ? 'none' : 'width 0.3s ease',
            }}
          >
            {displayWidth}px
          </Box>
        </Box>
      )}

      {/* Preview Container */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Left Handle */}
        {!isResponsive && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              position: 'absolute',
              left: `calc(50% - ${(displayWidth * zoom) / 2}px - 4px)`,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: 'ew-resize',
              backgroundColor: isDragging ? '#1976d2' : 'transparent',
              transition: isDragging ? 'none' : 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 3,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: 30,
                backgroundColor: '#fff',
                borderRadius: 1,
              },
            }}
          />
        )}

        {/* Content */}
        <Box
          sx={{
            width: isResponsive ? '100%' : `${displayWidth}px`,
            transition: isDragging ? 'none' : 'width 0.3s ease',
          }}
        >
          {children}
        </Box>

        {/* Right Handle */}
        {!isResponsive && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              position: 'absolute',
              right: `calc(50% - ${(displayWidth * zoom) / 2}px - 4px)`,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: 'ew-resize',
              backgroundColor: isDragging ? '#1976d2' : 'transparent',
              transition: isDragging ? 'none' : 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 3,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: 30,
                backgroundColor: '#fff',
                borderRadius: 1,
              },
            }}
          />
        )}
      </Box>

      {/* Visual Feedback */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(25, 118, 210, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {currentWidth}px
        </motion.div>
      )}
    </Box>
  );
}
