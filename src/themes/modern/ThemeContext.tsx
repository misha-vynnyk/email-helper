import { createContext, useContext, useEffect, useMemo } from "react";

import { useLocalStorage } from "../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../utils/storageKeys";
import { ThemeMode, ThemePreferences, ThemeType } from "../types";

interface ThemeContextValue {
  mode: ThemeMode;
  type: ThemeType;
  toggleMode: () => void;
  setThemeType: (type: ThemeType) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_PREFERENCES: ThemePreferences = {
  type: 'legacy',
  mode: 'light',
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preferences, setPreferences] = useLocalStorage<ThemePreferences>(
    STORAGE_KEYS.THEME_PREFERENCES,
    DEFAULT_PREFERENCES
  );

  // Sync with system preference on first load (only if no stored preference)
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCES)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setPreferences({
        type: 'legacy',
        mode: prefersDark ? 'dark' : 'light',
      });
    }
  }, []);

  const toggleMode = useMemo(
    () => () => {
      setPreferences((prev) => ({
        ...prev,
        mode: prev.mode === 'light' ? 'dark' : 'light',
      }));
    },
    [setPreferences]
  );

  const setThemeType = useMemo(
    () => (type: ThemeType) => {
      setPreferences((prev) => ({
        ...prev,
        type,
      }));
    },
    [setPreferences]
  );

  const setMode = useMemo(
    () => (mode: ThemeMode) => {
      setPreferences((prev) => ({
        ...prev,
        mode,
      }));
    },
    [setPreferences]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: preferences.mode,
      type: preferences.type,
      toggleMode,
      setThemeType,
      setMode,
    }),
    [preferences, toggleMode, setThemeType, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
