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

import AdvancedSettingsSection from "./AdvancedSettingsSection";
import CompressionModeSelector from "./CompressionModeSelector";
import DimensionOptimizer from "./DimensionOptimizer";
import EstimatedSizeIndicator from "./EstimatedSizeIndicator";
import FormatTabsSelector from "./FormatTabsSelector";
import GifOptimizationSettings from "./GifOptimizationSettings";
import QualityControl from "./QualityControl";
import QuickPresetsBar from "./QuickPresetsBar";

export default function ConversionSettings() {
  const { settings, updateSettings, files } = useImageConverter();
  const [expanded, setExpanded] = useState(false);

  // Get first file for size estimation
  const firstFile = files[0];
  const originalSize = firstFile?.originalSize || 0;
  const originalFormat = firstFile?.file.type || "";

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
          {/* Quick Presets Bar */}
          <QuickPresetsBar
            selectedPreset={settings.selectedPreset}
            onPresetSelect={handlePresetChange}
          />

          {/* Compression Mode Section */}
          <Box>
            <Typography variant='subtitle2' fontWeight={600} mb={1}>
              📊 Compression Mode
            </Typography>
            <CompressionModeSelector />
          </Box>

          {/* Format Options Section */}
          <Box>
            <Typography variant='subtitle2' fontWeight={600} mb={1}>
              🎨 Format Options
            </Typography>
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

          {/* Output Format - Modern Tabs Design */}
          {!settings.preserveFormat && (
            <Box>
              <Typography
                variant='subtitle2'
                gutterBottom
              >
                Output Format
              </Typography>
              <FormatTabsSelector
                value={settings.format}
                onChange={(format) => updateSettings({ format })}
              />
            </Box>
          )}

          {/* Quality Control - Modern Radio Design */}
          <QualityControl
            autoQuality={settings.autoQuality}
            quality={settings.quality}
            onAutoQualityChange={(auto) => updateSettings({ autoQuality: auto })}
            onQualityChange={(quality) => updateSettings({ quality })}
          />

          {/* Estimated Size Indicator */}
          {originalSize > 0 && (
            <EstimatedSizeIndicator
              originalSize={originalSize}
              originalFormat={originalFormat}
              settings={settings}
            />
          )}

          {/* Advanced Settings - Collapsible Section */}
          <AdvancedSettingsSection settings={settings} updateSettings={updateSettings} />

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
