import React from "react";
import { Box, Button, Chip, Stack, Tooltip, useTheme, alpha } from "@mui/material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
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
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const formats: ImageFormat[] = ["jpeg", "webp", "avif", "png", "gif"];

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {formats.map((format) => {
        const info = FORMAT_INFO[format];
        const isSelected = value === format;

        return (
          <Tooltip key={format} title={info.description} placement="top" arrow enterDelay={300}>
            <Button
              variant={isSelected ? "contained" : "outlined"}
              onClick={() => !disabled && onChange(format)}
              disabled={disabled}
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: isSelected ? 600 : 500,
                fontSize: "0.8125rem",
                px: 2,
                py: 0.75,
                borderRadius: componentStyles.card.borderRadius,
                minWidth: "auto",
                position: "relative",
                border: isSelected
                  ? `1px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
                backgroundColor: isSelected
                  ? theme.palette.primary.main
                  : "transparent",
                color: isSelected
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                boxShadow: isSelected
                  ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                  : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: isSelected
                    ? theme.palette.primary.dark
                    : alpha(theme.palette.action.hover, 0.5),
                  borderColor: isSelected
                    ? theme.palette.primary.dark
                    : theme.palette.primary.main,
                  transform: "translateY(-1px)",
                  boxShadow: isSelected
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                    : `0 2px 4px ${alpha(theme.palette.action.hover, 0.3)}`,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  position: "relative",
                }}
              >
                {info.label}
                {info.recommended && (
                  <Chip
                    label="Best"
                    size="small"
                    color={isSelected ? "default" : "success"}
                    sx={{
                      height: 18,
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      px: 0.5,
                      backgroundColor: isSelected
                        ? alpha(theme.palette.common.white, 0.2)
                        : theme.palette.success.main,
                      color: isSelected
                        ? theme.palette.common.white
                        : theme.palette.success.contrastText,
                      "& .MuiChip-label": {
                        px: 0.75,
                        lineHeight: 1.2,
                      },
                    }}
                  />
                )}
              </Box>
            </Button>
          </Tooltip>
        );
      })}
    </Stack>
  );
};

export default FormatTabsSelector;
