import { useState } from "react";

import { DownloadOutlined, ExpandLess, ExpandMore, Settings as SettingsIcon, UploadOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { PRESETS, PRESET_ORDER } from "../constants/presets";
import { useImageConverter } from "../context/ImageConverterContext";
import { ImageFormat, ResizeMode } from "../types";
import { exportSettings, importSettings } from "../utils/settingsManager";

import CompressionModeSelector from "./CompressionModeSelector";
import DimensionOptimizer from "./DimensionOptimizer";
import GifOptimizationSettings from "./GifOptimizationSettings";

export default function ConversionSettings() {
  const { settings, updateSettings } = useImageConverter();
  const [expanded, setExpanded] = useState(false);

  const qualityLabel = settings.compressionMode;
  const outputFormatLabel = settings.format;

  const handlePresetChange = (presetId: string) => {
    const preset = PRESETS[presetId];
    if (!preset) return;

    updateSettings({
      selectedPreset: presetId,
      format: preset.format,
      quality: preset.quality,
      compressionMode: preset.compressionMode,
      preserveFormat: preset.preserveFormat || false,
      resize: {
        ...settings.resize,
        mode: preset.maxWidth ? "preset" : "original",
        preset: preset.maxWidth,
      },
    });
  };

  const handleExport = () => {
    exportSettings(settings, settings.selectedPreset || 'custom');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedSettings = await importSettings(file);
      updateSettings(importedSettings);
      alert('Settings imported successfully!');
    } catch (error) {
      alert(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset input
    event.target.value = '';
  };
  return (
    <Paper
      elevation={2}
      sx={{ p: 2, borderRadius: 5 }}
    >
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={expanded ? 2 : 0}
      >
        <Box
          display='flex'
          alignItems='center'
          gap={1}
        >
          <SettingsIcon />
          <Typography variant='h6'>Settings</Typography>
        </Box>
        <Typography
          color='text.secondary'
          sx={{ textTransform: "capitalize" }}
        >
          {qualityLabel}
        </Typography>
        <Typography
          color='text.secondary'
          sx={{ textTransform: "capitalize" }}
        >
          {outputFormatLabel}
        </Typography>
        <IconButton
          size='small'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          display='flex'
          flexDirection='column'
          gap={3}
        >
          {/* Preset Profiles */}
          <Box>
            <Typography
              variant='subtitle2'
              gutterBottom
            >
              Presets
            </Typography>
            <Select
              value={settings.selectedPreset || ""}
              onChange={(e) => handlePresetChange(e.target.value)}
              displayEmpty
              fullWidth
              size='small'
              sx={{ borderRadius: 5 }}
            >
              <MenuItem value=''>
                <em>Custom Settings</em>
              </MenuItem>
              {PRESET_ORDER.map((presetId) => {
                const preset = PRESETS[presetId];
                return (
                  <MenuItem
                    key={presetId}
                    value={presetId}
                  >
                    <Box>
                      <Typography variant='body2'>{preset.name}</Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {preset.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </Box>

          {/* Compression Mode */}
          <CompressionModeSelector />

          {/* Preserve Format Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.preserveFormat}
                  onChange={(e) => updateSettings({ preserveFormat: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>Preserve original format</Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Keep the original image format (PNG stays PNG, JPEG stays JPEG)
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Output Format - Only show if preserveFormat is disabled */}
          {!settings.preserveFormat && (
            <Box>
              <Typography
                variant='subtitle2'
                gutterBottom
              >
                Output Format
              </Typography>
              <ToggleButtonGroup
                value={settings.format}
                exclusive
                onChange={(_, value) => value && updateSettings({ format: value as ImageFormat })}
                fullWidth
                size='small'
              >
                <ToggleButton value='jpeg'>JPG</ToggleButton>
                <ToggleButton value='webp'>WebP</ToggleButton>
                <ToggleButton value='avif'>AVIF</ToggleButton>
                <ToggleButton value='png'>PNG</ToggleButton>
                <ToggleButton value='gif'>GIF</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Auto Quality Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.autoQuality}
                  onChange={(e) => updateSettings({ autoQuality: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>Auto Quality</Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Automatically calculate optimal quality based on image properties
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Preserve EXIF Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.preserveExif}
                  onChange={(e) => updateSettings({ preserveExif: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>Preserve EXIF Metadata</Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    Keep camera info, location, and other metadata (may increase file size)
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Quality Slider - Only for Balanced mode and when auto quality is off */}
          {settings.compressionMode === "balanced" && !settings.autoQuality && (
            <Box sx={{ margin: "10px" }}>
              <Typography
                variant='subtitle2'
                gutterBottom
              >
                Quality: {settings.quality}%
              </Typography>
              <Slider
                value={settings.quality}
                onChange={(_, value) => updateSettings({ quality: value as number })}
                min={1}
                max={100}
                marks={[
                  { value: 1, label: "1%" },
                  { value: 50, label: "50%" },
                  { value: 100, label: "100%" },
                ]}
              />
            </Box>
          )}

          <Box
            sx={{
              borderRadius: 5,
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
              flexDirection: "row",
            }}
          >
            {/* Background Color (for formats without transparency) */}
            {settings.format === "jpeg" && (
              <Box>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                >
                  Background Color (for transparency)
                </Typography>
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1}
                  sx={{
                    borderRadius: 5,
                    border: "1px solid #e0e0e0",
                    padding: 1,
                  }}
                >
                  <input
                    type='color'
                    value={settings.backgroundColor}
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                    style={{
                      width: 50,
                      height: 40,
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 5,
                    }}
                  />
                  <TextField
                    value={settings.backgroundColor}
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                    size='small'
                    placeholder='#FFFFFF'
                    sx={{ borderRadius: 5 }}
                  />
                </Box>
              </Box>
            )}

            {/* Resize Options */}
            <Box>
              <Typography
                variant='subtitle2'
                gutterBottom
              >
                Resize
              </Typography>
              <Select
                value={settings.resize.mode}
                onChange={(e) =>
                  updateSettings({
                    resize: { ...settings.resize, mode: e.target.value as ResizeMode },
                  })
                }
                sx={{ borderRadius: 5 }}
                fullWidth
                size='small'
              >
                <MenuItem value='original'>Original Size</MenuItem>
                <MenuItem value='preset'>Preset Size</MenuItem>
                <MenuItem value='custom'>Custom Size</MenuItem>
              </Select>

              {settings.resize.mode === "preset" && (
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
                    size='small'
                  >
                    <ToggleButton value={1920}>1920px</ToggleButton>
                    <ToggleButton value={1200}>1200px</ToggleButton>
                    <ToggleButton value={800}>800px</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {settings.resize.mode === "custom" && (
                <Box
                  mt={1}
                  display='flex'
                  flexDirection='column'
                  gap={1}
                >
                  <Box
                    display='flex'
                    gap={1}
                  >
                    <TextField
                      label='Width (px)'
                      type='number'
                      value={settings.resize.width || ""}
                      onChange={(e) =>
                        updateSettings({
                          resize: {
                            ...settings.resize,
                            width: Number(e.target.value) || undefined,
                          },
                        })
                      }
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='Height (px)'
                      type='number'
                      value={settings.resize.height || ""}
                      onChange={(e) =>
                        updateSettings({
                          resize: {
                            ...settings.resize,
                            height: Number(e.target.value) || undefined,
                          },
                        })
                      }
                      size='small'
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
                        size='small'
                      />
                    }
                    label='Preserve aspect ratio'
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* GIF Optimization Settings */}
          <GifOptimizationSettings settings={settings} onUpdate={updateSettings} />

          {/* Export/Import Settings */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              Settings Profiles
            </Typography>
            <Stack direction='row' spacing={1}>
              <Button
                variant='outlined'
                size='small'
                startIcon={<DownloadOutlined />}
                onClick={handleExport}
                fullWidth
              >
                Export
              </Button>
              <Button
                variant='outlined'
                size='small'
                component='label'
                startIcon={<UploadOutlined />}
                fullWidth
              >
                Import
                <input
                  type='file'
                  accept='.json'
                  hidden
                  onChange={handleImport}
                />
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
