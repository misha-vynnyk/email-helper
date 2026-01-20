import React from "react";
import { Box, Typography, Chip, useTheme } from "@mui/material";
import { TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { ConversionSettings } from "../types";
import {
  estimateOutputSize,
  formatFileSize,
  calculateCompressionRatio,
} from "../utils/estimatedSizeCalculator";

interface EstimatedSizeIndicatorProps {
  originalSize: number;
  originalFormat: string;
  settings: ConversionSettings;
  disabled?: boolean; // True if multiple files selected
}

const EstimatedSizeIndicator: React.FC<EstimatedSizeIndicatorProps> = ({
  originalSize,
  originalFormat,
  settings,
  disabled = false,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  // If disabled (multiple files selected), show disabled state
  if (disabled) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: componentStyles.card.borderRadius,
          backgroundColor: theme.palette.action.disabledBackground,
          border: componentStyles.card.border,
          opacity: 0.6,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Estimated Output Size
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select only ONE file to see size estimation
        </Typography>
      </Box>
    );
  }

  // Validate inputs
  if (!originalSize || originalSize === 0) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: componentStyles.card.borderRadius,
          backgroundColor: theme.palette.action.disabledBackground,
          border: componentStyles.card.border,
          opacity: 0.6,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Estimated Output Size
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a file to see size estimation
        </Typography>
      </Box>
    );
  }

  // Handle missing originalFormat with fallback
  const effectiveFormat = originalFormat || `image/${settings.format}`;

  const estimatedSize = estimateOutputSize(originalSize, effectiveFormat, settings);

  // Validate estimation result
  if (!estimatedSize || estimatedSize === 0 || isNaN(estimatedSize)) {
    return null;
  }

  const compressionRatio = calculateCompressionRatio(originalSize, estimatedSize);
  const isSmaller = estimatedSize < originalSize;
  const sizeDiff = Math.abs(originalSize - estimatedSize);

  // Detect if likely animated GIF
  const isGif = settings.format === "gif";
  const isLikelyAnimated = originalFormat.includes("gif") && originalSize > 1024 * 1024;
  const hasTargetSize = settings.targetFileSize !== undefined;

  // Determine background gradient based on compression quality using theme colors
  const getBackgroundColor = () => {
    if (compressionRatio > 50) {
      // Excellent compression - success gradient
      return `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`;
    }
    if (compressionRatio > 30) {
      // Good compression - primary gradient
      return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
    }
    if (compressionRatio > 0) {
      // Moderate compression - warning gradient
      return `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`;
    }
    // Larger file - error gradient
    return `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`;
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: componentStyles.card.borderRadius,
        background: getBackgroundColor(),
        color: theme.palette.common.white,
        transition: "all 0.3s ease",
        boxShadow: componentStyles.card.boxShadow,
        border: componentStyles.card.border,
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.95, display: "block", mb: 1.5, fontWeight: 500 }}>
        Estimated Output Size
      </Typography>

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {formatFileSize(estimatedSize)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mt: 0.5 }}>
            from {formatFileSize(originalSize)}
          </Typography>
        </Box>

        {isSmaller ? (
          <Chip
            icon={<TrendingDownIcon fontSize="small" />}
            label={`-${compressionRatio}%`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(4px)",
              color: theme.palette.common.white,
              fontWeight: 700,
              fontSize: "0.875rem",
              height: 28,
            }}
          />
        ) : (
          <Chip
            icon={<TrendingUpIcon fontSize="small" />}
            label={`+${Math.abs(compressionRatio)}%`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(4px)",
              color: theme.palette.common.white,
              fontWeight: 700,
              fontSize: "0.875rem",
              height: 28,
            }}
          />
        )}
      </Box>

      {/* Visual size comparison bar */}
      <Box
        sx={{
          position: "relative",
          height: 8,
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderRadius: 1,
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min(100, (estimatedSize / originalSize) * 100)}%`,
            backgroundColor: theme.palette.common.white,
            borderRadius: 1,
            transition: "width 0.5s ease",
          }}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {isSmaller ? `You'll save ${formatFileSize(sizeDiff)}` : `Size increases by ${formatFileSize(sizeDiff)}`}
        </Typography>
      </Box>

      {isGif && isLikelyAnimated && !hasTargetSize ? (
        <Typography
          variant="caption"
          sx={{ opacity: 0.9, display: "block", fontStyle: "italic", fontSize: "0.7rem" }}
        >
          ⚠️ <strong>Animated GIF:</strong> Compression varies greatly (±20-40% variance). Use "Target File Size" for
          more predictable results.
        </Typography>
      ) : (
        <Typography variant="caption" sx={{ opacity: 0.85, display: "block", fontStyle: "italic", fontSize: "0.7rem" }}>
          ⚠️ Estimate based on format, quality & settings. Actual may vary ±10-20%.
        </Typography>
      )}
    </Box>
  );
};

export default EstimatedSizeIndicator;
