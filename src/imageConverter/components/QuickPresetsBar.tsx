import React from "react";
import { Box, Chip, Typography, Tooltip } from "@mui/material";
import { 
  Email as EmailIcon,
  Language as WebIcon,
  Share as SocialIcon,
  Print as PrintIcon,
  PhotoSizeSelectLarge as ThumbnailIcon,
  HighQuality as LosslessIcon,
  Animation as GifIcon,
} from "@mui/icons-material";
import { PRESETS, PRESET_ORDER } from "../constants/presets";

interface QuickPresetsBarProps {
  selectedPreset?: string;
  onPresetSelect: (presetId: string) => void;
}

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.ReactNode> = {
  email: <EmailIcon fontSize="small" />,
  web: <WebIcon fontSize="small" />,
  social: <SocialIcon fontSize="small" />,
  print: <PrintIcon fontSize="small" />,
  thumbnail: <ThumbnailIcon fontSize="small" />,
  lossless: <LosslessIcon fontSize="small" />,
  gif: <GifIcon fontSize="small" />,
};

const QuickPresetsBar: React.FC<QuickPresetsBarProps> = ({ selectedPreset, onPresetSelect }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Quick Presets
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {PRESET_ORDER.map((presetId) => {
          const preset = PRESETS[presetId];
          const isSelected = selectedPreset === presetId;

          return (
            <Tooltip key={presetId} title={preset.description} placement="top" arrow>
              <Chip
                icon={PRESET_ICONS[presetId]}
                label={preset.name}
                onClick={() => onPresetSelect(presetId)}
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                sx={{
                  fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default QuickPresetsBar;

