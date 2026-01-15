import React, { lazy, Suspense } from "react";

import { Box, CircularProgress, Typography } from "@mui/material";

import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";

// Lazy load email components for better performance
const EmailCredentialsForm = lazy(() => import("../../emailSender/EmailCredentialsForm"));
const EmailHtmlEditor = lazy(() => import("../../emailSender/EmailHtmlEditor"));

// Main content of the email sender panel
const EmailSenderPanelContent: React.FC = () => {
  return (
    <Box
      data-app-scroll="true"
      sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "auto", p: 2 }}
    >
      <Typography
        variant='h5'
        sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
      >
        📧 Email Sender
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
              <CircularProgress size={32} />
              <Typography sx={{ ml: 2 }}>Loading email components...</Typography>
            </Box>
          }
        >
          <EmailCredentialsForm />
          <EmailHtmlEditor />
        </Suspense>
      </Box>
    </Box>
  );
};

export default function EmailSenderPanel() {
  return (
    <EmailSenderProvider>
      <EmailSenderPanelContent />
    </EmailSenderProvider>
  );
}
