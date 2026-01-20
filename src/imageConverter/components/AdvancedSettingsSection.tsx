import React from "react";
import {
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  Collapse,
  Alert,
} from "@mui/material";
import {
  PhotoSizeSelectLarge as ResizeIcon,
  CameraAlt as ExifIcon,
  Palette as ColorIcon,
  Gif as GifIcon,
} from "@mui/icons-material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { ConversionSettings, ResizeMode } from "../types";

interface AdvancedSettingsSectionProps {
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
}

const AdvancedSettingsSection: React.FC<AdvancedSettingsSectionProps> = ({
  settings,
  updateSettings,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Resize Options */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <ResizeIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            Resize
          </Typography>
        </Box>
        <Select
          value={settings.resize.mode}
          onChange={(e) =>
            updateSettings({
              resize: { ...settings.resize, mode: e.target.value as ResizeMode },
            })
          }
          sx={{ borderRadius: componentStyles.card.borderRadius }}
          fullWidth
          size="small"
        >
          <MenuItem value="original">Original Size</MenuItem>
          <MenuItem value="preset">Preset Size</MenuItem>
          <MenuItem value="custom">Custom Size</MenuItem>
        </Select>

        {settings.resize.mode === "preset" && (
          <Box mt={1.5}>
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
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: componentStyles.card.borderRadius,
                  textTransform: "none",
                },
              }}
            >
              <ToggleButton value={1920}>1920px</ToggleButton>
              <ToggleButton value={1200}>1200px</ToggleButton>
              <ToggleButton value={800}>800px</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {settings.resize.mode === "custom" && (
          <Box mt={1.5} display="flex" flexDirection="column" gap={1.5}>
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
                sx={{ borderRadius: componentStyles.card.borderRadius }}
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
                sx={{ borderRadius: componentStyles.card.borderRadius }}
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
              label={
                <Typography variant="body2" color="text.primary">
                  Preserve aspect ratio
                </Typography>
              }
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* EXIF Metadata */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <ExifIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            EXIF Metadata
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.preserveExif}
              onChange={(e) => updateSettings({ preserveExif: e.target.checked })}
              size="small"
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500} color="text.primary">
                Preserve EXIF Data
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Keep camera info, location, and other metadata
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Background Color (for JPEG) */}
      {settings.format === "jpeg" && (
        <>
          <Divider />
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <ColorIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                Background Color
              </Typography>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{
                borderRadius: componentStyles.card.borderRadius,
                border: componentStyles.card.border,
                padding: 1.5,
                backgroundColor: componentStyles.card.background || alpha(theme.palette.background.paper, 0.5),
                backdropFilter: componentStyles.card.backdropFilter,
                WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
              }}
            >
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                style={{
                  width: 50,
                  height: 40,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  borderRadius: componentStyles.card.borderRadius,
                  backgroundColor: "transparent",
                }}
              />
              <TextField
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                size="small"
                placeholder="#FFFFFF"
                sx={{ borderRadius: componentStyles.card.borderRadius }}
                fullWidth
              />
            </Box>
          </Box>
        </>
      )}

      {/* GIF Optimization (for GIF format) */}
      {settings.format === "gif" && (
        <>
          <Divider />
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <GifIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                GIF Optimization
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2, borderRadius: componentStyles.card.borderRadius }}>
              Server-side GIF optimization with Gifsicle
            </Alert>

            {/* Target File Size */}
            <TextField
              fullWidth
              type="number"
              label="Target File Size (MB)"
              value={
                settings.targetFileSize
                  ? (settings.targetFileSize / (1024 * 1024)).toFixed(2)
                  : ""
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  updateSettings({ targetFileSize: undefined });
                } else {
                  const mb = parseFloat(value);
                  if (!isNaN(mb) && mb >= 0.01 && mb <= 50) {
                    updateSettings({ targetFileSize: Math.round(mb * 1024 * 1024) });
                  }
                }
              }}
              inputProps={{
                min: 0.01,
                max: 50,
                step: 0.1,
              }}
              helperText="Auto-optimize to target size (0.01 - 50 MB)"
              size="small"
              sx={{ mb: 2, borderRadius: componentStyles.card.borderRadius }}
            />

            {/* Frame Resize */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.gifFrameResize?.enabled || false}
                  onChange={(e) =>
                    updateSettings({
                      gifFrameResize: {
                        ...settings.gifFrameResize,
                        enabled: e.target.checked,
                        preserveAspectRatio: settings.gifFrameResize?.preserveAspectRatio ?? true,
                      },
                    })
                  }
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Resize GIF Frames
                </Typography>
              }
            />

            <Collapse in={settings.gifFrameResize?.enabled || false}>
              <Box sx={{ pl: 4, mt: 1.5 }}>
                <Box display="flex" gap={1} mb={1.5}>
                  <TextField
                    type="number"
                    label="Width (px)"
                    value={settings.gifFrameResize?.width || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSettings({
                        gifFrameResize: {
                          ...settings.gifFrameResize,
                          enabled: settings.gifFrameResize?.enabled ?? false,
                          preserveAspectRatio: settings.gifFrameResize?.preserveAspectRatio ?? true,
                          width: value === "" ? undefined : parseInt(value) || undefined,
                        },
                      });
                    }}
                    inputProps={{ min: 16 }}
                    size="small"
                    sx={{ flex: 1, borderRadius: componentStyles.card.borderRadius }}
                  />
                  <TextField
                    type="number"
                    label="Height (px)"
                    value={settings.gifFrameResize?.height || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSettings({
                        gifFrameResize: {
                          ...settings.gifFrameResize,
                          enabled: settings.gifFrameResize?.enabled ?? false,
                          preserveAspectRatio: settings.gifFrameResize?.preserveAspectRatio ?? true,
                          height: value === "" ? undefined : parseInt(value) || undefined,
                        },
                      });
                    }}
                    inputProps={{ min: 16 }}
                    size="small"
                    sx={{ flex: 1, borderRadius: componentStyles.card.borderRadius }}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.gifFrameResize?.preserveAspectRatio ?? true}
                      onChange={(e) =>
                        updateSettings({
                          gifFrameResize: {
                            ...settings.gifFrameResize,
                            enabled: settings.gifFrameResize?.enabled ?? false,
                            preserveAspectRatio: e.target.checked,
                          },
                        })
                      }
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.primary">
                      Preserve aspect ratio
                    </Typography>
                  }
                />
              </Box>
            </Collapse>

            {settings.targetFileSize && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: componentStyles.card.borderRadius }}>
                Target: {(settings.targetFileSize / (1024 * 1024)).toFixed(2)} MB
              </Alert>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdvancedSettingsSection;
