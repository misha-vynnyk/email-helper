import React from "react";
import { Box, ToggleButton, ToggleButtonGroup, Chip, Tooltip } from "@mui/material";
import { ImageFormat } from "../types";

interface FormatTabsSelectorProps {
  value: ImageFormat;
  onChange: (format: ImageFormat) => void;
  disabled?: boolean;
}

// Format metadata with descriptions and recommendations
const FORMAT_INFO: Record<ImageFormat, { label: string; description: string; recommended?: boolean }> = {
  jpeg: {
    label: "JPG",
    description: "Universal compatibility, good for photos",
  },
  webp: {
    label: "WebP",
    description: "Best compression with quality, 30% smaller than JPG",
    recommended: true,
  },
  avif: {
    label: "AVIF",
    description: "Next-gen format, 50% smaller, limited support",
  },
  png: {
    label: "PNG",
    description: "Lossless, supports transparency",
  },
  gif: {
    label: "GIF",
    description: "Animated images, limited colors",
  },
};

const FormatTabsSelector: React.FC<FormatTabsSelectorProps> = ({ value, onChange, disabled = false }) => {
  // Explicit format order to ensure consistency
  const formats: ImageFormat[] = ["jpeg", "webp", "avif", "png", "gif"];

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    // Ensure newValue is a valid ImageFormat
    if (formats.includes(newValue as ImageFormat)) {
      onChange(newValue as ImageFormat);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => newValue && handleChange(null as any, newValue)}
        fullWidth
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            py: 1.5,
            transition: "all 0.2s",
            border: "1px solid",
            borderColor: "divider",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            "&.Mui-selected": {
              fontWeight: 600,
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
          },
        }}
      >
        {formats.map((format) => {
          const info = FORMAT_INFO[format];
          return (
            <Tooltip
              key={format}
              title={info.description}
              placement="top"
              arrow
              enterDelay={300}
            >
              <ToggleButton
                value={format}
                disabled={disabled}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  {info.label}
                  {info.recommended && (
                    <Chip
                      label="Best"
                      size="small"
                      color="success"
                      sx={{
                        height: 16,
                        fontSize: "0.625rem",
                        "& .MuiChip-label": {
                          px: 0.5,
                        },
                      }}
                    />
                  )}
                </Box>
              </ToggleButton>
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
};

export default FormatTabsSelector;
