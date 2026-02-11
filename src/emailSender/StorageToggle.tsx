import React from "react";

import { Edit, SettingsApplications, Storage } from "@mui/icons-material";
import {
  Alert,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import { StyledPaper } from "../theme";
import { useEmailSender } from "./EmailSenderContext";

export const StorageToggle: React.FC = () => {
  const { useStorageToggle, setUseStorageToggle } = useEmailSender();

  const handleToggleChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: "localStorage" | "env" | "state" | null
  ) => {
    if (newValue !== null) {
      setUseStorageToggle(newValue);
    }
  };

  const getDescription = () => {
    switch (useStorageToggle) {
      case "localStorage":
        return "Credentials are automatically saved and loaded from browser localStorage";
      case "env":
        return "Credentials are loaded from environment variables (.env file)";
      case "state":
        return "Credentials are entered manually and stored only in component state";
      default:
        return "";
    }
  };

  const getAlertType = () => {
    switch (useStorageToggle) {
      case "localStorage":
        return "info";
      case "env":
        return "warning";
      case "state":
        return "success";
      default:
        return "info";
    }
  };

  return (
    <StyledPaper sx={{ p: 2, mb: 2 }}>
      <Typography
        variant='subtitle1'
        sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
      >
        <SettingsApplications />
        Credential Storage Method
      </Typography>

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={useStorageToggle}
          exclusive
          onChange={handleToggleChange}
          aria-label='storage method'
          size='small'
          fullWidth
        >
          <ToggleButton
            value='localStorage'
            aria-label='localStorage'
          >
            <Tooltip title='Save credentials in browser localStorage'>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Storage fontSize='small' />
                LocalStorage
              </Box>
            </Tooltip>
          </ToggleButton>

          <ToggleButton
            value='env'
            aria-label='environment'
          >
            <Tooltip title='Load credentials from environment variables'>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SettingsApplications fontSize='small' />
                .env File
              </Box>
            </Tooltip>
          </ToggleButton>

          <ToggleButton
            value='state'
            aria-label='state'
          >
            <Tooltip title='Enter credentials manually (session only)'>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Edit fontSize='small' />
                Manual Entry
              </Box>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Alert
        severity={getAlertType()}
        sx={{ fontSize: "0.875rem" }}
      >
        {getDescription()}
      </Alert>

      {useStorageToggle === "env" && (
        <Alert
          severity='warning'
          sx={{ mt: 1, fontSize: "0.875rem" }}
        >
          <Typography variant='body2'>
            <strong>Environment variables setup:</strong>
            <br />
            Create a <code>.env</code> file with:
            <br />
            <code>VITE_EMAIL_USER=your-email@gmail.com</code>
            <br />
            <code>VITE_DESTINATION_EMAIL_USER=recipient@example.com</code>
            <br />
            <code>VITE_EMAIL_PASS=your-app-password</code>
          </Typography>
        </Alert>
      )}
    </StyledPaper>
  );
};
