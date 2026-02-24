import React, { Dispatch, SetStateAction } from "react";
import { Box, Typography, Popover, IconButton, Tabs, Tab, Divider, alpha, useTheme } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { spacingMUI, borderRadius } from "../../theme/tokens";
import { getComponentStyles } from "../../theme/componentStyles";
import type { ImageAnalysisSettings } from "../types";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { useThemeMode } from "../../theme";
import { UiSettingsTab } from "./UiSettingsTab";
import { ImageSettingsTab } from "./ImageSettingsTab";

type SettingsPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  settingsTab: "ui" | "image";
  setSettingsTab: Dispatch<SetStateAction<"ui" | "image">>;
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline";
};

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({ open, anchorEl, onClose, settingsTab, setSettingsTab, ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus }) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          borderRadius: `${borderRadius.lg}px`,
          background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
          overflow: "hidden",
        },
      }}>
      <Box sx={{ minWidth: 420, maxWidth: 520 }}>
        <Box
          sx={{
            px: spacingMUI.base,
            pt: spacingMUI.base,
            pb: spacingMUI.sm,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacingMUI.sm,
          }}>
          <Box>
            <Typography variant='subtitle2' fontWeight={700}>
              Налаштування
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              HTML Converter
            </Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>

        <Tabs
          value={settingsTab}
          onChange={(_, v) => setSettingsTab(v)}
          variant='fullWidth'
          sx={{
            px: spacingMUI.xs,
            minHeight: 40,
            "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 },
          }}>
          <Tab value='ui' label='Інтерфейс' />
          <Tab value='image' label='Зображення' />
        </Tabs>

        <Divider />

        <Box
          sx={{
            p: spacingMUI.base,
            maxHeight: 520,
            overflowY: "auto",
          }}>
          {settingsTab === "ui" && <UiSettingsTab ui={ui} setUi={setUi} />}
          {settingsTab === "image" && <ImageSettingsTab ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={autoProcess} setAutoProcess={setAutoProcess} aiBackendStatus={aiBackendStatus} />}
        </Box>
      </Box>
    </Popover>
  );
};
