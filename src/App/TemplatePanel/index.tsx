import React from "react";

import { Box, CircularProgress, Fade, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { BlockLibrary } from "../../blockLibrary";
import { useSelectedMainTab } from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { HtmlConverterPanel } from "../../htmlConverter";
import { ImageConverterPanel } from "../../imageConverter";
import GeometricBackground from "../../imageConverter/components/GeometricBackground";
import { TemplateLibrary } from "../../templateLibrary";
import { getComponentStyles, ThemeToggle, ThemeStyleSelector, useThemeMode } from "../../theme";
import ToggleSamplesPanelButton from "../SamplesDrawer/ToggleSamplesPanelButton";

import EmailSenderPanel from "./EmailSenderPanel";
import MainTabsGroup from "./MainTabsGroup";
import TabPanel from "./TabPanel";

export default function TemplatePanel() {
  const { mode, style } = useThemeMode();
  const selectedMainTab = useSelectedMainTab();
  const componentStyles = React.useMemo(() => getComponentStyles(mode, style), [mode, style]);
  // useDeferredValue - рендер контенту відкладається, таб-індикатор оновлюється миттєво
  const deferredTab = React.useDeferredValue(selectedMainTab);
  const showAnimatedBackground = style !== "default";

  // Індикатор переходу між табами
  const isTransitioning = selectedMainTab !== deferredTab;

  // Відстежуємо які таби вже були відкриті для lazy mounting
  const [mountedTabs, setMountedTabs] = React.useState<Set<string>>(new Set(["email"]));

  React.useEffect(() => {
    // Монтуємо таб при першому відкритті
    if (!mountedTabs.has(selectedMainTab)) {
      setMountedTabs(prev => new Set([...prev, selectedMainTab]));
    }
  }, [selectedMainTab, mountedTabs]);

  const handleFixedWheel = React.useCallback((event: React.WheelEvent) => {
    const scrollTarget = document.querySelector("[data-app-scroll='true']") as HTMLElement | null;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollBy({ top: event.deltaY });
  }, []);

  return (
    <>
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: "divider",
          background:
            componentStyles.card.background ||
            ((theme) => alpha(theme.palette.background.paper, 0.9)),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
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
            <GeometricBackground />
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
      <Box sx={{ height: "calc(100vh - 49px)", overflow: "hidden", minWidth: 370, position: "relative" }}>
        {/* Loading overlay при переході між табами */}
        <Fade in={isTransitioning} timeout={{ enter: 100, exit: 200 }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(0, 0, 0, 0.5)"
                  : "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              pointerEvents: isTransitioning ? "auto" : "none",
            }}
          >
            <CircularProgress size={40} />
          </Box>
        </Fade>

        {/* Lazy mounting: рендеримо таб лише якщо він був відкритий хоча б раз */}
        <TabPanel value="email" selectedValue={deferredTab} mounted={mountedTabs.has("email")}>
          <EmailSenderPanel />
        </TabPanel>

        <TabPanel value="blocks" selectedValue={deferredTab} mounted={mountedTabs.has("blocks")}>
          <BlockLibrary />
        </TabPanel>

        <TabPanel value="templates" selectedValue={deferredTab} mounted={mountedTabs.has("templates")}>
          <EmailSenderProvider>
            <TemplateLibrary />
          </EmailSenderProvider>
        </TabPanel>

        <TabPanel value="images" selectedValue={deferredTab} mounted={mountedTabs.has("images")}>
          <ImageConverterPanel />
        </TabPanel>

        <TabPanel value="converter" selectedValue={deferredTab} mounted={mountedTabs.has("converter")}>
          <HtmlConverterPanel />
        </TabPanel>
      </Box>
    </>
  );
}
