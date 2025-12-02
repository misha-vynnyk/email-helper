import React from "react";
import {
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { ConversionSettings } from "../types";

interface GifOptimizationSettingsProps {
  settings: ConversionSettings;
  onUpdate: (settings: Partial<ConversionSettings>) => void;
}

const GifOptimizationSettings: React.FC<GifOptimizationSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  // Only show when format is GIF
  if (settings.format !== "gif") {
    return null;
  }

  const targetFileSizeMB = settings.targetFileSize
    ? (settings.targetFileSize / (1024 * 1024)).toFixed(2)
    : "";

  const handleTargetSizeChange = (value: string) => {
    if (value === "") {
      onUpdate({ targetFileSize: undefined });
    } else {
      const mb = parseFloat(value);
      if (!isNaN(mb) && mb >= 0.01 && mb <= 50) {
        onUpdate({ targetFileSize: Math.round(mb * 1024 * 1024) });
      }
    }
  };

  const handleFrameResizeToggle = (enabled: boolean) => {
    onUpdate({
      gifFrameResize: {
        ...settings.gifFrameResize,
        enabled,
      },
    });
  };

  const handleFrameWidthChange = (value: string) => {
    if (value === "") {
      onUpdate({
        gifFrameResize: {
          ...settings.gifFrameResize,
          width: undefined,
        },
      });
    } else {
      const width = parseInt(value);
      if (!isNaN(width) && width >= 16) {
        onUpdate({
          gifFrameResize: {
            ...settings.gifFrameResize,
            width,
          },
        });
      }
    }
  };

  const handleFrameHeightChange = (value: string) => {
    if (value === "") {
      onUpdate({
        gifFrameResize: {
          ...settings.gifFrameResize,
          height: undefined,
        },
      });
    } else {
      const height = parseInt(value);
      if (!isNaN(height) && height >= 16) {
        onUpdate({
          gifFrameResize: {
            ...settings.gifFrameResize,
            height,
          },
        });
      }
    }
  };

  const handleAspectRatioToggle = (preserveAspectRatio: boolean) => {
    onUpdate({
      gifFrameResize: {
        ...settings.gifFrameResize,
        preserveAspectRatio,
      },
    });
  };

  const gifFrameResize = settings.gifFrameResize || {
    enabled: false,
    preserveAspectRatio: true,
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        GIF Optimization
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        GIF optimization uses Gifsicle for advanced compression. You can target a specific
        file size or adjust quality manually.
      </Alert>

      {/* Target File Size */}
      <TextField
        fullWidth
        type="number"
        label="Target File Size (MB)"
        value={targetFileSizeMB}
        onChange={(e) => handleTargetSizeChange(e.target.value)}
        inputProps={{
          min: 0.01,
          max: 50,
          step: 0.1,
        }}
        helperText="Optional: Optimize GIF to specific file size (0.01 - 50 MB). Leave empty to use quality setting."
        sx={{ mb: 2 }}
      />

      {/* Frame Resize */}
      <FormControlLabel
        control={
          <Checkbox
            checked={gifFrameResize.enabled}
            onChange={(e) => handleFrameResizeToggle(e.target.checked)}
          />
        }
        label="Resize GIF Frames"
      />

      <Collapse in={gifFrameResize.enabled}>
        <Box sx={{ pl: 4, mt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              type="number"
              label="Frame Width (px)"
              value={gifFrameResize.width || ""}
              onChange={(e) => handleFrameWidthChange(e.target.value)}
              inputProps={{
                min: 16,
                step: 1,
              }}
              helperText="Min: 16px"
              sx={{ flex: 1 }}
            />

            <TextField
              type="number"
              label="Frame Height (px)"
              value={gifFrameResize.height || ""}
              onChange={(e) => handleFrameHeightChange(e.target.value)}
              inputProps={{
                min: 16,
                step: 1,
              }}
              helperText="Min: 16px"
              sx={{ flex: 1 }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={gifFrameResize.preserveAspectRatio}
                onChange={(e) => handleAspectRatioToggle(e.target.checked)}
              />
            }
            label="Preserve Aspect Ratio"
          />

          {!gifFrameResize.width && !gifFrameResize.height && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Please specify at least width or height to resize frames.
            </Alert>
          )}
        </Box>
      </Collapse>

      {/* Show estimated compression info */}
      {settings.targetFileSize && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Target size: {(settings.targetFileSize / (1024 * 1024)).toFixed(2)} MB
          <br />
          The optimizer will use binary search to find the best quality within ±5% of target.
        </Alert>
      )}
    </Box>
  );
};

export default GifOptimizationSettings;
