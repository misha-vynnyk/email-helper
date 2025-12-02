import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  Chip,
} from "@mui/material";
import { AutoAwesome as AutoIcon, Tune as ManualIcon } from "@mui/icons-material";

interface QualityControlProps {
  autoQuality: boolean;
  quality: number;
  onAutoQualityChange: (auto: boolean) => void;
  onQualityChange: (quality: number) => void;
  disabled?: boolean;
}

const getQualityLevel = (quality: number): { label: string; color: "success" | "warning" | "error" } => {
  if (quality >= 90) return { label: "Excellent", color: "success" };
  if (quality >= 75) return { label: "High", color: "success" };
  if (quality >= 60) return { label: "Good", color: "warning" };
  if (quality >= 40) return { label: "Medium", color: "warning" };
  return { label: "Low", color: "error" };
};

const QualityControl: React.FC<QualityControlProps> = ({
  autoQuality,
  quality,
  onAutoQualityChange,
  onQualityChange,
  disabled = false,
}) => {
  const qualityLevel = getQualityLevel(quality);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          🎯 Quality Control
        </Typography>
        {!autoQuality && (
          <Chip
            size="small"
            label={qualityLevel.label}
            color={qualityLevel.color}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        )}
      </Box>

      <RadioGroup
        value={autoQuality ? "auto" : "manual"}
        onChange={(e) => onAutoQualityChange(e.target.value === "auto")}
      >
        <FormControlLabel
          value="auto"
          control={<Radio size="small" disabled={disabled} />}
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <AutoIcon fontSize="small" />
              <Box>
                <Typography variant="body2">Auto Quality</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically calculate optimal quality
                </Typography>
              </Box>
            </Box>
          }
        />
        <FormControlLabel
          value="manual"
          control={<Radio size="small" disabled={disabled} />}
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <ManualIcon fontSize="small" />
              <Box>
                <Typography variant="body2">Manual Quality</Typography>
                <Typography variant="caption" color="text.secondary">
                  Set quality level manually
                </Typography>
              </Box>
            </Box>
          }
        />
      </RadioGroup>

      {!autoQuality && (
        <Box sx={{ mt: 2, px: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Quality
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              {quality}%
            </Typography>
          </Box>
          <Slider
            value={quality}
            onChange={(_, value) => onQualityChange(value as number)}
            min={1}
            max={100}
            disabled={disabled}
            valueLabelDisplay="auto"
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
          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              Smaller file
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Better quality
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default QualityControl;
