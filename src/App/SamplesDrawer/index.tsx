import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Settings, Email } from "@mui/icons-material";

import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";

export const SAMPLES_DRAWER_WIDTH = 200;

interface SamplesDrawerProps {
  onSettingsOpen?: () => void;
  onRegistrationOpen?: () => void;
}

export default function SamplesDrawer({
  onSettingsOpen,
  onRegistrationOpen,
}: SamplesDrawerProps = {}) {
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
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
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
            sx={{ mb: 3 }}
          >
            {/* Logo Icon */}
            <Box
              sx={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
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
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: "0.95rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                FlexiBuilder
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
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
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                color: !hasValidCredentials && isRegistered ? "#f59e0b" : "#64748b",
                backgroundColor: "rgba(255,255,255,0.05)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#fff",
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
