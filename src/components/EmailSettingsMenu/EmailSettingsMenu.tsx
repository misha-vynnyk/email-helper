import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  CheckCircle,
  Close,
  Delete,
  Edit,
  Email,
  Info,
  Security,
  Settings,
  Storage,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import {
  triggerRegistrationStatusUpdate,
  useRegistrationStatus,
} from "../../hooks/useRegistrationStatus";
import { StyledCard, useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { logger } from "../../utils/logger";

interface EmailSettingsMenuProps {
  open: boolean;
  onClose: () => void;
  onEditCredentials?: () => void;
}

export const EmailSettingsMenu: React.FC<EmailSettingsMenuProps> = ({
  open,
  onClose,
  onEditCredentials,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);
  const dialogPaperSx = useMemo(
    () => ({
      borderRadius: `${componentStyles.card.borderRadius}px`,
      background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
      backdropFilter: componentStyles.card.backdropFilter,
      WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
      border: componentStyles.card.border,
      boxShadow: componentStyles.card.boxShadow,
    }),
    [componentStyles, theme.palette.background.paper]
  );

  const { isRegistered, registrationData, hasValidCredentials, registeredAt } =
    useRegistrationStatus();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDeleteCredentials = () => {
    try {
      localStorage.removeItem("emailSenderCredentials");
      localStorage.removeItem("emailSenderUseStorageToggle");

      toast.success("Email credentials deleted successfully");
      triggerRegistrationStatusUpdate();
      setDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      logger.error("EmailSettingsMenu", "Error deleting credentials", error);
      toast.error("Failed to delete credentials");
    }
  };

  const handleEditCredentials = () => {
    onEditCredentials?.();
    onClose();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    const maskedLocal =
      local.length > 2
        ? local.substring(0, 2) + "*".repeat(Math.max(0, local.length - 4)) + local.slice(-2)
        : local;
    return `${maskedLocal}@${domain}`;
  };

  const maskPassword = (password: string) => {
    return "•".repeat(Math.min(password.length, 16));
  };

  if (!isRegistered || !registrationData) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle>
          <Stack
            direction='row'
            alignItems='center'
            spacing={1}
          >
            <Settings color='primary' />
            <Typography variant='h6'>Email Settings</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert
            severity='info'
            sx={{ mb: 2 }}
          >
            <Typography variant='body2'>
              No email credentials found. Set up your email configuration to start sending emails.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant='contained'
            onClick={handleEditCredentials}
          >
            Setup Email
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle>
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
          >
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
            >
              <Settings color='primary' />
              <Typography variant='h6'>Email Settings</Typography>
            </Stack>
            <IconButton
              onClick={onClose}
              size='small'
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {/* Status Alert */}
          <Alert
            severity={hasValidCredentials ? "success" : "warning"}
            sx={{ mb: 3 }}
            icon={hasValidCredentials ? <CheckCircle /> : <Warning />}
          >
            <Typography variant='body2'>
              {hasValidCredentials
                ? "Your email credentials are valid and ready to use"
                : "Your email credentials need attention - some fields may be invalid"}
            </Typography>
          </Alert>

          {/* Credentials Summary Card */}
          <StyledCard
            variant='outlined'
            enableHover={false}
            sx={{ mb: 3 }}
          >
            <CardContent>
              <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Security color='primary' />
                <Typography variant='h6'>Saved Credentials</Typography>
                <Chip
                  label={hasValidCredentials ? "Valid" : "Needs Review"}
                  color={hasValidCredentials ? "success" : "warning"}
                  size='small'
                />
              </Stack>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary='Recipient Email'
                    secondary={registrationData.userEmail || "Not set"}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary='Gmail Sender'
                    secondary={maskEmail(registrationData.senderEmail || "")}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary='App Password'
                    secondary={
                      registrationData.appPassword
                        ? maskPassword(registrationData.appPassword)
                        : "Not set"
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary='Storage Method'
                    secondary='Browser localStorage'
                  />
                </ListItem>

                {registeredAt && (
                  <ListItem>
                    <ListItemIcon>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      primary='Registered'
                      secondary={formatDate(registeredAt)}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>

            <CardActions>
              <Button
                startIcon={<Edit />}
                onClick={handleEditCredentials}
                variant='outlined'
              >
                Edit Credentials
              </Button>
              <Button
                startIcon={<Delete />}
                onClick={() => setDeleteConfirmOpen(true)}
                color='error'
                variant='outlined'
              >
                Delete All
              </Button>
            </CardActions>
          </StyledCard>

          {/* Help Information */}
          <StyledCard variant='outlined' enableHover={false}>
            <CardContent>
              <Typography
                variant='subtitle1'
                gutterBottom
              >
                <Info sx={{ verticalAlign: "middle", mr: 1 }} />
                Important Information
              </Typography>

              <Typography
                variant='body2'
                color='text.secondary'
                paragraph
              >
                • Your credentials are stored locally in your browser only
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                paragraph
              >
                • Use Google App Passwords, not your regular Gmail password
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                paragraph
              >
                • Deleting credentials will require re-registration to send emails
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >
                • Credentials are not synced across devices or browsers
              </Typography>
            </CardContent>
          </StyledCard>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle>
          <Stack
            direction='row'
            alignItems='center'
            spacing={1}
          >
            <Warning color='error' />
            <Typography variant='h6'>Delete Email Credentials?</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography
            variant='body1'
            paragraph
          >
            Are you sure you want to delete your saved email credentials?
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
          >
            This action cannot be undone. You will need to re-register your email settings to send
            emails from the builder.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteCredentials}
            color='error'
            variant='contained'
            startIcon={<Delete />}
          >
            Delete Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmailSettingsMenu;
