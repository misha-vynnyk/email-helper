import { useState, Dispatch, SetStateAction } from "react";
import { Stack, Box, Tooltip, IconButton, Badge, Typography } from "@mui/material";
import { Code as CodeIcon, Settings as SettingsIcon, Clear as ClearIcon } from "@mui/icons-material";
import { spacingMUI } from "../../theme/tokens";
import { SectionHeader } from "./SectionHeader";
import { SettingsPopover } from "./SettingsPopover";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import type { ImageAnalysisSettings } from "../types";

interface HeaderProps {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline";
  unseenLogCount: number;
  onClear: () => void;
}

export function Header({ ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus, unseenLogCount, onClear }: HeaderProps) {
  const [uiAnchorEl, setUiAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsTab, setSettingsTab] = useState<"ui" | "image">("ui");

  return (
    <>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <SectionHeader icon={<CodeIcon fontSize='small' />} title='HTML to Table Converter' subtitle='Конвертація HTML в табличну структуру для email' />
        <Stack direction='row' alignItems='center' spacing={spacingMUI.sm}>
          {/* AI Backend Status Indicator */}
          {imageAnalysis.useAiBackend && (
            <Tooltip title={aiBackendStatus === "online" ? "AI сервер працює" : aiBackendStatus === "checking" ? "Перевірка AI сервера..." : "AI сервер не доступний"}>
              <Stack direction='row' alignItems='center' spacing={0.5} sx={{ cursor: "pointer" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: aiBackendStatus === "online" ? "#4caf50" : aiBackendStatus === "checking" ? "#ff9800" : "#f44336",
                    animation: aiBackendStatus === "checking" ? "pulse 1s infinite" : "none",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.4 },
                    },
                  }}
                />
                <Typography variant='caption' sx={{ fontWeight: 500, color: "text.secondary" }}>
                  AI
                </Typography>
              </Stack>
            </Tooltip>
          )}
          <Tooltip title='UI налаштування'>
            <IconButton
              size='small'
              onClick={(e) => {
                setUiAnchorEl(e.currentTarget);
                setSettingsTab("ui");
              }}>
              <Badge color='primary' badgeContent={!ui.showLogsPanel && unseenLogCount > 0 ? unseenLogCount : 0} max={99}>
                <SettingsIcon fontSize='small' />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title='Очистити все'>
            <IconButton onClick={onClear} color='error' size='small'>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <SettingsPopover open={Boolean(uiAnchorEl)} anchorEl={uiAnchorEl} onClose={() => setUiAnchorEl(null)} settingsTab={settingsTab} setSettingsTab={setSettingsTab} ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={autoProcess} setAutoProcess={setAutoProcess} aiBackendStatus={aiBackendStatus} />
    </>
  );
}
