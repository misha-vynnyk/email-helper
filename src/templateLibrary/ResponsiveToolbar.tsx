/**
 * Responsive Toolbar Component
 * Chrome DevTools-style responsive viewport selector
 */

import React from "react";

import {
  Laptop as DesktopIcon,
  PhoneAndroid as MobileIcon,
  ScreenRotation as RotateIcon,
  Tablet as TabletIcon,
} from "@mui/icons-material";
import { Box, IconButton, MenuItem, Select, TextField, Tooltip, Typography } from "@mui/material";

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: "Mobile S", width: 320, height: 568, icon: <MobileIcon /> },
  { name: "Mobile M", width: 375, height: 667, icon: <MobileIcon /> },
  { name: "Mobile L", width: 425, height: 812, icon: <MobileIcon /> },
  { name: "Tablet", width: 768, height: 1024, icon: <TabletIcon /> },
  { name: "Laptop", width: 1024, height: 768, icon: <DesktopIcon /> },
  { name: "Desktop", width: 1440, height: 900, icon: <DesktopIcon /> },
];

interface ResponsiveToolbarProps {
  width: number | "responsive";
  onWidthChange: (width: number | "responsive") => void;
  orientation: "portrait" | "landscape";
  onOrientationChange: (orientation: "portrait" | "landscape") => void;
}

export default function ResponsiveToolbar({
  width,
  onWidthChange,
  orientation,
  onOrientationChange,
}: ResponsiveToolbarProps) {
  const [customWidth, setCustomWidth] = React.useState<number>(
    typeof width === "number" ? width : 375
  );

  const handlePresetChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    if (value === "responsive") {
      onWidthChange("responsive");
    } else if (value === "custom") {
      onWidthChange(customWidth);
    } else {
      const preset = VIEWPORT_PRESETS.find((p) => p.name === value);
      if (preset) {
        const targetWidth = orientation === "portrait" ? preset.width : preset.height;
        setCustomWidth(targetWidth);
        onWidthChange(targetWidth);
      }
    }
  };

  const handleCustomWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(event.target.value) || 375;
    setCustomWidth(newWidth);
    if (width !== "responsive") {
      onWidthChange(newWidth);
    }
  };

  const toggleOrientation = () => {
    const newOrientation = orientation === "portrait" ? "landscape" : "portrait";
    onOrientationChange(newOrientation);

    // Swap width if using preset
    if (typeof width === "number") {
      const preset = VIEWPORT_PRESETS.find((p) => {
        const targetWidth = orientation === "portrait" ? p.width : p.height;
        return targetWidth === width;
      });

      if (preset) {
        const newWidth = newOrientation === "portrait" ? preset.width : preset.height;
        setCustomWidth(newWidth);
        onWidthChange(newWidth);
      }
    }
  };

  const getCurrentPreset = (): string => {
    if (width === "responsive") return "responsive";

    const matchingPreset = VIEWPORT_PRESETS.find((p) => {
      const targetWidth = orientation === "portrait" ? p.width : p.height;
      return targetWidth === width;
    });

    return matchingPreset ? matchingPreset.name : "custom";
  };

  return (
    <Box
      display='flex'
      alignItems='center'
      gap={2}
    >
      {/* Preset Selector */}
      <Select
        value={getCurrentPreset()}
        onChange={handlePresetChange}
        size='small'
        sx={{ minWidth: 150 }}
      >
        <MenuItem value='responsive'>
          <Box
            display='flex'
            alignItems='center'
            gap={1}
          >
            <DesktopIcon fontSize='small' />
            <Typography>Responsive</Typography>
          </Box>
        </MenuItem>
        {VIEWPORT_PRESETS.map((preset) => (
          <MenuItem
            key={preset.name}
            value={preset.name}
          >
            <Box
              display='flex'
              alignItems='center'
              gap={1}
            >
              {preset.icon}
              <Typography>
                {preset.name} ({orientation === "portrait" ? preset.width : preset.height}px)
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <MenuItem value='custom'>Custom</MenuItem>
      </Select>

      {/* Width Input */}
      {width !== "responsive" && (
        <>
          <TextField
            type='number'
            value={customWidth}
            onChange={handleCustomWidthChange}
            size='small'
            sx={{ width: 100 }}
            InputProps={{
              endAdornment: <Typography variant='caption'>px</Typography>,
            }}
          />

          {/* Orientation Toggle */}
          <Tooltip title='Rotate viewport'>
            <IconButton
              onClick={toggleOrientation}
              size='small'
            >
              <RotateIcon />
            </IconButton>
          </Tooltip>

          {/* Orientation Label */}
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ minWidth: 60 }}
          >
            {orientation === "portrait" ? "Portrait" : "Landscape"}
          </Typography>
        </>
      )}

      {/* Current Dimensions Display */}
      {width !== "responsive" && (
        <Typography
          variant='caption'
          color='primary'
          fontWeight={600}
        >
          {customWidth} × auto
        </Typography>
      )}
    </Box>
  );
}
