/**
 * Theme Context and Provider
 * Manages theme mode (light/dark) state and provides it to the app
 */

import React, { createContext, useContext, useMemo, useEffect } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { ThemeMode, ThemeStyle } from "./tokens";
import { createAppTheme } from "./theme";

interface ThemeContextValue {
  mode: ThemeMode;
  style: ThemeStyle;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useLocalStorage<ThemeMode>(STORAGE_KEYS.THEME_MODE, "light");
  const [style, setStyle] = useLocalStorage<ThemeStyle>(STORAGE_KEYS.THEME_STYLE, "default");

  // Sync with system preference on first load (only if no stored preference)
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.THEME_MODE)) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleMode = useMemo(
    () => () => {
      setMode((prev) => (prev === "light" ? "dark" : "light"));
    },
    [setMode]
  );

  const handleSetMode = useMemo(
    () => (newMode: ThemeMode) => {
      setMode(newMode);
    },
    [setMode]
  );

  const handleSetStyle = useMemo(
    () => (newStyle: ThemeStyle) => {
      setStyle(newStyle);
    },
    [setStyle]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      style,
      toggleMode,
      setMode: handleSetMode,
      setStyle: handleSetStyle,
    }),
    [mode, style, toggleMode, handleSetMode, handleSetStyle]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}