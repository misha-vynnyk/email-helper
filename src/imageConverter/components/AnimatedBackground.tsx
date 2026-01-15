import React from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * Animated background with gradient to make glassmorphism effect more visible
 */
export default function AnimatedBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        zIndex: 0,
        background: isDark
          ? `linear-gradient(135deg,
              ${alpha(theme.palette.primary.main, 0.2)} 0%,
              ${alpha(theme.palette.secondary.main, 0.2)} 25%,
              ${alpha(theme.palette.accent?.main || theme.palette.primary.main, 0.15)} 50%,
              ${alpha(theme.palette.secondary.main, 0.2)} 75%,
              ${alpha(theme.palette.primary.main, 0.2)} 100%)`
          : `linear-gradient(135deg,
              ${alpha(theme.palette.primary.main, 0.12)} 0%,
              ${alpha(theme.palette.secondary.main, 0.12)} 25%,
              ${alpha(theme.palette.accent?.main || theme.palette.primary.main, 0.08)} 50%,
              ${alpha(theme.palette.secondary.main, 0.12)} 75%,
              ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
        backgroundSize: "400% 400%",
        animation: "gradientShift 12s ease infinite",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: isDark
            ? `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 50%),
               radial-gradient(circle at 70% 70%, ${alpha(theme.palette.secondary.main, 0.25)} 0%, transparent 50%),
               radial-gradient(circle at 50% 50%, ${alpha(theme.palette.accent?.main || theme.palette.primary.main, 0.2)} 0%, transparent 60%)`
            : `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 50%),
               radial-gradient(circle at 70% 70%, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 50%),
               radial-gradient(circle at 50% 50%, ${alpha(theme.palette.accent?.main || theme.palette.primary.main, 0.12)} 0%, transparent 60%)`,
          animation: "radialMove 18s ease-in-out infinite",
          opacity: 0.7,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)} 0%,
            transparent 40%)`,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        },
        "@keyframes gradientShift": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
          "100%": {
            backgroundPosition: "0% 50%",
          },
        },
        "@keyframes radialMove": {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
          },
          "33%": {
            transform: "translate(20px, -20px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
        },
      }}
    />
  );
}
