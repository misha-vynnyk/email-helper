import React, { useState } from "react";

import { DeleteOutline, DownloadOutlined, ExpandLess, ExpandMore, Settings as SettingsIcon, UploadOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { PRESETS } from "../constants/presets";
import { useImageConverter } from "../context/ImageConverterContext";
import { imageCache } from "../utils/imageCache";
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
  const [cacheStats, setCacheStats] = useState<{ count: number; sizeFormatted: string } | null>(null);

  // Load cache stats when settings expand
  React.useEffect(() => {
    if (expanded) {
      imageCache.getStats().then(setCacheStats);
    }
  }, [expanded]);

  const handleClearCache = async () => {
    await imageCache.clear();
    setCacheStats({ count: 0, sizeFormatted: '0 B' });
  };

  // Get selected file for estimation (only ONE file should be selected)
  const selectedFilesIds = files.filter(f => f.selected).map(f => f.id).join(',');

  const { originalSize, originalFormat, isMultipleSelected, hasSelection } = React.useMemo(() => {
    const selectedFiles = files.filter(f => f.selected);

    if (selectedFiles.length === 0) {
      return { originalSize: 0, originalFormat: "", isMultipleSelected: false, hasSelection: false };
    }

    if (selectedFiles.length > 1) {
      return { originalSize: 0, originalFormat: "", isMultipleSelected: true, hasSelection: true };
    }

    const selectedFile = selectedFiles[0];
    return {
      originalSize: selectedFile.originalSize || 0,
      originalFormat: selectedFile.file?.type || "",
      isMultipleSelected: false,
      hasSelection: true
    };
  }, [files, selectedFilesIds]);

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
          {hasSelection && (
            <EstimatedSizeIndicator
              originalSize={originalSize}
              originalFormat={originalFormat}
              settings={settings}
              disabled={isMultipleSelected}
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

          {/* Cache Management */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              🗄️ Conversion Cache
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Typography variant='body2' color='text.secondary' sx={{ flex: 1 }}>
                {cacheStats ? `${cacheStats.count} items (${cacheStats.sizeFormatted})` : 'Loading...'}
              </Typography>
              <Tooltip title='Clear all cached conversions'>
                <Button
                  variant='outlined'
                  size='small'
                  color='warning'
                  startIcon={<DeleteOutline />}
                  onClick={handleClearCache}
                  disabled={!cacheStats || cacheStats.count === 0}
                >
                  Clear Cache
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
