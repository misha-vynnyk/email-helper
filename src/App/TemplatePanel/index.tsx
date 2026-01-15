import React from "react";

import { Box, Stack } from "@mui/material";

import { BlockLibrary } from "../../blockLibrary";
import { useSelectedMainTab } from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { ImageConverterPanel } from "../../imageConverter";
import AnimatedBackground from "../../imageConverter/components/AnimatedBackground";
import { TemplateLibrary } from "../../templateLibrary";
import { ThemeToggle, ThemeStyleSelector, useThemeMode } from "../../theme";
import ToggleSamplesPanelButton from "../SamplesDrawer/ToggleSamplesPanelButton";

import EmailSenderPanel from "./EmailSenderPanel";
import MainTabsGroup from "./MainTabsGroup";

export default function TemplatePanel() {
  const { style } = useThemeMode();
  const selectedMainTab = useSelectedMainTab();
  const showAnimatedBackground = style !== "default";
  const handleFixedWheel = React.useCallback((event: React.WheelEvent) => {
    const scrollTarget = document.querySelector("[data-app-scroll='true']") as HTMLElement | null;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollBy({ top: event.deltaY });
  }, []);

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case "email":
        return <EmailSenderPanel />;
      case "blocks":
        return <BlockLibrary />;
      case "templates":
        return (
          <EmailSenderProvider>
            <TemplateLibrary />
          </EmailSenderProvider>
        );
      case "images":
        return <ImageConverterPanel />;
      default:
        return <EmailSenderPanel />;
    }
  };

  return (
    <>
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          position: "sticky",
          top: 0,
          zIndex: "appBar",
          px: 1,
        }}
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        onWheel={handleFixedWheel}
      >
        {/* Animated Background - only for non-default styles */}
        {showAnimatedBackground && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <AnimatedBackground />
          </Box>
        )}
        <Box sx={{ position: "relative", zIndex: 1, minWidth: 40 }}>
          <ToggleSamplesPanelButton />
        </Box>
        <Stack
          px={2}
          direction='row'
          flex={1}
          justifyContent='center'
          alignItems='center'
          sx={{ position: "relative", zIndex: 1 }}
        >
          <MainTabsGroup />
        </Stack>
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minWidth: 40,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <ThemeStyleSelector />
          <ThemeToggle />
        </Box>
      </Stack>
      <Box sx={{ height: "calc(100vh - 49px)", overflow: "hidden", minWidth: 370 }}>
        {renderMainPanel()}
      </Box>
    </>
  );
}
