import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { themeTransition } from "./animations";
import { useTheme } from "./ThemeContext";

// Import SCSS styles
import "./styles/index.scss";

interface ModernThemeProviderProps {
  children: React.ReactNode;
}

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { mode, type } = useTheme();
  const prevTypeRef = useRef<typeof type | null>(null);
  const prevModeRef = useRef<typeof mode | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevType = prevTypeRef.current;
    const prevMode = prevModeRef.current;
    const isInitialMount = isInitialMountRef.current;

    // Для першого рендеру ініціалізуємо refs
    if (isInitialMount) {
      isInitialMountRef.current = false;
      prevTypeRef.current = type;
      prevModeRef.current = mode;
    }

    // Визначаємо що саме змінилося
    const typeChanged = prevType !== null && prevType !== type;
    const modeChanged = prevMode !== null && prevMode !== mode;

    // Очищаємо всі класи та CSS змінні перед застосуванням нових
    const clearModernStyles = () => {
      body.classList.remove('modern-theme-active');
      root.classList.remove('theme-light', 'theme-dark');

      const cssVars = [
        '--bg-primary', '--bg-secondary', '--bg-tertiary', '--text-primary',
        '--text-secondary', '--text-tertiary', '--border-color', '--divider-color',
        '--purple-primary', '--purple-dark', '--purple-light', '--sidebar-bg',
        '--sidebar-text', '--sidebar-active', '--status-success', '--status-warning',
        '--status-error', '--status-info', '--interactive-hover', '--interactive-active',
        '--focus-ring', '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl'
      ];

      cssVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
    };

    if (type === 'modern') {
      if (typeChanged) {
        // Перемикання з legacy на modern - очищаємо все, потім додаємо modern
        clearModernStyles();
        // Force reflow
        void body.offsetHeight;

        requestAnimationFrame(() => {
          root.classList.add(`theme-${mode}`);
          body.classList.add('modern-theme-active');
        });
      } else if (modeChanged && prevMode !== null) {
        // Зміна mode в modern theme - просто оновлюємо клас теми
        root.classList.remove(`theme-${prevMode}`);
        root.classList.add(`theme-${mode}`);
      } else if (isInitialMount) {
        // Перший рендер з modern theme
        clearModernStyles();
        root.classList.add(`theme-${mode}`);
        body.classList.add('modern-theme-active');
      }
    } else {
      // Legacy theme - завжди очищаємо modern стилі
      if (typeChanged || modeChanged || isInitialMount) {
        clearModernStyles();
        // Force reflow для застосування змін
        void body.offsetHeight;

        // Додатково переконуємося через requestAnimationFrame
        requestAnimationFrame(() => {
          body.classList.remove('modern-theme-active');
          root.classList.remove('theme-light', 'theme-dark');
          clearModernStyles();
        });
      }
    }

    // Оновлюємо refs в кінці
    prevTypeRef.current = type;
    prevModeRef.current = mode;
  }, [mode, type]);

  // Only apply modern theme styles if type is modern
  if (type !== 'modern') {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={`modern-theme-${mode}-${type}`}
      animate={{
        backgroundColor: mode === 'light' ? '#FFFFFF' : '#0F172A',
      }}
      transition={themeTransition}
      style={{
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
      className="modern-theme"
    >
      {children}
    </motion.div>
  );
}

export function ModernThemeProvider({ children }: ModernThemeProviderProps) {
  return <ThemeApplier>{children}</ThemeApplier>;
}
