import React from 'react';

import { Email, GitHub, PersonAdd, Settings } from '@mui/icons-material';
import { AppBar, Box, Button, Container, Stack,Toolbar, Typography } from '@mui/material';

import { useRegistrationStatus } from '../../hooks/useRegistrationStatus';

interface HeaderProps {
  onLogoClick: () => void;
  showBackToBuilder?: boolean;
  onBackToBuilder?: () => void;
  onRegistrationClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onLogoClick,
  showBackToBuilder = false,
  onBackToBuilder,
  onRegistrationClick,
}) => {
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();

  const getRegistrationButtonText = () => {
    if (!isRegistered) return 'Setup Email';
    if (!hasValidCredentials) return 'Fix Email Setup';
    return 'Email Settings';
  };

  const getRegistrationButtonIcon = () => {
    if (!isRegistered) return <PersonAdd />;
    if (!hasValidCredentials) return <PersonAdd />;
    return <Settings />;
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            onClick={onLogoClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 4,
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <Email sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              EmailBuilder.js
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={2} alignItems="center">
            {showBackToBuilder && (
              <Button variant="outlined" onClick={onBackToBuilder} size="small">
                Back to Builder
              </Button>
            )}

            {onRegistrationClick && (
              <Button
                variant="text"
                onClick={onRegistrationClick}
                startIcon={getRegistrationButtonIcon()}
                size="small"
                color={!hasValidCredentials && isRegistered ? 'warning' : 'primary'}
              >
                {getRegistrationButtonText()}
              </Button>
            )}

            <Button
              variant="text"
              href="https://www.usewaypoint.com/open-source/emailbuilderjs"
              target="_blank"
              size="small"
            >
              Learn More
            </Button>

            <Button
              variant="outlined"
              startIcon={<GitHub />}
              href="https://github.com/usewaypoint/email-builder-js"
              target="_blank"
              size="small"
            >
              GitHub
            </Button>

            <Button
              variant="contained"
              onClick={onBackToBuilder || (() => (window.location.hash = '#empty'))}
              size="small"
            >
              Open Builder
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
