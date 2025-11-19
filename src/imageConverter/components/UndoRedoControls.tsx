/**
 * Undo/Redo Controls
 * Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
 */

import React from 'react';

import { Redo as RedoIcon, Undo as UndoIcon } from '@mui/icons-material';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';

import { useImageConverter } from '../context/ImageConverterContext';

export default function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo } = useImageConverter();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
        History
      </Typography>
      
      <Tooltip title="Undo (Cmd/Ctrl+Z)">
        <span>
          <IconButton
            size="small"
            onClick={undo}
            disabled={!canUndo}
            sx={{
              '&:disabled': {
                opacity: 0.3,
              },
            }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Cmd/Ctrl+Shift+Z)">
        <span>
          <IconButton
            size="small"
            onClick={redo}
            disabled={!canRedo}
            sx={{
              '&:disabled': {
                opacity: 0.3,
              },
            }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
}

