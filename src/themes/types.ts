/**
 * Theme Types
 * TypeScript types for theme system
 */

export type ThemeMode = 'light' | 'dark';
export type ThemeType = 'legacy' | 'modern';

export interface ThemePreferences {
  type: ThemeType;
  mode: ThemeMode;
}

