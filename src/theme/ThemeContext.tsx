/**
 * Theme Context and Provider
 * Manages theme mode (light/dark) state and provides it to the app
 */

import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React, { createContext, useContext, useEffect,useMemo } from "react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { createAppTheme } from "./theme";
import { ThemeMode, ThemeStyle } from "./tokens";

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
  const [mode, setMode] = useLocalStorage<ThemeMode>(STORAGE_KEYS.THEME_MODE, "dark");
  const [style, setStyle] = useLocalStorage<ThemeStyle>(STORAGE_KEYS.THEME_STYLE, "default");

  // Sync with system preference on first load (only if no stored preference)
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.THEME_MODE)) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only; setMode comes from useLocalStorage and is a new reference every render, so including it would re-run this on every render
  }, []);

  // Sync mode with Tailwind's dark mode via data-theme or class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.setAttribute("data-theme", mode);
  }, [mode]);

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
