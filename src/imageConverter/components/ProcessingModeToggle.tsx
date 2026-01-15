import { Cloud as CloudIcon, Computer as ComputerIcon } from "@mui/icons-material";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";

import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { useImageConverter } from "../context/ImageConverterContext";
import { ProcessingMode } from "../types";

export default function ProcessingModeToggle() {
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { settings, updateSettings } = useImageConverter();

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
        }}
      >
        <ToggleButton value='client'>
          <Tooltip title='Process in browser (faster, no upload)'>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <ComputerIcon fontSize="small" />
              <span>Client</span>
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value='server'>
          <Tooltip title='Process on server (better quality, larger files)'>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <CloudIcon fontSize="small" />
              <span>Server</span>
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mt: 1, display: "block" }}
      >
        {settings.processingMode === "client"
          ? "Processing in browser (max 10MB per file)"
          : "Processing on server (max 50MB per file)"}
      </Typography>
    </Box>
  );
}
