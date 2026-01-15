import React from "react";

import { Box, useTheme, useMediaQuery } from "@mui/material";

import { useThemeMode } from "../../theme";
import { ImageConverterProvider } from "../context/ImageConverterContext";

import AnimatedBackground from "./AnimatedBackground";
import BatchProcessor from "./BatchProcessor";
import FileUploadZone from "./FileUploadZone";
import SettingsSidebar from "./SettingsSidebar";

const SIDEBAR_WIDTH = 340;

function ImageConverterContent() {
  const theme = useTheme();
  const { style } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const showAnimatedBackground = style !== "default";

  if (isMobile) {
    // Mobile: Stack layout
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* Animated Background - only for non-default styles */}
        {showAnimatedBackground && <AnimatedBackground />}

        {/* Main Content */}
        <Box
          data-app-scroll="true"
          sx={{ flex: 1, overflow: "auto", p: 2, position: "relative", zIndex: 1 }}
        >
          <FileUploadZone />
        </Box>

        {/* Settings Drawer for mobile - can be added later */}

        {/* Sticky Footer */}
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <BatchProcessor />
        </Box>
      </Box>
    );
  }

  // Desktop: Two-panel layout
  return (
    <Box sx={{ height: "100%", display: "flex", overflow: "hidden" }}>
      {/* Left Panel: Settings Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          height: "100%",
          flexShrink: 0,
        }}
      >
        <SettingsSidebar />
      </Box>

      {/* Right Panel: Upload Zone + Grid + Footer */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: theme.palette.background.default,
          position: "relative",
        }}
      >
        {/* Animated Background - only for non-default styles */}
        {showAnimatedBackground && <AnimatedBackground />}

        {/* Main Content Area */}
        <Box
          data-app-scroll="true"
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <FileUploadZone />
        </Box>

        {/* Sticky Footer: Batch Actions */}
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `0 -2px 10px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)"}`,
          }}
        >
          <BatchProcessor />
        </Box>
      </Box>
    </Box>
  );
}

export default function ImageConverterPanel() {
  return (
    <ImageConverterProvider>
      <ImageConverterContent />
    </ImageConverterProvider>
  );
}
