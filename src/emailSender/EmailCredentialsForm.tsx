import {
  AccountCircle,
  Email,
  ExpandLess,
  ExpandMore,
  Security,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

import { StyledPaper } from "../theme";
import { useEmailSender } from "./EmailSenderContext";
import { StorageToggle } from "./StorageToggle";

const EmailCredentialsForm: React.FC = () => {
  const {
    userEmail,
    setUserEmail,
    senderEmail,
    setSenderEmail,
    appPassword,
    setAppPassword,
    areCredentialsValid,
    serverStatus,
    useStorageToggle,
  } = useEmailSender();

  const [showPassword, setShowPassword] = React.useState(false);

  // За замовчуванням відкрито для всіх режимів крім "state" (Manual Entry)
  const [isExpanded, setIsExpanded] = React.useState(() => {
    const saved = localStorage.getItem("emailCredentialsExpanded");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return useStorageToggle !== "state"; // Закрито тільки для Manual Entry
  });

  // Зберігаємо стан згортання
  React.useEffect(() => {
    localStorage.setItem("emailCredentialsExpanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Автоматично відкриваємо при зміні режиму (крім Manual Entry)
  React.useEffect(() => {
    if (useStorageToggle === "state") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [useStorageToggle]);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getServerStatusChip = () => {
    switch (serverStatus) {
      case "online":
        return (
          <Chip
            label='Server Online'
            color='success'
            size='small'
          />
        );
      case "offline":
        return (
          <Chip
            label='Server Offline'
            color='error'
            size='small'
          />
        );
      default:
        return (
          <Chip
            label='Checking...'
            color='default'
            size='small'
          />
        );
    }
  };

  return (
    <>
      <StorageToggle />

      <StyledPaper sx={{ p: 3, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            cursor: "pointer",
            "&:hover": { backgroundColor: "action.hover" },
            borderRadius: 1,
            p: 1,
            mx: -1,
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Typography
            variant='h6'
            sx={{ flexGrow: 1 }}
          >
            📧 Email Configuration
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getServerStatusChip()}
            <IconButton size='small'>{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
          </Box>
        </Box>

        <Collapse in={isExpanded}>
          {!areCredentialsValid && (
            <Alert
              severity='info'
              sx={{ mb: 2 }}
            >
              Please configure your email credentials to send emails. Use Gmail app passwords for
              authentication.
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label='Gmail Sender'
              type='email'
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder='your-email@gmail.com'
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <AccountCircle />
                  </InputAdornment>
                ),
              }}
              helperText="The Gmail account you'll send emails from"
            />

            <TextField
              label='Recipient Email'
              type='email'
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder='recipient@example.com'
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Email />
                  </InputAdornment>
                ),
              }}
              helperText='The email address that will receive the template'
            />

            <FormControl
              variant='outlined'
              fullWidth
            >
              <InputLabel htmlFor='app-password'>Gmail App Password</InputLabel>
              <OutlinedInput
                id='app-password'
                type={showPassword ? "text" : "password"}
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder='16-character app password'
                startAdornment={
                  <InputAdornment position='start'>
                    <Security />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='toggle password visibility'
                      onClick={handleTogglePasswordVisibility}
                      edge='end'
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label='Gmail App Password'
              />
            </FormControl>

            <Alert
              severity='warning'
              sx={{ mt: 1 }}
            >
              <Typography variant='body2'>
                <strong>Important:</strong> Use Gmail App Passwords, not your regular password.
                <br />
                Generate one at: Google Account → Security → 2-Step Verification → App passwords
              </Typography>
            </Alert>
          </Box>
        </Collapse>
      </StyledPaper>
    </>
  );
};

export { EmailCredentialsForm };
export default EmailCredentialsForm;
