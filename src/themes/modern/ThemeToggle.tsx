import { DarkMode, LightMode, Palette } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { useTheme } from "./ThemeContext";
import { tapScale } from "./animations";

interface ThemeToggleProps {
  showTypeToggle?: boolean;
}

export function ThemeToggle({ showTypeToggle = false }: ThemeToggleProps) {
  const { mode, type, toggleMode, setThemeType } = useTheme();

  const modeIcon = useMemo(() => {
    return mode === 'light' ? <LightMode /> : <DarkMode />;
  }, [mode]);

  const handleModeClick = () => {
    toggleMode();
  };

  const handleTypeClick = () => {
    setThemeType(type === 'legacy' ? 'modern' : 'legacy');
  };

  if (showTypeToggle) {
    return (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
      >
        <Tooltip title={`${mode === 'light' ? 'Light' : 'Dark'} mode - Click to toggle`}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={tapScale}
          >
            <IconButton
              onClick={handleModeClick}
              size="small"
              color={mode === 'dark' ? 'primary' : 'default'}
            >
              {modeIcon}
            </IconButton>
          </motion.div>
        </Tooltip>
        <Tooltip title={`${type === 'legacy' ? 'Legacy' : 'Modern'} theme - Click to toggle to ${type === 'legacy' ? 'Modern' : 'Legacy'}`}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={tapScale}
          >
            <IconButton
              onClick={handleTypeClick}
              size="small"
              color={type === 'modern' ? 'primary' : 'default'}
              sx={{
                position: 'relative',
              }}
            >
              <Palette />
            </IconButton>
          </motion.div>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={tapScale}
      >
        <IconButton
          onClick={handleModeClick}
          color={mode === 'dark' ? 'primary' : 'default'}
        >
          {modeIcon}
        </IconButton>
      </motion.div>
    </Tooltip>
  );
}
