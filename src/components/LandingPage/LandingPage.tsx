import React, { useState } from "react";

import {
  Build,
  Code,
  Download,
  Email,
  PersonAdd,
  Preview,
  Security,
  Send,
  Settings,
  Speed,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { RegistrationForm } from "../RegistrationForm";

const LandingPage: React.FC = () => {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();

  const handleGetStarted = () => {
    // Load empty template and hide landing page
    window.location.hash = "#empty";
  };

  const handleLoadSample = (sample: string) => {
    window.location.hash = `#sample/${sample}`;
  };

  const handleRegisterClick = () => {
    setRegistrationOpen(true);
  };

  const handleRegistrationSuccess = () => {
    // Optionally navigate to builder after successful registration
    window.location.hash = "#empty";
  };

  const getRegistrationButtonText = () => {
    if (!isRegistered) return "Setup Email";
    if (!hasValidCredentials) return "Fix Email Setup";
    return "Email Settings";
  };

  const getRegistrationButtonIcon = () => {
    if (!isRegistered) return <PersonAdd />;
    if (!hasValidCredentials) return <PersonAdd />;
    return <Settings />;
  };

  const features = [
    {
      icon: <Build />,
      title: "Visual Editor",
      description: "Drag-and-drop email builder with real-time preview",
    },
    {
      icon: <Email />,
      title: "Email Sending",
      description: "Integrated Gmail sending with secure authentication",
    },
    {
      icon: <Speed />,
      title: "Fast & Lightweight",
      description: "Optimized for performance with lazy loading",
    },
    {
      icon: <Security />,
      title: "Secure",
      description: "Multiple credential storage options for security",
    },
    {
      icon: <Preview />,
      title: "Mobile Preview",
      description: "Test your emails on different screen sizes",
    },
    {
      icon: <Code />,
      title: "HTML Export",
      description: "Export clean HTML ready for any email service",
    },
  ];

  const workflows = [
    {
      step: 1,
      icon: <Build />,
      title: "Design",
      description: "Create email templates with visual editor",
    },
    {
      step: 2,
      icon: <Preview />,
      title: "Preview",
      description: "Test on desktop and mobile views",
    },
    {
      step: 3,
      icon: <Send />,
      title: "Send",
      description: "Send via Gmail or export HTML",
    },
  ];

  const samples = [
    { id: "welcome", name: "Welcome Email", description: "User onboarding template" },
    { id: "one-time-password", name: "OTP Email", description: "One-time password template" },
    { id: "reset-password", name: "Reset Password", description: "Password reset template" },
    {
      id: "order-ecomerce",
      name: "E-commerce Receipt",
      description: "Order confirmation template",
    },
    {
      id: "reservation-reminder",
      name: "Reservation Reminder",
      description: "Booking reminder template",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha("#1976d2", 0.1)} 0%, ${alpha("#42a5f5", 0.1)} 100%)`,
          py: 8,
        }}
      >
        <Container maxWidth='lg'>
          <Grid
            container
            spacing={4}
            alignItems='center'
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Stack spacing={3}>
                <Chip
                  label='🎉 Now with Integrated Email Sending!'
                  color='primary'
                  variant='outlined'
                  sx={{ alignSelf: "flex-start" }}
                />
                <Typography
                  variant='h2'
                  component='h1'
                  fontWeight='bold'
                  color='primary'
                >
                  EmailBuilder.js
                </Typography>
                <Typography
                  variant='h5'
                  color='text.secondary'
                  sx={{ mb: 3 }}
                >
                  Free and open-source email template builder with integrated sending capabilities
                </Typography>
                <Typography
                  variant='body1'
                  color='text.secondary'
                  paragraph
                >
                  Build beautiful, responsive email templates faster than ever with our visual
                  editor, then send them directly via Gmail integration - all in one unified
                  interface.
                </Typography>
                <Stack
                  direction='row'
                  spacing={2}
                >
                  <Button
                    variant='contained'
                    size='large'
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant='outlined'
                    size='large'
                    onClick={handleRegisterClick}
                    startIcon={getRegistrationButtonIcon()}
                    color={!hasValidCredentials && isRegistered ? "warning" : "primary"}
                  >
                    {getRegistrationButtonText()}
                  </Button>
                  <Button
                    variant='text'
                    size='large'
                    href='https://github.com/usewaypoint/email-builder-js'
                    target='_blank'
                  >
                    GitHub
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <Box
                sx={{
                  position: "relative",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant='h1'
                  sx={{ fontSize: "8rem", opacity: 0.1 }}
                >
                  📧
                </Typography>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "background.paper",
                    borderRadius: 2,
                    p: 3,
                    boxShadow: 3,
                  }}
                >
                  <Typography variant='h6'>Build + Send Emails</Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                  >
                    All in one place
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container
        maxWidth='lg'
        sx={{ py: 8 }}
      >
        <Typography
          variant='h3'
          component='h2'
          textAlign='center'
          gutterBottom
        >
          Everything you need to build and send emails
        </Typography>
        <Typography
          variant='h6'
          color='text.secondary'
          textAlign='center'
          paragraph
          sx={{ mb: 6 }}
        >
          From visual design to Gmail integration - complete email workflow
        </Typography>

        <Grid
          container
          spacing={4}
        >
          {features.map((feature, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
            >
              <Card sx={{ height: "100%", "&:hover": { boxShadow: 6 } }}>
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Workflow Section */}
      <Box sx={{ backgroundColor: alpha("#f5f5f5", 0.5), py: 8 }}>
        <Container maxWidth='lg'>
          <Typography
            variant='h3'
            component='h2'
            textAlign='center'
            gutterBottom
          >
            Simple 3-Step Workflow
          </Typography>
          <Typography
            variant='h6'
            color='text.secondary'
            textAlign='center'
            paragraph
            sx={{ mb: 6 }}
          >
            Design, preview, and send - it's that easy
          </Typography>

          <Grid
            container
            spacing={4}
            justifyContent='center'
          >
            {workflows.map((workflow, index) => (
              <Grid
                item
                xs={12}
                sm={4}
                key={index}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      position: "relative",
                    }}
                  >
                    <Typography
                      variant='caption'
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "secondary.main",
                        color: "white",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {workflow.step}
                    </Typography>
                    {workflow.icon}
                  </Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                  >
                    {workflow.title}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                  >
                    {workflow.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Sample Templates Section */}
      <Container
        maxWidth='lg'
        sx={{ py: 8 }}
      >
        <Typography
          variant='h3'
          component='h2'
          textAlign='center'
          gutterBottom
        >
          Start with a Template
        </Typography>
        <Typography
          variant='h6'
          color='text.secondary'
          textAlign='center'
          paragraph
          sx={{ mb: 6 }}
        >
          Choose from our professionally designed templates
        </Typography>

        <Grid
          container
          spacing={3}
        >
          {samples.map((sample) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={sample.id}
            >
              <Card
                sx={{ "&:hover": { boxShadow: 4 }, cursor: "pointer" }}
                onClick={() => handleLoadSample(sample.id)}
              >
                <CardContent>
                  <Typography
                    variant='h6'
                    gutterBottom
                  >
                    {sample.name}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    paragraph
                  >
                    {sample.description}
                  </Typography>
                  <Button
                    size='small'
                    variant='outlined'
                    fullWidth
                  >
                    Load Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Button
            variant='contained'
            size='large'
            onClick={handleGetStarted}
          >
            Start with Blank Template
          </Button>
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{ backgroundColor: "primary.main", color: "white", py: 8 }}>
        <Container
          maxWidth='md'
          sx={{ textAlign: "center" }}
        >
          <Typography
            variant='h3'
            component='h2'
            gutterBottom
          >
            Ready to build amazing emails?
          </Typography>
          <Typography
            variant='h6'
            paragraph
            sx={{ mb: 4 }}
          >
            Join thousands of developers using EmailBuilder.js to create beautiful, responsive email
            templates with integrated sending capabilities.
          </Typography>
          <Stack
            direction='row'
            spacing={2}
            justifyContent='center'
          >
            <Button
              variant='contained'
              color='secondary'
              size='large'
              onClick={handleGetStarted}
            >
              Get Started Now
            </Button>
            <Button
              variant='outlined'
              size='large'
              sx={{ color: "white", borderColor: "white" }}
              href='https://github.com/usewaypoint/email-builder-js'
              target='_blank'
            >
              <Download sx={{ mr: 1 }} />
              Download
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Registration Form Modal */}
      <RegistrationForm
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </Box>
  );
};

export default LandingPage;
