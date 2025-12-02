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
  // Validate inputs
  if (!originalSize || originalSize === 0) {
    return null;
  }

  // Handle missing originalFormat with fallback
  let effectiveFormat = originalFormat;
  if (!effectiveFormat || effectiveFormat.length === 0) {
    console.warn("[EstimatedSizeIndicator] Missing originalFormat, using fallback to settings format");
    effectiveFormat = `image/${settings.format}`; // e.g., "image/jpeg"
  }

  const estimatedSize = estimateOutputSize(originalSize, effectiveFormat, settings);

  // Validate estimation result
  if (!estimatedSize || estimatedSize === 0 || isNaN(estimatedSize)) {
    console.error("[EstimatedSizeIndicator] Invalid estimation result:", {
      originalSize,
      originalFormat,
      estimatedSize,
      settings: { format: settings.format, quality: settings.quality }
    });
    return null;
  }

  const compressionRatio = calculateCompressionRatio(originalSize, estimatedSize);
  const isSmaller = estimatedSize < originalSize;
  const sizeDiff = Math.abs(originalSize - estimatedSize);

  // Detect if likely animated GIF
  const isGif = settings.format === "gif";
  const isLikelyAnimated = originalFormat.includes("gif") && originalSize > 1024 * 1024;
  const hasTargetSize = settings.targetFileSize !== undefined;

  // Determine background gradient based on compression quality
  const getGradient = () => {
    if (compressionRatio > 50) return "linear-gradient(135deg, #10b981 0%, #059669 100%)"; // Excellent
    if (compressionRatio > 30) return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"; // Good
    if (compressionRatio > 0) return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"; // Moderate
    return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"; // Warning (larger)
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: getGradient(),
        color: "white",
        transition: "all 0.3s ease",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mb: 1 }}>
        💡 Estimated Output Size (per file average)
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
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          />
        ) : (
          <Chip
            icon={<TrendingUpIcon />}
            label={`+${Math.abs(compressionRatio)}%`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          />
        )}
      </Box>

      {/* Visual size comparison bar */}
      <Box sx={{ position: "relative", height: 8, backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 2, overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min(100, (estimatedSize / originalSize) * 100)}%`,
            backgroundColor: "white",
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" mt={1}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {isSmaller ? `You'll save ${formatFileSize(sizeDiff)}` : `Size increases by ${formatFileSize(sizeDiff)}`}
        </Typography>
      </Box>

      {isGif && isLikelyAnimated && !hasTargetSize ? (
        <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: "block", fontStyle: "italic" }}>
          ⚠️ <strong>Animated GIF:</strong> Compression varies greatly (±20-40% variance).
          Use "Target File Size" for more predictable results.
        </Typography>
      ) : (
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block", fontStyle: "italic" }}>
          ⚠️ Estimate based on format, quality & settings. Actual may vary ±10-20%.
        </Typography>
      )}
    </Box>
  );
};

export default EstimatedSizeIndicator;
