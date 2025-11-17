/**
 * Preview Settings Component
 * Allows users to configure preview dimensions and scale
 */

import { useState } from "react";

import { Settings as SettingsIcon } from "@mui/icons-material";
import { STORAGE_KEYS } from "../utils/storageKeys";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { logger } from "../utils/logger";

export interface PreviewConfig {
  cardWidth: number;
  cardHeight: number;
  containerHeight: number; // Fixed container height for preview cards
  dialogMaxWidth: "xs" | "sm" | "md" | "lg" | "xl";
  saveScrollPosition: boolean; // Whether to save scroll position when navigating between templates
}

const DEFAULT_CONFIG: PreviewConfig = {
  cardWidth: 600, // Typical email width
  cardHeight: 2000, // Typical email height
  containerHeight: 300, // Preview card container height
  dialogMaxWidth: "lg",
  saveScrollPosition: true, // Save scroll position by default
};

export function loadPreviewConfig(): PreviewConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    logger.error("PreviewSettings", "Failed to load preview config", error);
  }
  return DEFAULT_CONFIG;
}

export function savePreviewConfig(config: PreviewConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG, JSON.stringify(config));
  } catch (error) {
    logger.error("PreviewSettings", "Failed to save preview config", error);
  }
}

interface PreviewSettingsProps {
  config: PreviewConfig;
  onChange: (config: PreviewConfig) => void;
}

export default function PreviewSettings({ config, onChange }: PreviewSettingsProps) {
  const [open, setOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<PreviewConfig>(config);

  // Track string values for inputs to allow temporary empty values during editing
  const [containerHeightStr, setContainerHeightStr] = useState<string>(
    String(config.containerHeight)
  );
  const [cardWidthStr, setCardWidthStr] = useState<string>(String(config.cardWidth));
  const [cardHeightStr, setCardHeightStr] = useState<string>(String(config.cardHeight));

  const handleOpen = () => {
    setTempConfig(config);
    setContainerHeightStr(String(config.containerHeight));
    setCardWidthStr(String(config.cardWidth));
    setCardHeightStr(String(config.cardHeight));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    // Validate values before saving (ensure they are positive numbers)
    const validatedConfig: PreviewConfig = {
      ...tempConfig,
      containerHeight: tempConfig.containerHeight > 0 ? tempConfig.containerHeight : 300,
      cardWidth: tempConfig.cardWidth > 0 ? tempConfig.cardWidth : 600,
      cardHeight: tempConfig.cardHeight > 0 ? tempConfig.cardHeight : 2000,
    };
    onChange(validatedConfig);
    savePreviewConfig(validatedConfig);
    setOpen(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
  };

  // Calculate auto scale based on container height
  const autoScale = tempConfig.containerHeight / tempConfig.cardHeight;

  const calculatedCardSize = {
    width: Math.round(tempConfig.cardWidth * autoScale),
    height: tempConfig.containerHeight,
  };

  return (
    <>
      <Tooltip title='Preview Settings'>
        <IconButton
          size='small'
          onClick={handleOpen}
        >
          <SettingsIcon fontSize='small' />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth='sm'
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Preview Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Preview Container Height */}
            <Box mb={3}>
              <Typography
                variant='subtitle2'
                gutterBottom
                fontWeight={600}
              >
                Preview Card Height
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                gutterBottom
                display='block'
                mb={2}
              >
                Height of preview cards - templates will auto-scale to fit this height
              </Typography>
              <TextField
                label='Container Height (px)'
                type='number'
                size='small'
                value={containerHeightStr}
                onChange={(e) => {
                  const value = e.target.value;
                  setContainerHeightStr(value);
                  if (value !== "" && value !== "-") {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                      setTempConfig({ ...tempConfig, containerHeight: numValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue <= 0) {
                    const defaultValue = 300;
                    setContainerHeightStr(String(defaultValue));
                    setTempConfig({ ...tempConfig, containerHeight: defaultValue });
                  } else {
                    setContainerHeightStr(String(numValue));
                    setTempConfig({ ...tempConfig, containerHeight: numValue });
                  }
                }}
                inputProps={{ step: 50 }}
                fullWidth
                helperText='Templates will be scaled to fit this height'
              />
            </Box>

            {/* Template Dimensions */}
            <Typography
              variant='subtitle2'
              gutterBottom
              fontWeight={600}
            >
              Template Dimensions
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              gutterBottom
              display='block'
              mb={2}
            >
              Expected template size (typical emails: 600×1500-2000px)
            </Typography>

            <Box
              display='flex'
              gap={2}
              mb={3}
            >
              <TextField
                label='Width (px)'
                type='number'
                size='small'
                value={cardWidthStr}
                onChange={(e) => {
                  const value = e.target.value;
                  setCardWidthStr(value);
                  if (value !== "" && value !== "-") {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                      setTempConfig({ ...tempConfig, cardWidth: numValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue <= 0) {
                    const defaultValue = 600;
                    setCardWidthStr(String(defaultValue));
                    setTempConfig({ ...tempConfig, cardWidth: defaultValue });
                  } else {
                    setCardWidthStr(String(numValue));
                    setTempConfig({ ...tempConfig, cardWidth: numValue });
                  }
                }}
                inputProps={{ step: 50 }}
                fullWidth
              />
              <TextField
                label='Height (px)'
                type='number'
                size='small'
                value={cardHeightStr}
                onChange={(e) => {
                  const value = e.target.value;
                  setCardHeightStr(value);
                  if (value !== "" && value !== "-") {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                      setTempConfig({ ...tempConfig, cardHeight: numValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue <= 0) {
                    const defaultValue = 2000;
                    setCardHeightStr(String(defaultValue));
                    setTempConfig({ ...tempConfig, cardHeight: defaultValue });
                  } else {
                    setCardHeightStr(String(numValue));
                    setTempConfig({ ...tempConfig, cardHeight: numValue });
                  }
                }}
                inputProps={{ step: 50 }}
                fullWidth
              />
            </Box>

            {/* Calculated Result */}
            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 1,
                mb: 3,
              }}
            >
              <Typography
                variant='caption'
                color='text.secondary'
              >
                Result Card Preview Size:
              </Typography>
              <Typography
                variant='body2'
                fontWeight={600}
              >
                {calculatedCardSize.width}px × {calculatedCardSize.height}px
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                mt={0.5}
              >
                ({tempConfig.cardWidth}px × {tempConfig.cardHeight}px scaled to{" "}
                {(autoScale * 100).toFixed(1)}
                %)
              </Typography>
              <Typography
                variant='caption'
                color='success.main'
                display='block'
                mt={1}
                fontWeight={500}
              >
                ✓ Full template visible! Auto-scaled from {tempConfig.cardHeight}px to{" "}
                {tempConfig.containerHeight}px
              </Typography>
            </Box>

            {/* Dialog Size */}
            <Typography
              variant='subtitle2'
              gutterBottom
              fontWeight={600}
            >
              Full Preview Dialog Size
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              gutterBottom
              display='block'
              mb={1}
            >
              Size of the popup when you click a card
            </Typography>

            <Box
              display='flex'
              gap={1}
              flexWrap='wrap'
            >
              {(["sm", "md", "lg", "xl"] as const).map((size) => (
                <Button
                  key={size}
                  variant={tempConfig.dialogMaxWidth === size ? "contained" : "outlined"}
                  size='small'
                  onClick={() => setTempConfig({ ...tempConfig, dialogMaxWidth: size })}
                >
                  {size.toUpperCase()}
                </Button>
              ))}
            </Box>

            {/* Scroll Position Option */}
            <Box mt={3}>
              <Typography
                variant='subtitle2'
                gutterBottom
                fontWeight={600}
              >
                Navigation Behavior
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempConfig.saveScrollPosition}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, saveScrollPosition: e.target.checked })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant='body2'>Save scroll position when navigating</Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      When enabled, your scroll position in the preview will be preserved when
                      switching between templates
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleReset}
            color='secondary'
          >
            Reset to Defaults
          </Button>
          <Box flex={1} />
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant='contained'
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
