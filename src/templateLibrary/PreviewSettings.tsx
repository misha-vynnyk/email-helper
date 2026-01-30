/**
 * Preview Settings Component
 * Allows users to configure preview dimensions and scale
 */

import { useMemo, useState } from "react";

import { Add as AddIcon, Settings as SettingsIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import { alpha, useTheme } from "@mui/material/styles";

import { logger } from "../utils/logger";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";

export interface PreviewConfig {
  cardWidth: number;
  cardHeight: number;
  containerHeight: number; // Fixed container height for preview cards
  dialogMaxWidth: "xs" | "sm" | "md" | "lg" | "xl";
  saveScrollPosition: boolean; // Whether to save scroll position when navigating between templates
  hiddenSections: string[]; // Section names to hide in preview (marked with <!--=== SectionName ===--> comments)
}

const DEFAULT_CONFIG: PreviewConfig = {
  cardWidth: 600, // Typical email width
  cardHeight: 2000, // Typical email height
  containerHeight: 300, // Preview card container height
  dialogMaxWidth: "lg",
  saveScrollPosition: true, // Save scroll position by default
  hiddenSections: [], // No sections hidden by default
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
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);

  const [open, setOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<PreviewConfig>(config);
  const [newSectionName, setNewSectionName] = useState("");

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
    setNewSectionName("");
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
        PaperProps={{
          sx: {
            borderRadius: `${componentStyles.card.borderRadius}px`,
            background:
              componentStyles.card.background || alpha(theme.palette.background.paper, 0.9),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            border: componentStyles.card.border,
            boxShadow: componentStyles.card.boxShadow,
          },
        }}
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

            {/* Hidden Sections */}
            <Box mt={3}>
              <Typography
                variant='subtitle2'
                gutterBottom
                fontWeight={600}
              >
                Hidden Sections (Preview Only)
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                gutterBottom
                display='block'
                mb={2}
              >
                Sections marked with comment markers will be hidden in preview only. Code remains
                unchanged.
                <br />
                <strong>HTML format:</strong>{" "}
                <code>{"<!-- SectionName --> ... <!-- SectionName-end -->"}</code>
                <br />
                <strong>Also supports:</strong>{" "}
                <code>{"<!--=== SectionName ===--> ... <!-- SectionName-end -->"}</code>
                <br />
                <strong>Enter only:</strong> <code>SectionName</code> (without comment markers!)
              </Typography>

              {tempConfig.hiddenSections.length > 0 && (
                <Box mb={2}>
                  {tempConfig.hiddenSections.map((section, index) => (
                    <Chip
                      key={index}
                      label={section}
                      onDelete={() => {
                        const newSections = tempConfig.hiddenSections.filter((_, i) => i !== index);
                        setTempConfig({ ...tempConfig, hiddenSections: newSections });
                      }}
                      size='small'
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              <Box
                display='flex'
                gap={1}
              >
                <TextField
                  size='small'
                  placeholder='Section name (e.g., Promo-content)'
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newSectionName.trim()) {
                      const trimmed = newSectionName.trim();
                      if (!tempConfig.hiddenSections.includes(trimmed)) {
                        setTempConfig({
                          ...tempConfig,
                          hiddenSections: [...tempConfig.hiddenSections, trimmed],
                        });
                        setNewSectionName("");
                      }
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const trimmed = newSectionName.trim();
                    if (trimmed && !tempConfig.hiddenSections.includes(trimmed)) {
                      setTempConfig({
                        ...tempConfig,
                        hiddenSections: [...tempConfig.hiddenSections, trimmed],
                      });
                      setNewSectionName("");
                    }
                  }}
                  disabled={!newSectionName.trim()}
                >
                  Add
                </Button>
              </Box>
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
