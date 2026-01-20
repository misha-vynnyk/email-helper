import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import { AutoAwesome as AutoIcon, Tune as ManualIcon, Lock as LockIcon } from "@mui/icons-material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { CompressionMode } from "../types";

interface QualityControlProps {
  autoQuality: boolean;
  quality: number;
  onAutoQualityChange: (auto: boolean) => void;
  onQualityChange: (quality: number) => void;
  compressionMode?: CompressionMode;
  disabled?: boolean;
}

const getQualityLevel = (
  quality: number
): { label: string; color: "success" | "warning" | "error" } => {
  if (quality >= 90) return { label: "Excellent", color: "success" };
  if (quality >= 75) return { label: "High", color: "success" };
  if (quality >= 60) return { label: "Good", color: "warning" };
  if (quality >= 40) return { label: "Medium", color: "warning" };
  return { label: "Low", color: "error" };
};

// Get auto quality value based on compression mode
const getCompressionModeQuality = (mode: CompressionMode): number => {
  switch (mode) {
    case "maximum-quality":
      return 92;
    case "maximum-compression":
      return 75;
    case "lossless":
      return 100;
    default:
      return 85;
  }
};

const getCompressionModeLabel = (mode: CompressionMode): string => {
  switch (mode) {
    case "maximum-quality":
      return "Maximum Quality mode (92%)";
    case "maximum-compression":
      return "Maximum Compression mode (75%)";
    case "lossless":
      return "Lossless mode (100%)";
    default:
      return "";
  }
};

const QualityControl: React.FC<QualityControlProps> = ({
  autoQuality,
  quality,
  onAutoQualityChange,
  onQualityChange,
  compressionMode = "balanced",
  disabled = false,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const isControlledByCompressionMode = compressionMode !== "balanced";
  const effectiveQuality = isControlledByCompressionMode
    ? getCompressionModeQuality(compressionMode)
    : quality;
  const qualityLevel = getQualityLevel(effectiveQuality);

  return (
    <Box>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={1.5}
      >
        <Typography
          variant='subtitle2'
          fontWeight={600}
          color='text.primary'
        >
          Quality Control
        </Typography>
        <Chip
          size='small'
          label={qualityLevel.label}
          color={qualityLevel.color}
          sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
        />
      </Box>

      {/* Show locked state for non-balanced modes */}
      {isControlledByCompressionMode ? (
        <Box
          sx={{
            p: 2,
            borderRadius: componentStyles.card.borderRadius,
            backgroundColor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <Box
            display='flex'
            alignItems='center'
            gap={1}
            mb={1}
          >
            <LockIcon
              fontSize='small'
              color='info'
            />
            <Typography
              variant='body2'
              fontWeight={500}
              color='text.primary'
            >
              Quality set automatically
            </Typography>
          </Box>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: "block", mb: 1.5 }}
          >
            {getCompressionModeLabel(compressionMode)}
          </Typography>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
          >
            <Typography
              variant='h4'
              color='primary'
              fontWeight={700}
            >
              {effectiveQuality}%
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <RadioGroup
            value={autoQuality ? "auto" : "manual"}
            onChange={(e) => onAutoQualityChange(e.target.value === "auto")}
          >
            <FormControlLabel
              value='auto'
              control={
                <Radio
                  size='small'
                  disabled={disabled}
                />
              }
              label={
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1}
                >
                  <AutoIcon
                    fontSize='small'
                    color='action'
                  />
                  <Box>
                    <Typography
                      variant='body2'
                      fontWeight={500}
                      color='text.primary'
                    >
                      Auto Quality
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                    >
                      Automatically calculate optimal quality
                    </Typography>
                  </Box>
                </Box>
              }
            />
            <FormControlLabel
              value='manual'
              control={
                <Radio
                  size='small'
                  disabled={disabled}
                />
              }
              label={
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1}
                >
                  <ManualIcon
                    fontSize='small'
                    color='action'
                  />
                  <Box>
                    <Typography
                      variant='body2'
                      fontWeight={500}
                      color='text.primary'
                    >
                      Manual Quality
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                    >
                      Set quality level manually
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </RadioGroup>

          {!autoQuality && (
            <Box sx={{ mt: 2, px: 1 }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={1}
              >
                <Typography
                  variant='body2'
                  color='text.secondary'
                >
                  Quality
                </Typography>
                <Typography
                  variant='h6'
                  color='primary'
                  fontWeight={700}
                >
                  {quality}%
                </Typography>
              </Box>
              <Slider
                value={quality}
                onChange={(_, value) => {
                  const numValue = Array.isArray(value) ? value[0] : value;
                  const clampedValue = Math.max(1, Math.min(100, numValue));
                  onQualityChange(clampedValue);
                }}
                min={1}
                max={100}
                disabled={disabled}
                valueLabelDisplay='auto'
                marks={[
                  { value: 1, label: "1%" },
                  { value: 25, label: "25%" },
                  { value: 50, label: "50%" },
                  { value: 75, label: "75%" },
                  { value: 100, label: "100%" },
                ]}
                sx={{
                  "& .MuiSlider-markLabel": {
                    fontSize: "0.65rem",
                  },
                }}
              />
              <Box
                display='flex'
                justifyContent='space-between'
                mt={0.5}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  Smaller file
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  Better quality
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default QualityControl;
