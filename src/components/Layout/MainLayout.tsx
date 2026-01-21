import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Box } from '@mui/material';

interface MainLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  initialLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
}

export function MainLayout({
  leftPanel,
  rightPanel,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}: MainLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
        setLeftWidth(newLeftWidth);
      }
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          width: { xs: '100%', md: `${leftWidth}%` },
          height: { xs: '50%', md: '100%' },
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {leftPanel}
      </Box>

      {/* Resizable Divider */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: { xs: '100%', md: '6px' },
          height: { xs: '6px', md: '100%' },
          backgroundColor: isDragging ? 'primary.main' : 'divider',
          cursor: { xs: 'row-resize', md: 'col-resize' },
          flexShrink: 0,
          transition: isDragging ? 'none' : 'background-color 0.2s',
          display: { xs: 'none', md: 'block' },
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        }}
      />

      {/* Right Panel */}
      <Box
        sx={{
          flex: 1,
          height: { xs: '50%', md: '100%' },
          overflow: 'auto',
          minWidth: 0,
        }}
      >
        {rightPanel}
      </Box>
    </Box>
  );
}
