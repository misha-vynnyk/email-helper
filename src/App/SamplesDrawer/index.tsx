import React, { useState } from 'react';

import { Email,Settings } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, IconButton, Link, Stack, Tooltip,Typography } from '@mui/material';

import { EmailSettingsMenu } from '../../components/EmailSettingsMenu';
import { RegistrationForm } from '../../components/RegistrationForm';
import { useSamplesDrawerOpen } from '../../documents/editor/EditorContext';
import { useRegistrationStatus } from '../../hooks/useRegistrationStatus';

import SidebarButton from './SidebarButton';
import logo from './waypoint.svg';

export const SAMPLES_DRAWER_WIDTH = 240;

interface SamplesDrawerProps {
  onSettingsOpen?: () => void;
  onRegistrationOpen?: () => void;
}

export default function SamplesDrawer({ onSettingsOpen, onRegistrationOpen }: SamplesDrawerProps = {}) {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const [localSettingsOpen, setLocalSettingsOpen] = useState(false);
  const [localRegistrationOpen, setLocalRegistrationOpen] = useState(false);
  const { isRegistered, registrationData, hasValidCredentials } = useRegistrationStatus();

  const handleEmailSettingsClick = () => {
    if (isRegistered) {
      if (onSettingsOpen) {
        onSettingsOpen();
      } else {
        setLocalSettingsOpen(true);
      }
    } else {
      if (onRegistrationOpen) {
        onRegistrationOpen();
      } else {
        setLocalRegistrationOpen(true);
      }
    }
  };

  const handleEditCredentials = () => {
    setLocalSettingsOpen(false);
    if (onRegistrationOpen) {
      onRegistrationOpen();
    } else {
      setLocalRegistrationOpen(true);
    }
  };

  return (
    <>
      <Drawer
        variant="persistent"
        anchor="left"
        open={samplesDrawerOpen}
        sx={{
          width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
        }}
      >
        <Stack spacing={3} py={1} px={2} width={SAMPLES_DRAWER_WIDTH} justifyContent="space-between" height="100%">
          <Stack spacing={2} sx={{ '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.75 }}>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
                onClick={() => {
                  window.location.hash = '#landing';
                }}
              >
                EmailBuilder.js
              </Typography>

              <Tooltip title={isRegistered ? 'Email Settings' : 'Setup Email'}>
                <IconButton
                  size="small"
                  onClick={handleEmailSettingsClick}
                  color={!hasValidCredentials && isRegistered ? 'warning' : 'primary'}
                >
                  {isRegistered ? <Settings /> : <Email />}
                </IconButton>
              </Tooltip>
            </Box>

            <Stack alignItems="flex-start">
              <SidebarButton href="#empty">Empty</SidebarButton>
              <SidebarButton href="#sample/welcome">Welcome email</SidebarButton>
              <SidebarButton href="#sample/one-time-password">One-time passcode (OTP)</SidebarButton>
              <SidebarButton href="#sample/reset-password">Reset password</SidebarButton>
              <SidebarButton href="#sample/order-ecomerce">E-commerce receipt</SidebarButton>
              <SidebarButton href="#sample/subscription-receipt">Subscription receipt</SidebarButton>
              <SidebarButton href="#sample/reservation-reminder">Reservation reminder</SidebarButton>
              <SidebarButton href="#sample/post-metrics-report">Post metrics</SidebarButton>
              <SidebarButton href="#sample/respond-to-message">Respond to inquiry</SidebarButton>
            </Stack>

            <Divider />

            <Stack>
              <Button
                size="small"
                onClick={() => {
                  window.location.hash = '#landing';
                }}
                sx={{ mb: 1 }}
              >
                ← Back to Home
              </Button>
              <Button size="small" href="https://www.usewaypoint.com/open-source/emailbuilderjs" target="_blank">
                Learn more
              </Button>
              <Button size="small" href="https://github.com/usewaypoint/email-builder-js" target="_blank">
                View on GitHub
              </Button>
            </Stack>
          </Stack>
          <Stack spacing={2} px={0.75} py={3}>
            <Link href="https://usewaypoint.com?utm_source=emailbuilderjs" target="_blank" sx={{ lineHeight: 1 }}>
              <Box component="img" src={logo} width={32} />
            </Link>
            <Box>
              <Typography variant="overline" gutterBottom>
                Looking to send emails?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Waypoint is an end-to-end email API with a &apos;pro&apos; version of this template builder with dynamic
                variables, loops, conditionals, drag and drop, layouts, and more.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ justifyContent: 'center' }}
              href="https://usewaypoint.com?utm_source=emailbuilderjs"
              target="_blank"
            >
              Learn more
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      {/* Modals rendered outside Drawer to avoid aria-hidden conflicts */}
      {!onSettingsOpen && !onRegistrationOpen && (
        <>
          <EmailSettingsMenu
            open={localSettingsOpen}
            onClose={() => setLocalSettingsOpen(false)}
            onEditCredentials={handleEditCredentials}
          />

          <RegistrationForm
            open={localRegistrationOpen}
            onClose={() => setLocalRegistrationOpen(false)}
            editMode={isRegistered}
            initialData={
              registrationData
                ? {
                    userEmail: registrationData.userEmail,
                    senderEmail: registrationData.senderEmail,
                    appPassword: registrationData.appPassword,
                  }
                : undefined
            }
          />
        </>
      )}
    </>
  );
}
