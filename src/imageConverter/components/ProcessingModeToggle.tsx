import { Cloud as CloudIcon, Computer as ComputerIcon } from "@mui/icons-material";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useEffect } from "react";

import { isApiAvailable } from "../../config/api";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { useImageConverter } from "../context/ImageConverterContext";
import { ProcessingMode } from "../types";

export default function ProcessingModeToggle() {
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { settings, updateSettings } = useImageConverter();
  const apiAvailable = isApiAvailable();

  // Auto-switch to client mode if server mode is selected but API is unavailable
  useEffect(() => {
    if (settings.processingMode === "server" && !apiAvailable) {
      updateSettings({ processingMode: "client" });
    }
  }, [apiAvailable, settings.processingMode, updateSettings]);

  return (
    <Box>
      <ToggleButtonGroup
        value={settings.processingMode}
        exclusive
        onChange={(_, value) =>
          value && updateSettings({ processingMode: value as ProcessingMode })
        }
        fullWidth
        sx={{
          "& .MuiToggleButton-root": {
            borderRadius: componentStyles.card.borderRadius,
            textTransform: "none",
          },
          display: "flex",
          gap: 1,
        }}
      >
        <ToggleButton value='client'>
          <Tooltip title='Process in browser (faster, no upload)'>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <ComputerIcon fontSize='small' />
              <span>Client</span>
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton 
          value='server' 
          disabled={!apiAvailable}
        >
          <Tooltip 
            title={
              apiAvailable 
                ? 'Process on server (better quality, larger files)'
                : 'Server processing unavailable - backend server is not configured'
            }
          >
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <CloudIcon fontSize='small' />
              <span>Server</span>
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
