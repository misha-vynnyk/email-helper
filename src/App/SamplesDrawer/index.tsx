import { alpha, Box, Drawer, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Settings, Email } from "@mui/icons-material";

import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { brandColors } from "../../theme/tokens";

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
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();

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
        },
      }}
    >
      <Stack
        height="100%"
        justifyContent="space-between"
        py={2}
        px={2}
      >
        {/* Logo Section */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            {/* Logo Icon */}
            <Box
              sx={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${brandColors.blue} 0%, ${brandColors.navy} 100%)`,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: theme.shadows[2],
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </Box>

            {/* Logo Text */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "0.95rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                FlexiBuilder
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Email Tools
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Section - Settings */}
        <Stack spacing={1}>
          <Tooltip title={isRegistered ? "Email Settings" : "Setup Email"} placement="right">
            <IconButton
              onClick={handleEmailSettingsClick}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                color: !hasValidCredentials && isRegistered ? "error.main" : "text.secondary",
                backgroundColor: "background.default",
                border: 1,
                borderColor: "divider",
                "&:hover": {
                  backgroundColor: "action.hover",
                  color: "primary.main",
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
