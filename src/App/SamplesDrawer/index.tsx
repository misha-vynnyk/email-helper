import React from "react";

import { alpha, Box, Divider, Drawer, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Settings, Email } from "@mui/icons-material";

import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import GeometricBackground from "../../imageConverter/components/GeometricBackground";
import { getComponentStyles, useThemeMode } from "../../theme";
import { getGradients } from "../../theme/tokens";

export const SAMPLES_DRAWER_WIDTH = 200;

interface SamplesDrawerProps {
  onSettingsOpen?: () => void;
  onRegistrationOpen?: () => void;
}

export default function SamplesDrawer({
  onSettingsOpen,
  onRegistrationOpen,
}: SamplesDrawerProps = {}) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const gradients = getGradients(mode);
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();
  const showAnimatedBackground = style !== "default";
  const handleFixedWheel = React.useCallback((event: React.WheelEvent) => {
    const scrollTarget = document.querySelector("[data-app-scroll='true']") as HTMLElement | null;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollBy({ top: event.deltaY });
  }, []);

  const handleEmailSettingsClick = () => {
    if (isRegistered) {
      onSettingsOpen?.();
    } else {
      onRegistrationOpen?.();
    }
  };

  return (
    <Drawer
      variant='persistent'
      anchor='left'
      open={samplesDrawerOpen}
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
        "& .MuiDrawer-paper": {
          width: SAMPLES_DRAWER_WIDTH,
          backgroundColor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          paddingTop: "10px",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Animated Background - only for non-default styles */}
      {showAnimatedBackground && (
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <GeometricBackground />
        </Box>
      )}
      <Stack
        height="100%"
        justifyContent="space-between"
        pt={0}
        pb={2}
        px={2}
        sx={{ position: "relative", zIndex: 1 }}
        onWheel={handleFixedWheel}
      >
        {/* Logo Section */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              p: 1.5,
              borderRadius: componentStyles.card.borderRadius,
              backgroundColor: componentStyles.card.background || alpha(theme.palette.primary.main, 0.05),
              backdropFilter: componentStyles.card.backdropFilter,
              WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
              border: componentStyles.card.border,
              boxShadow: componentStyles.card.boxShadow,
              transition: "all 0.3s ease",
              cursor: "default",
              "&:hover": {
                transform: componentStyles.card.hover?.transform,
                boxShadow: componentStyles.card.hover?.boxShadow || componentStyles.card.boxShadow,
              },
            }}
          >
            {/* Logo Icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                background: gradients.primary,
                borderRadius: componentStyles.card.borderRadius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05) rotate(2deg)",
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                  background: gradients.primaryHover,
                },
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </Box>

            {/* Logo Text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  background: gradients.primary,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "1rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                FlexiBuilder
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  display: "block",
                  mt: 0.25,
                }}
              >
                Email Tools
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Section - Settings */}
        <Stack spacing={1.5}>
          <Divider
            sx={{
              my: 1,
              borderColor: alpha(theme.palette.divider, 0.5),
            }}
          />
          <Tooltip title={isRegistered ? "Email Settings" : "Setup Email"} placement="right" arrow>
            <IconButton
              onClick={handleEmailSettingsClick}
              size="medium"
              sx={{
                width: 44,
                height: 44,
                borderRadius: componentStyles.card.borderRadius,
                color: !hasValidCredentials && isRegistered ? "error.main" : theme.palette.primary.main,
                backgroundColor: !hasValidCredentials && isRegistered
                  ? alpha(theme.palette.error.main, 0.1)
                  : componentStyles.card.background || alpha(theme.palette.primary.main, 0.08),
                backdropFilter: componentStyles.card.backdropFilter,
                WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
                border: componentStyles.card.border,
                boxShadow: componentStyles.card.boxShadow,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: componentStyles.card.hover?.transform || "translateY(-2px)",
                  boxShadow: componentStyles.card.hover?.boxShadow || theme.shadows[4],
                  backgroundColor: !hasValidCredentials && isRegistered
                    ? alpha(theme.palette.error.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.15),
                  color: !hasValidCredentials && isRegistered ? "error.dark" : theme.palette.primary.dark,
                },
              }}
            >
              {isRegistered ? <Settings fontSize="small" /> : <Email fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Drawer>
  );
}
