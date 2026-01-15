/**
 * Design Tokens / Theme Variables
 * Централізована система змінних для теми
 * Дозволяє легко змінювати тему в майбутньому
 */

// ============================================
// Brand Colors (Legacy - збережено для сумісності)
// ============================================
export const brandColors = {
  navy: "#212443",
  blue: "#0079CC",
  green: "#1F8466",
  red: "#E81212",
  yellow: "#F6DC9F",
  purple: "#6C0E7C",
  brown: "#CC996C",
  // Нові кольори з об'єднаної схеми
  indigo: "#6366F1",
  teal: "#0D9488",
  tealLight: "#14B8A6",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  orange: "#FB923C",
} as const;

// ============================================
// Semantic Colors (оновлено з новою схемою)
// ============================================
export const semanticColors = {
  success: {
    main: "#10B981",
    light: "#34D399",
    dark: "#059669",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#EF4444",
    light: "#F87171",
    dark: "#DC2626",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#06B6D4",
    light: "#22D3EE",
    dark: "#0891B2",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
    contrastText: "#1F2937",
  },
} as const;

// ============================================
// Palette Colors (оновлено з новою світлою темою)
// ============================================
export const paletteColors = {
  // Background colors
  background: {
    default: "#F9FAFB", // Основний фон (нейтральний сірий)
    paper: "#FFFFFF", // Поверхні, картки
    elevated: "#FFFFFF", // Підняті елементи
    subtle: "#F9FAFB", // Легкий фон для секцій
  },
  // Text colors
  text: {
    primary: "#1F2937", // Основний текст (WCAG AA: 12.63:1)
    secondary: "#6B7280", // Вторинний текст (WCAG AA: 7.16:1)
    tertiary: "#9CA3AF", // Третинний текст (WCAG AA: 4.79:1)
    disabled: "#D1D5DB", // Неактивний текст
  },
  // Primary colors (Indigo/Purple)
  primary: {
    main: "#6366F1", // Indigo
    light: "#818CF8",
    dark: "#4F46E5",
    contrastText: "#FFFFFF",
  },
  accent: {
    main: "#8B5CF6", // Purple
    light: "#A78BFA",
    dark: "#7C3AED",
    contrastText: "#FFFFFF",
  },
  // Secondary colors (Teal/Cyan)
  secondary: {
    main: "#0D9488", // Teal
    light: "#14B8A6",
    dark: "#0F766E",
    contrastText: "#FFFFFF",
  },
  // Accent colors (Amber/Orange)
  warm: {
    main: "#FB923C", // Orange
    light: "#FDBA74",
    dark: "#F97316",
    contrastText: "#1F2937",
  },
  // Cadet scale (neutral grays) - збережено для сумісності
  cadet: {
    100: "#F9FAFB",
    200: "#F2F5F7",
    300: "#DCE4EA",
    400: "#A8BBCA",
    500: "#6A8BA4",
  },
  // Highlight scale (based on yellow) - збережено для сумісності
  highlight: {
    100: "#FEF9E7",
    200: "#FCF3CF",
    300: "#F9E79F",
    400: "#F7DC6F",
    500: brandColors.yellow,
  },
  // Gray scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  // Border colors
  border: {
    default: "#E5E7EB", // Стандартна border
    light: "#F3F4F6", // Легка border
    dark: "#D1D5DB", // Темна border
    divider: "#E5E7EB", // Роздільники
  },
} as const;

// ============================================
// Градієнти (Light Theme)
// ============================================
export const gradients = {
  // Primary gradient (Indigo → Purple)
  primary: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  primaryHover: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
  primaryLight: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
  // Teal gradient (Teal → Cyan)
  teal: "linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)",
  tealHover: "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)",
  tealLight: "linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
  // Warm gradient (Amber → Orange)
  warm: "linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)",
  warmHover: "linear-gradient(135deg, #D97706 0%, #F97316 100%)",
  warmLight: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)",
  // Multi-color vibrant gradient
  vibrant: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0D9488 100%)",
  // Subtle background gradients
  backgroundSubtle:
    "linear-gradient(180deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 1) 100%)",
  backgroundWarm:
    "linear-gradient(180deg, rgba(255, 251, 235, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
  backgroundCool:
    "linear-gradient(180deg, rgba(240, 253, 250, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
} as const;

// ============================================
// Glassmorphism (Light Theme)
// ============================================
export const glassmorphism = {
  light: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5) inset",
  },
  medium: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.12), 0px 1px 0px rgba(255, 255, 255, 0.6) inset",
  },
  heavy: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0px 20px 60px rgba(0, 0, 0, 0.15), 0px 1px 0px rgba(255, 255, 255, 0.7) inset",
  },
  // Tinted glass variants
  tinted: {
    indigo: {
      background: "rgba(99, 102, 241, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(99, 102, 241, 0.2)",
    },
    teal: {
      background: "rgba(13, 148, 136, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(13, 148, 136, 0.2)",
    },
    amber: {
      background: "rgba(245, 158, 11, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(245, 158, 11, 0.2)",
    },
  },
} as const;

// ============================================
// Typography
// ============================================
export const typography = {
  fontFamily: {
    standard:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    monospace:
      'ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
} as const;

// ============================================
// Spacing (based on 4px unit)
// ============================================
export const spacing = {
  unit: 4, // base unit in px
  xs: 4, // 4px
  sm: 8, // 8px
  md: 12, // 12px
  base: 16, // 16px
  lg: 20, // 20px
  xl: 24, // 24px
  "2xl": 32, // 32px
  "3xl": 40, // 40px
  "4xl": 48, // 48px
  "5xl": 64, // 64px
} as const;

// MUI spacing helper (converts px to rem for MUI)
export const spacingMUI = {
  xs: 0.5, // 4px = 0.5 * 8px
  sm: 1, // 8px = 1 * 8px
  md: 1.5, // 12px = 1.5 * 8px
  base: 2, // 16px = 2 * 8px
  lg: 2.5, // 20px = 2.5 * 8px
  xl: 3, // 24px = 3 * 8px
  "2xl": 4, // 32px = 4 * 8px
  "3xl": 5, // 40px = 5 * 8px
  "4xl": 6, // 48px = 6 * 8px
  "5xl": 8, // 64px = 8 * 8px
} as const;

// ============================================
// Border Radius
// ============================================
export const borderRadius = {
  none: 0,
  sm: 4, // 4px
  md: 8, // 8px
  base: 12, // 12px
  lg: 16, // 16px
  xl: 20, // 20px
  "2xl": 24, // 24px
  full: 9999, // full circle
  // Common values
  card: 20, // 20px - часто використовується для карток
  button: 8, // 8px - для кнопок
  input: 8, // 8px - для інпутів
  chip: 16, // 16px - для чипів
  paper: 12, // 12px - для Paper компонентів
} as const;

// ============================================
// Shadows (оновлено з кольоровими та glass тінями)
// ============================================
export const shadows = {
  none: "none",
  // Standard shadows
  sm: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
  // Colored shadows
  colored: {
    indigo: "0px 8px 24px rgba(99, 102, 241, 0.25)",
    teal: "0px 8px 24px rgba(13, 148, 136, 0.25)",
    amber: "0px 8px 24px rgba(245, 158, 11, 0.25)",
    purple: "0px 8px 24px rgba(139, 92, 246, 0.25)",
  },
  // Interactive shadows
  hover: "0px 12px 32px rgba(0, 0, 0, 0.15)",
  focus: "0px 0px 0px 3px rgba(99, 102, 241, 0.2)",
  // Glass shadows
  glass: {
    sm: "0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5) inset",
    md: "0px 12px 40px rgba(0, 0, 0, 0.12), 0px 1px 0px rgba(255, 255, 255, 0.6) inset",
    lg: "0px 20px 60px rgba(0, 0, 0, 0.15), 0px 1px 0px rgba(255, 255, 255, 0.7) inset",
  },
  // MUI custom shadows (based on brand navy) - збережено для сумісності
  mui: [
    "none",
    "0px 4px 15px rgba(33, 36, 67, 0.04), 0px 0px 2px rgba(33, 36, 67, 0.04), 0px 0px 1px rgba(33, 36, 67, 0.04)",
    "0px 10px 20px rgba(33, 36, 67, 0.04), 0px 2px 6px rgba(33, 36, 67, 0.04), 0px 0px 1px rgba(33, 36, 67, 0.04)",
    "0px 16px 24px rgba(33, 36, 67, 0.05), 0px 2px 6px rgba(33, 36, 67, 0.05), 0px 0px 1px rgba(33, 36, 67, 0.05)",
    "0px 24px 32px rgba(33, 36, 67, 0.06), 0px 16px 24px rgba(33, 36, 67, 0.06), 0px 4px 8px rgba(33, 36, 67, 0.06)",
  ],
} as const;

// ============================================
// Opacity (розширено для glassmorphism)
// ============================================
export const opacity = {
  disabled: 0.38,
  hover: 0.7,
  focus: 0.12,
  selected: 0.08,
  overlay: {
    light: 0.5,
    medium: 0.7,
    dark: 0.9,
  },
  // Glass opacity
  glass: {
    light: 0.7,
    medium: 0.85,
    heavy: 0.95,
  },
  // Background opacity
  background: {
    subtle: 0.8,
    light: 0.5,
    medium: 0.3,
  },
} as const;

// ============================================
// Backdrop Filter (Blur values for glassmorphism)
// ============================================
export const backdropFilter = {
  sm: "blur(4px) saturate(180%)",
  md: "blur(8px) saturate(180%)",
  base: "blur(12px) saturate(180%)",
  lg: "blur(16px) saturate(180%)",
  xl: "blur(20px) saturate(180%)",
  "2xl": "blur(24px) saturate(180%)",
  "3xl": "blur(28px) saturate(180%)",
  full: "blur(32px) saturate(180%)",
} as const;

// ============================================
// Z-Index
// ============================================
export const zIndex = {
  mobileStepper: 1000,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
} as const;

// ============================================
// Transitions
// ============================================
export const transitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;

// ============================================
// Common Values (часто використовувані комбінації)
// ============================================
export const common = {
  // Common border radius values (in px, часто використовуються в компонентах)
  borderRadius: {
    card: borderRadius.card,
    button: borderRadius.button,
    input: borderRadius.input,
    chip: borderRadius.chip,
    paper: borderRadius.paper,
  },
  // Common spacing combinations
  spacing: {
    cardPadding: spacing.base, // 16px
    sectionGap: spacing.xl, // 24px
    componentGap: spacing.md, // 12px
  },
  // Common colors for overlays
  overlay: {
    dark: `rgba(0, 0, 0, ${opacity.overlay.medium})`,
    light: `rgba(255, 255, 255, ${opacity.overlay.light})`,
  },
} as const;

// ============================================
// Dark Theme Tokens
// ============================================

// Semantic Colors - Dark Theme
export const semanticColorsDark = {
  success: {
    main: "#34D399",
    light: "#6EE7B7",
    dark: "#10B981",
    contrastText: "#0F172A",
  },
  error: {
    main: "#F87171",
    light: "#FCA5A5",
    dark: "#EF4444",
    contrastText: "#0F172A",
  },
  info: {
    main: "#60A5FA",
    light: "#93C5FD",
    dark: "#3B82F6",
    contrastText: "#0F172A",
  },
  warning: {
    main: "#FBBF24",
    light: "#FCD34D",
    dark: "#F59E0B",
    contrastText: "#0F172A",
  },
} as const;

// Palette Colors - Dark Theme
export const paletteColorsDark = {
  background: {
    default: "#0F172A",
    paper: "#1E293B",
    elevated: "#334155",
    subtle: "#1E293B",
  },
  text: {
    primary: "#F8FAFC",
    secondary: "#E2E8F0",
    tertiary: "#CBD5E1",
    disabled: "#64748B",
  },
  primary: {
    main: "#818CF8",
    light: "#A5B4FC",
    dark: "#6366F1",
    contrastText: "#0F172A",
  },
  accent: {
    main: "#A78BFA",
    light: "#C4B5FD",
    dark: "#8B5CF6",
    contrastText: "#0F172A",
  },
  secondary: {
    main: "#2DD4BF",
    light: "#5EEAD4",
    dark: "#14B8A6",
    contrastText: "#0F172A",
  },
  warm: {
    main: "#FB923C",
    light: "#FDBA74",
    dark: "#F97316",
    contrastText: "#0F172A",
  },
  cadet: paletteColors.cadet, // Keep same for compatibility
  highlight: paletteColors.highlight, // Keep same for compatibility
  gray: paletteColors.gray, // Keep same
  border: {
    default: "#334155",
    light: "#475569",
    dark: "#1E293B",
    divider: "#475569",
  },
} as const;

// Gradients - Dark Theme
export const gradientsDark = {
  primary: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
  primaryHover: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  primaryLight:
    "linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)",
  teal: "linear-gradient(135deg, #2DD4BF 0%, #22D3EE 100%)",
  tealHover: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
  tealLight: "linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)",
  warm: "linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)",
  warmHover: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
  warmLight: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%)",
  vibrant: "linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #2DD4BF 100%)",
  backgroundSubtle: "linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 1) 100%)",
  backgroundWarm: gradients.backgroundWarm, // Keep same
  backgroundCool: gradients.backgroundCool, // Keep same
} as const;

// Glassmorphism - Dark Theme
export const glassmorphismDark = {
  light: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.3), 0px 1px 0px rgba(255, 255, 255, 0.1) inset",
  },
  medium: {
    background: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.4), 0px 1px 0px rgba(255, 255, 255, 0.15) inset",
  },
  heavy: {
    background: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0px 20px 60px rgba(0, 0, 0, 0.5), 0px 1px 0px rgba(255, 255, 255, 0.2) inset",
  },
  tinted: {
    indigo: {
      background: "rgba(129, 140, 248, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(129, 140, 248, 0.3)",
    },
    teal: {
      background: "rgba(45, 212, 191, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(45, 212, 191, 0.3)",
    },
    amber: {
      background: "rgba(251, 191, 36, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(251, 191, 36, 0.3)",
    },
  },
} as const;

// Shadows - Dark Theme
export const shadowsDark = {
  none: "none",
  sm: "0px 1px 2px rgba(0, 0, 0, 0.3)",
  md: "0px 4px 6px -1px rgba(0, 0, 0, 0.4), 0px 2px 4px -1px rgba(0, 0, 0, 0.3)",
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.4), 0px 4px 6px -2px rgba(0, 0, 0, 0.3)",
  xl: "0px 20px 25px -5px rgba(0, 0, 0, 0.5), 0px 10px 10px -5px rgba(0, 0, 0, 0.4)",
  "2xl": "0px 25px 50px -12px rgba(0, 0, 0, 0.6)",
  colored: {
    indigo: "0px 8px 24px rgba(129, 140, 248, 0.4), 0px 0px 0px 1px rgba(129, 140, 248, 0.2)",
    teal: "0px 8px 24px rgba(45, 212, 191, 0.4), 0px 0px 0px 1px rgba(45, 212, 191, 0.2)",
    amber: "0px 8px 24px rgba(251, 191, 36, 0.4), 0px 0px 0px 1px rgba(251, 191, 36, 0.2)",
    purple: "0px 8px 24px rgba(167, 139, 250, 0.4), 0px 0px 0px 1px rgba(167, 139, 250, 0.2)",
  },
  hover: "0px 12px 32px rgba(0, 0, 0, 0.4)",
  focus: "0px 0px 0px 3px rgba(129, 140, 248, 0.3)",
  glass: {
    sm: "0px 8px 32px rgba(0, 0, 0, 0.3), 0px 1px 0px rgba(255, 255, 255, 0.1) inset",
    md: "0px 12px 40px rgba(0, 0, 0, 0.4), 0px 1px 0px rgba(255, 255, 255, 0.15) inset",
    lg: "0px 20px 60px rgba(0, 0, 0, 0.5), 0px 1px 0px rgba(255, 255, 255, 0.2) inset",
  },
  mui: shadows.mui, // Keep same MUI shadows
} as const;

// ============================================
// Helper Functions
// ============================================

export type ThemeMode = "light" | "dark";
export type ThemeStyle = "default" | "floating" | "glassmorphism" | "neomorphic";

export function getPaletteColors(mode: ThemeMode) {
  return mode === "dark" ? paletteColorsDark : paletteColors;
}

export function getSemanticColors(mode: ThemeMode) {
  return mode === "dark" ? semanticColorsDark : semanticColors;
}

export function getGradients(mode: ThemeMode) {
  return mode === "dark" ? gradientsDark : gradients;
}

export function getGlassmorphism(mode: ThemeMode) {
  return mode === "dark" ? glassmorphismDark : glassmorphism;
}

export function getShadows(mode: ThemeMode) {
  return mode === "dark" ? shadowsDark : shadows;
}
