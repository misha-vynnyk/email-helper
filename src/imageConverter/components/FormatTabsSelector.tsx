import React from "react";
import { Box, Tab, Tabs, Chip, Tooltip } from "@mui/material";
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
  const handleChange = (_event: React.SyntheticEvent, newValue: ImageFormat) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          minHeight: 48,
          "& .MuiTab-root": {
            minHeight: 48,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            "&.Mui-selected": {
              fontWeight: 600,
            },
          },
        }}
      >
        {(Object.keys(FORMAT_INFO) as ImageFormat[]).map((format) => {
          const info = FORMAT_INFO[format];
          return (
            <Tooltip
              key={format}
              title={info.description}
              placement="top"
              arrow
              enterDelay={300}
            >
              <Tab
                label={
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
                }
                value={format}
                disabled={disabled}
              />
            </Tooltip>
          );
        })}
      </Tabs>
    </Box>
  );
};

export default FormatTabsSelector;

