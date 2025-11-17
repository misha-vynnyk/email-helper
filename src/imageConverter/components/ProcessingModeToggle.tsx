import { Cloud as CloudIcon, Computer as ComputerIcon } from "@mui/icons-material";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";

import { useImageConverter } from "../context/ImageConverterContext";
import { ProcessingMode } from "../types";

export default function ProcessingModeToggle() {
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
      >
        <ToggleButton
          value='client'
          sx={{ borderRadius: 5 }}
        >
          <Tooltip title='Process in browser (faster, no upload)'>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <ComputerIcon />
              <span>Client</span>
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value='server'
          sx={{ borderRadius: 5 }}
        >
          <Tooltip title='Process on server (better quality, larger files)'>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              <CloudIcon />
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
