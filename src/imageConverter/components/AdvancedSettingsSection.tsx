import React, { useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PhotoSizeSelectLarge as ResizeIcon,
  CameraAlt as ExifIcon,
  Palette as ColorIcon,
} from "@mui/icons-material";
import { ConversionSettings, ResizeMode } from "../types";
import GifOptimizationSettings from "./GifOptimizationSettings";

interface AdvancedSettingsSectionProps {
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
}

const AdvancedSettingsSection: React.FC<AdvancedSettingsSectionProps> = ({
  settings,
  updateSettings,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          p: 1,
          borderRadius: 1,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          ⚙️ Advanced Settings
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Resize Options */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ResizeIcon fontSize="small" color="action" />
              <Typography variant="subtitle2">Resize</Typography>
            </Box>
            <Select
              value={settings.resize.mode}
              onChange={(e) =>
                updateSettings({
                  resize: { ...settings.resize, mode: e.target.value as ResizeMode },
                })
              }
              sx={{ borderRadius: 5 }}
              fullWidth
              size="small"
            >
              <MenuItem value="original">Original Size</MenuItem>
              <MenuItem value="preset">Preset Size</MenuItem>
              <MenuItem value="custom">Custom Size</MenuItem>
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
                  size="small"
                >
                  <ToggleButton value={1920}>1920px</ToggleButton>
                  <ToggleButton value={1200}>1200px</ToggleButton>
                  <ToggleButton value={800}>800px</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {settings.resize.mode === "custom" && (
              <Box mt={1} display="flex" flexDirection="column" gap={1}>
                <Box display="flex" gap={1}>
                  <TextField
                    label="Width (px)"
                    type="number"
                    value={settings.resize.width || ""}
                    onChange={(e) =>
                      updateSettings({
                        resize: {
                          ...settings.resize,
                          width: Number(e.target.value) || undefined,
                        },
                      })
                    }
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Height (px)"
                    type="number"
                    value={settings.resize.height || ""}
                    onChange={(e) =>
                      updateSettings({
                        resize: {
                          ...settings.resize,
                          height: Number(e.target.value) || undefined,
                        },
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

          <Divider />

          {/* EXIF Metadata */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ExifIcon fontSize="small" color="action" />
              <Typography variant="subtitle2">EXIF Metadata</Typography>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.preserveExif}
                  onChange={(e) => updateSettings({ preserveExif: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Preserve EXIF Data</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Keep camera info, location, and other metadata
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {/* Background Color (for JPEG) */}
          {settings.format === "jpeg" && (
            <>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ColorIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">Background Color</Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{
                    borderRadius: 5,
                    border: "1px solid #e0e0e0",
                    padding: 1,
                  }}
                >
                  <input
                    type="color"
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
                    size="small"
                    placeholder="#FFFFFF"
                    sx={{ borderRadius: 5 }}
                    fullWidth
                  />
                </Box>
              </Box>
              <Divider />
            </>
          )}

          {/* GIF Optimization */}
          <GifOptimizationSettings settings={settings} onUpdate={updateSettings} />
        </Box>
      </Collapse>
    </Box>
  );
};

export default AdvancedSettingsSection;
