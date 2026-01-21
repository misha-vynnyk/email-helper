import { Box, useTheme, useMediaQuery } from "@mui/material";

import { useThemeMode } from "../../theme";
import { ImageConverterProvider } from "../context/ImageConverterContext";

import GeometricBackground from "./GeometricBackground";
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
    // Mobile: Stack layout with Settings on top
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Animated Background - only for non-default styles */}
        {showAnimatedBackground && <GeometricBackground />}

        {/* Settings Sidebar on top */}
        <Box
          sx={{
            maxHeight: "40%",
            minHeight: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
          }}
        >
          <SettingsSidebar />
        </Box>

        {/* Main Content */}
        <Box
          data-app-scroll='true'
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            p: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <FileUploadZone />
        </Box>

        {/* Sticky Footer */}
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0,
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
          minHeight: 0,
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
        {showAnimatedBackground && <GeometricBackground />}

        {/* Main Content Area */}
        <Box
          data-app-scroll='true'
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
