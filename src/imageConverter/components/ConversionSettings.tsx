import React, { useState } from 'react';

import { ExpandLess, ExpandMore,Settings as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { useImageConverter } from '../context/ImageConverterContext';
import { ImageFormat, ResizeMode } from '../types';

import CompressionModeSelector from './CompressionModeSelector';

export default function ConversionSettings() {
  const { settings, updateSettings } = useImageConverter();
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={expanded ? 2 : 0}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          <Typography variant="h6">Conversion Settings</Typography>
        </Box>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Compression Mode */}
          <CompressionModeSelector />

          {/* Output Format */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Output Format
            </Typography>
            <ToggleButtonGroup
              value={settings.format}
              exclusive
              onChange={(_, value) => value && updateSettings({ format: value as ImageFormat })}
              fullWidth
              size="small"
            >
              <ToggleButton value="jpeg">JPG</ToggleButton>
              <ToggleButton value="webp">WebP</ToggleButton>
              <ToggleButton value="avif">AVIF</ToggleButton>
              <ToggleButton value="png">PNG</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Quality Slider - Only for Balanced mode */}
          {settings.compressionMode === 'balanced' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Quality: {settings.quality}%
              </Typography>
              <Slider
                value={settings.quality}
                onChange={(_, value) => updateSettings({ quality: value as number })}
                min={1}
                max={100}
                marks={[
                  { value: 1, label: '1%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Manual quality control (1-100%)
              </Typography>
            </Box>
          )}

          {/* Background Color (for formats without transparency) */}
          {settings.format === 'jpeg' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Background Color (for transparency)
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  style={{ width: 50, height: 40, border: 'none', cursor: 'pointer' }}
                />
                <TextField
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  size="small"
                  placeholder="#FFFFFF"
                />
              </Box>
            </Box>
          )}

          {/* Resize Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Resize
            </Typography>
            <Select
              value={settings.resize.mode}
              onChange={(e) =>
                updateSettings({
                  resize: { ...settings.resize, mode: e.target.value as ResizeMode },
                })
              }
              fullWidth
              size="small"
            >
              <MenuItem value="original">Original Size</MenuItem>
              <MenuItem value="preset">Preset Size</MenuItem>
              <MenuItem value="custom">Custom Size</MenuItem>
            </Select>

            {settings.resize.mode === 'preset' && (
              <Box mt={1}>
                <ToggleButtonGroup
                  value={settings.resize.preset}
                  exclusive
                  onChange={(_, value) =>
                    value &&
                    updateSettings({
                      resize: { ...settings.resize, preset: value as number },
                    })
                  }
                  fullWidth
                  size="small"
                >
                  <ToggleButton value={1920}>1920px</ToggleButton>
                  <ToggleButton value={1200}>1200px</ToggleButton>
                  <ToggleButton value={800}>800px</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {settings.resize.mode === 'custom' && (
              <Box mt={1} display="flex" flexDirection="column" gap={1}>
                <Box display="flex" gap={1}>
                  <TextField
                    label="Width (px)"
                    type="number"
                    value={settings.resize.width || ''}
                    onChange={(e) =>
                      updateSettings({
                        resize: { ...settings.resize, width: Number(e.target.value) || undefined },
                      })
                    }
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Height (px)"
                    type="number"
                    value={settings.resize.height || ''}
                    onChange={(e) =>
                      updateSettings({
                        resize: { ...settings.resize, height: Number(e.target.value) || undefined },
                      })
                    }
                    size="small"
                    fullWidth
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.resize.preserveAspectRatio}
                      onChange={(e) =>
                        updateSettings({
                          resize: { ...settings.resize, preserveAspectRatio: e.target.checked },
                        })
                      }
                      size="small"
                    />
                  }
                  label="Preserve aspect ratio"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
