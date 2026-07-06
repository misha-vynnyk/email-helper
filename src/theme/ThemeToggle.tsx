/**
 * Theme Toggle Component
 * Button to switch between light and dark themes
 */

import { Moon, Sun } from "lucide-react";

import { useThemeMode } from "./ThemeContext";

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <button
      type='button'
      onClick={toggleMode}
      title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      className='flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'>
      {mode === "light" ? <Moon className='w-4 h-4' /> : <Sun className='w-4 h-4 text-primary' />}
    </button>
  );
}
