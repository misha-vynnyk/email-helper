/**
 * Preview Settings Component
 * Allows users to configure preview dimensions and scale
 */

import React, { useState } from 'react';

import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

export interface PreviewConfig {
  cardWidth: number;
  cardHeight: number;
  containerHeight: number; // Fixed container height for preview cards
  dialogMaxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const DEFAULT_CONFIG: PreviewConfig = {
  cardWidth: 600, // Typical email width
  cardHeight: 2000, // Typical email height
  containerHeight: 300, // Preview card container height
  dialogMaxWidth: 'lg',
};

const STORAGE_KEY = 'template-preview-config';

export function loadPreviewConfig(): PreviewConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load preview config:', error);
  }
  return DEFAULT_CONFIG;
}

export function savePreviewConfig(config: PreviewConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save preview config:', error);
  }
}

interface PreviewSettingsProps {
  config: PreviewConfig;
  onChange: (config: PreviewConfig) => void;
}

export default function PreviewSettings({ config, onChange }: PreviewSettingsProps) {
  const [open, setOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<PreviewConfig>(config);

  const handleOpen = () => {
    setTempConfig(config);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    onChange(tempConfig);
    savePreviewConfig(tempConfig);
    setOpen(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
  };

  // Calculate auto scale based on container height
  const autoScale = tempConfig.containerHeight / tempConfig.cardHeight;

  const calculatedCardSize = {
    width: Math.round(tempConfig.cardWidth * autoScale),
    height: tempConfig.containerHeight,
  };

  return (
    <>
      <Tooltip title="Preview Settings">
        <IconButton size="small" onClick={handleOpen}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
        <DialogTitle>Preview Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Preview Container Height */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Preview Card Height
              </Typography>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block" mb={2}>
                Height of preview cards - templates will auto-scale to fit this height
              </Typography>
              <TextField
                label="Container Height (px)"
                type="number"
                size="small"
                value={tempConfig.containerHeight}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, containerHeight: Math.max(150, parseInt(e.target.value) || 300) })
                }
                inputProps={{ min: 150, max: 600, step: 50 }}
                fullWidth
                helperText="Templates will be scaled to fit this height (150-600px)"
              />
            </Box>

            {/* Template Dimensions */}
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Template Dimensions
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block" mb={2}>
              Expected template size (typical emails: 600×1500-2000px)
            </Typography>

            <Box display="flex" gap={2} mb={3}>
              <TextField
                label="Width (px)"
                type="number"
                size="small"
                value={tempConfig.cardWidth}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, cardWidth: Math.max(100, parseInt(e.target.value) || 600) })
                }
                inputProps={{ min: 100, max: 1200, step: 50 }}
                fullWidth
              />
              <TextField
                label="Height (px)"
                type="number"
                size="small"
                value={tempConfig.cardHeight}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, cardHeight: Math.max(100, parseInt(e.target.value) || 600) })
                }
                inputProps={{ min: 100, max: 1200, step: 50 }}
                fullWidth
              />
            </Box>

            {/* Calculated Result */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                mb: 3,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Result Card Preview Size:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {calculatedCardSize.width}px × {calculatedCardSize.height}px
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                ({tempConfig.cardWidth}px × {tempConfig.cardHeight}px scaled to {(autoScale * 100).toFixed(1)}
                %)
              </Typography>
              <Typography variant="caption" color="success.main" display="block" mt={1} fontWeight={500}>
                ✓ Full template visible! Auto-scaled from {tempConfig.cardHeight}px to {tempConfig.containerHeight}px
              </Typography>
            </Box>

            {/* Dialog Size */}
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Full Preview Dialog Size
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block" mb={1}>
              Size of the popup when you click a card
            </Typography>

            <Box display="flex" gap={1} flexWrap="wrap">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <Button
                  key={size}
                  variant={tempConfig.dialogMaxWidth === size ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setTempConfig({ ...tempConfig, dialogMaxWidth: size })}
                >
                  {size.toUpperCase()}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} color="secondary">
            Reset to Defaults
          </Button>
          <Box flex={1} />
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
