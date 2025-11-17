import React from "react";

import {
  Compress as CompressIcon,
  HighQuality as QualityIcon,
  Speed as BalancedIcon,
} from "@mui/icons-material";
import { Box, MenuItem, Select, Tooltip, Typography } from "@mui/material";

import { useImageConverter } from "../context/ImageConverterContext";
import { CompressionMode } from "../types";

const compressionModes = [
  {
    value: "balanced" as CompressionMode,
    label: "Balanced",
    icon: <BalancedIcon />,
    description: "Good balance, manual quality control",
    details: "Standard compression. You can adjust quality manually with slider below.",
  },
  {
    value: "maximum-quality" as CompressionMode,
    label: "Maximum Quality",
    icon: <QualityIcon />,
    description: "Best visual quality (auto quality: 90%+)",
    details:
      "Uses advanced algorithms (mozjpeg, near-lossless). Quality automatically set to 90%+.",
  },
  {
    value: "maximum-compression" as CompressionMode,
    label: "Maximum Compression",
    icon: <CompressIcon />,
    description: "Smallest file size (auto quality: ~75%)",
    details: "Aggressive compression. Quality automatically optimized for maximum size reduction.",
  },
  {
    value: "lossless" as CompressionMode,
    label: "Lossless",
    icon: <QualityIcon />,
    description: "No quality loss (quality: 100%)",
    details: "Perfect quality preservation (PNG/WebP/AVIF only). Larger files, pixel-perfect.",
  },
];

export default function CompressionModeSelector() {
  const { settings, updateSettings } = useImageConverter();

  const currentMode = compressionModes.find((m) => m.value === settings.compressionMode);

  const isLosslessAvailable = settings.format === "png" || settings.format === "webp";

  return (
    <Box>
      <Typography
        variant='subtitle2'
        gutterBottom
      >
        Compression Mode
      </Typography>
      <Select
        value={settings.compressionMode}
        onChange={(e) => updateSettings({ compressionMode: e.target.value as CompressionMode })}
        fullWidth
        size='small'
        sx={{ borderRadius: 5 }}
      >
        {compressionModes.map((mode) => (
          <MenuItem
            key={mode.value}
            value={mode.value}
            disabled={mode.value === "lossless" && !isLosslessAvailable}
          >
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              {mode.icon}
              <Box>
                <Typography
                  variant='body2'
                  fontWeight={500}
                >
                  {mode.label}
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  {mode.description}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>

      {currentMode && (
        <Tooltip title={currentMode.details}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mt: 1, display: "block" }}
          >
            ℹ️ {currentMode.details}
          </Typography>
        </Tooltip>
      )}

      {settings.compressionMode === "lossless" && !isLosslessAvailable && (
        <Typography
          variant='caption'
          color='warning.main'
          sx={{ mt: 1, display: "block" }}
        >
          ⚠️ Lossless mode only available for PNG and WebP formats
        </Typography>
      )}

      {settings.compressionMode === "maximum-quality" && settings.processingMode === "client" && (
        <Typography
          variant='caption'
          color='info.main'
          sx={{ mt: 1, display: "block" }}
        >
          💡 Switch to Server mode for best results with Maximum Quality
        </Typography>
      )}
    </Box>
  );
}
