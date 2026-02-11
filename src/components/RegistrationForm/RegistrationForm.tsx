import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  CheckCircle,
  Email,
  Key,
  OpenInNew,
  SaveAlt,
  Security,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { triggerRegistrationStatusUpdate } from "../../hooks/useRegistrationStatus";
import { StyledCard, useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { logger } from "../../utils/logger";

interface RegistrationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  initialData?: {
    userEmail?: string;
    senderEmail?: string;
    appPassword?: string;
  };
}

interface FormData {
  userEmail: string;
  senderEmail: string;
  appPassword: string;
}

const steps = [
  {
    label: "Email Setup",
    description: "Enter your Gmail credentials for sending emails",
  },
  {
    label: "App Password",
    description: "Generate and enter your Google App Password",
  },
  {
    label: "Save & Complete",
    description: "Review and save your configuration",
  },
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  open,
  onClose,
  onSuccess,
  editMode = false,
  initialData,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);
  const dialogPaperSx = useMemo(
    () => ({
      borderRadius: `${componentStyles.card.borderRadius}px`,
      background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.94),
      backdropFilter: componentStyles.card.backdropFilter,
      WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
      border: componentStyles.card.border,
      boxShadow: componentStyles.card.boxShadow,
    }),
    [componentStyles, theme.palette.background.paper]
  );

  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    userEmail: initialData?.userEmail || "",
    senderEmail: initialData?.senderEmail || "",
    appPassword: initialData?.appPassword || "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.userEmail || !validateEmail(formData.userEmail)) {
      newErrors.userEmail = "Please enter a valid email address";
    }

    if (!formData.senderEmail || !validateEmail(formData.senderEmail)) {
      newErrors.senderEmail = "Please enter a valid Gmail address";
    }

    if (!formData.appPassword || formData.appPassword.length < 16) {
      newErrors.appPassword = "App password must be at least 16 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate email fields
      const emailErrors: Partial<FormData> = {};
      if (!formData.userEmail || !validateEmail(formData.userEmail)) {
        emailErrors.userEmail = "Please enter a valid email address";
      }
      if (!formData.senderEmail || !validateEmail(formData.senderEmail)) {
        emailErrors.senderEmail = "Please enter a valid Gmail address";
      }

      if (Object.keys(emailErrors).length > 0) {
        setErrors(emailErrors);
        return;
      }
    }

    if (activeStep === 1) {
      // Validate app password
      if (!formData.appPassword || formData.appPassword.length < 16) {
        setErrors({ appPassword: "App password must be at least 16 characters" });
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Save to localStorage
      const registrationData = {
        userEmail: formData.userEmail,
        senderEmail: formData.senderEmail,
        appPassword: formData.appPassword,
        registeredAt: new Date().toISOString(),
        useStorageToggle: "localStorage" as const,
      };

      localStorage.setItem("emailSenderCredentials", JSON.stringify(registrationData));
      localStorage.setItem("emailSenderUseStorageToggle", "localStorage");

      toast.success(
        editMode
          ? "Credentials updated successfully!"
          : "Registration completed! Your credentials are saved securely."
      );

      // Trigger status update for other components
      triggerRegistrationStatusUpdate();

      // Call success callback
      onSuccess?.();

      // Close dialog
      onClose();

      // Reset form
      setFormData({ userEmail: "", senderEmail: "", appPassword: "" });
      setActiveStep(0);
      setErrors({});
    } catch (error) {
      logger.error("RegistrationForm", "Registration error", error);
      toast.error("Failed to save registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form on close
    setFormData({ userEmail: "", senderEmail: "", appPassword: "" });
    setActiveStep(0);
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px", ...dialogPaperSx },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction='row'
          alignItems='center'
          spacing={1}
        >
          <Security color='primary' />
          <Typography variant='h5'>
            {editMode ? "Edit Email Credentials" : "Email Registration"}
          </Typography>
        </Stack>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mt: 1 }}
        >
          {editMode
            ? "Update your Gmail credentials for email sending"
            : "Set up your Gmail credentials for sending emails directly from the builder"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper
          activeStep={activeStep}
          orientation='vertical'
        >
          {/* Step 1: Email Setup */}
          <Step>
            <StepLabel>
              <Typography variant='h6'>{steps[0].label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography
                color='text.secondary'
                paragraph
              >
                {steps[0].description}
              </Typography>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label='Your Email Address'
                  type='email'
                  value={formData.userEmail}
                  onChange={(e) => handleInputChange("userEmail", e.target.value)}
                  error={Boolean(errors.userEmail)}
                  helperText={errors.userEmail || "Email address that will receive the emails"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Email color='action' />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label='Gmail Sender Address'
                  type='email'
                  value={formData.senderEmail}
                  onChange={(e) => handleInputChange("senderEmail", e.target.value)}
                  error={Boolean(errors.senderEmail)}
                  helperText={
                    errors.senderEmail ||
                    "Gmail address that will send the emails (must be @gmail.com)"
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Email color='action' />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant='contained'
                  onClick={handleNext}
                  disabled={!formData.userEmail || !formData.senderEmail}
                >
                  Continue to App Password
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: App Password */}
          <Step>
            <StepLabel>
              <Typography variant='h6'>{steps[1].label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography
                color='text.secondary'
                paragraph
              >
                {steps[1].description}
              </Typography>

              <Alert
                severity='info'
                sx={{ mb: 3 }}
              >
                <Typography variant='body2'>
                  You need to generate an App Password from your Google Account settings.
                  <Link
                    href='https://myaccount.google.com/apppasswords'
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ ml: 1 }}
                  >
                    Generate App Password
                    <OpenInNew sx={{ fontSize: 14, ml: 0.5 }} />
                  </Link>
                </Typography>
              </Alert>

              <StyledCard variant='outlined' enableHover={false} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    gutterBottom
                  >
                    📋 How to get App Password:
                  </Typography>
                  <Typography
                    variant='body2'
                    component='div'
                  >
                    1. Visit Google Account settings
                    <br />
                    2. Go to Security → 2-Step Verification
                    <br />
                    3. Scroll to App passwords
                    <br />
                    4. Select "Mail" and generate password
                    <br />
                    5. Copy the 16-character password
                  </Typography>
                </CardContent>
              </StyledCard>

              <TextField
                fullWidth
                label='Google App Password'
                type={showPassword ? "text" : "password"}
                value={formData.appPassword}
                onChange={(e) => handleInputChange("appPassword", e.target.value)}
                error={Boolean(errors.appPassword)}
                helperText={errors.appPassword || "16-character app password from Google"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Key color='action' />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge='end'
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  variant='contained'
                  onClick={handleNext}
                  disabled={!formData.appPassword || formData.appPassword.length < 16}
                >
                  Review & Save
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Review & Save */}
          <Step>
            <StepLabel>
              <Typography variant='h6'>{steps[2].label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography
                color='text.secondary'
                paragraph
              >
                {steps[2].description}
              </Typography>

              <StyledCard variant='outlined' enableHover={false} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant='h6'
                    gutterBottom
                    color='primary'
                  >
                    <CheckCircle sx={{ verticalAlign: "middle", mr: 1 }} />
                    Configuration Summary
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='text.secondary'
                      >
                        Recipient Email:
                      </Typography>
                      <Typography variant='body1'>{formData.userEmail}</Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='text.secondary'
                      >
                        Sender Gmail:
                      </Typography>
                      <Typography variant='body1'>{formData.senderEmail}</Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='text.secondary'
                      >
                        App Password:
                      </Typography>
                      <Typography variant='body1'>
                        {"•".repeat(formData.appPassword.length)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StyledCard>

              <Alert
                severity='success'
                sx={{ mb: 3 }}
              >
                <Typography variant='body2'>
                  <SaveAlt sx={{ verticalAlign: "middle", mr: 1 }} />
                  Your credentials will be securely saved in browser localStorage
                </Typography>
              </Alert>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  variant='contained'
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading
                    ? "Saving..."
                    : editMode
                      ? "Update Credentials"
                      : "Complete Registration"}
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationForm;
