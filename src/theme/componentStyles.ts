/**
 * Component Style Themes
 * Overlay styles that can be applied on top of base theme (light/dark)
 * Each style defines how components (cards, panels, etc.) should look
 */

import { ThemeMode, ThemeStyle, borderRadius, backdropFilter } from "./tokens";

export interface ComponentStyle {
  card: {
    borderRadius: number | string;
    background?: string;
    backdropFilter?: string;
    WebkitBackdropFilter?: string;
    border: string;
    boxShadow: string;
    hover?: {
      transform?: string;
      boxShadow?: string;
      border?: string;
    };
  };
}

// Helper to get component styles based on mode and style
export function getComponentStyles(mode: ThemeMode, style: ThemeStyle): ComponentStyle {
  const isDark = mode === "dark";

  switch (style) {
    case "floating": {
      // Frosted Glass + Neomorphic combination
      const bg = isDark ? "rgba(30, 41, 59, 0.55)" : "rgba(255, 255, 255, 0.55)";
      const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)";
      const shadowBase = isDark
        ? "0px 24px 48px rgba(0, 0, 0, 0.4), 0px 2px 4px rgba(0, 0, 0, 0.3)"
        : "0px 24px 48px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.08)";
      const shadowInset = isDark
        ? "inset 0px 1px 2px rgba(255, 255, 255, 0.1), inset 0px -1px 2px rgba(0, 0, 0, 0.2)"
        : "inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px -1px 2px rgba(0, 0, 0, 0.05)";

      return {
        card: {
          borderRadius: borderRadius.base,
          background: bg,
          backdropFilter: backdropFilter["3xl"],
          WebkitBackdropFilter: backdropFilter["3xl"],
          border: `1px solid ${borderColor}`,
          boxShadow: `${shadowBase}, ${shadowInset}`,
          hover: {
            transform: "translateY(-6px) scale(1.01)",
            boxShadow: isDark
              ? `0px 32px 64px rgba(0, 0, 0, 0.5), 0px 4px 8px rgba(0, 0, 0, 0.4), inset 0px 2px 4px rgba(255, 255, 255, 0.15), inset 0px -2px 4px rgba(0, 0, 0, 0.3)`
              : `0px 32px 64px rgba(0, 0, 0, 0.15), 0px 4px 8px rgba(0, 0, 0, 0.1), inset 0px 2px 4px rgba(255, 255, 255, 0.7), inset 0px -2px 4px rgba(0, 0, 0, 0.08)`,
          },
        },
      };
    }

    case "glassmorphism": {
      // Pure glassmorphism
      const bg = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)";
      const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)";

      return {
        card: {
          borderRadius: borderRadius.base,
          background: bg,
          backdropFilter: backdropFilter.xl,
          WebkitBackdropFilter: backdropFilter.xl,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? "0px 8px 32px rgba(0, 0, 0, 0.3), 0px 1px 0px rgba(255, 255, 255, 0.1) inset"
            : "0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5) inset",
          hover: {
            transform: "translateY(-4px)",
            boxShadow: isDark
              ? "0px 16px 48px rgba(0, 0, 0, 0.4), 0px 2px 0px rgba(255, 255, 255, 0.15) inset"
              : "0px 16px 48px rgba(0, 0, 0, 0.12), 0px 2px 0px rgba(255, 255, 255, 0.6) inset",
          },
        },
      };
    }

    case "neomorphic": {
      // Soft neomorphism
      const bg = isDark ? "#1E293B" : "#F9FAFB";
      const shadowLight = isDark
        ? "8px 8px 16px rgba(0, 0, 0, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.05)"
        : "8px 8px 16px rgba(0, 0, 0, 0.08), -8px -8px 16px rgba(255, 255, 255, 0.8)";
      const shadowDark = isDark
        ? "inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px rgba(255, 255, 255, 0.05)"
        : "inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.9)";

      return {
        card: {
          borderRadius: borderRadius.base,
          background: bg,
          border: "none",
          boxShadow: `${shadowLight}, ${shadowDark}`,
          hover: {
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "10px 10px 20px rgba(0, 0, 0, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.05), inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px rgba(255, 255, 255, 0.05)"
              : "10px 10px 20px rgba(0, 0, 0, 0.1), -10px -10px 20px rgba(255, 255, 255, 0.9), inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.9)",
          },
        },
      };
    }

    case "default":
    default: {
      // Standard Material Design style
      return {
        card: {
          borderRadius: borderRadius.md,
          border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: isDark ? "0px 2px 8px rgba(0, 0, 0, 0.3)" : "0px 2px 8px rgba(0, 0, 0, 0.1)",
          hover: {
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "0px 4px 16px rgba(0, 0, 0, 0.4)"
              : "0px 4px 16px rgba(0, 0, 0, 0.15)",
          },
        },
      };
    }
  }
}
