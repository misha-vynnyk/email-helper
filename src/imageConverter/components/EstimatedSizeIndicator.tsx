import React from "react";
import { Box, Typography, LinearProgress, Chip } from "@mui/material";
import { TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material";
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
}

const EstimatedSizeIndicator: React.FC<EstimatedSizeIndicatorProps> = ({
  originalSize,
  originalFormat,
  settings,
}) => {
  if (!originalSize || originalSize === 0) {
    return null;
  }

  const estimatedSize = estimateOutputSize(originalSize, originalFormat, settings);
  const compressionRatio = calculateCompressionRatio(originalSize, estimatedSize);
  const isSmaller = estimatedSize < originalSize;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mb: 1 }}>
        💡 Estimated Output
      </Typography>

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {formatFileSize(estimatedSize)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            from {formatFileSize(originalSize)}
          </Typography>
        </Box>

        {isSmaller ? (
          <Chip
            icon={<TrendingDownIcon />}
            label={`-${compressionRatio}%`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontWeight: 600,
            }}
          />
        ) : (
          <Chip
            icon={<TrendingUpIcon />}
            label={`+${Math.abs(compressionRatio)}%`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={Math.min(100, (estimatedSize / originalSize) * 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "white",
          },
        }}
      />

      <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
        ⚠️ This is an estimate. Actual size may vary.
      </Typography>
    </Box>
  );
};

export default EstimatedSizeIndicator;

