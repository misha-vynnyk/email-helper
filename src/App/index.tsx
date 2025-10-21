import "react-toastify/dist/ReactToastify.css";

import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";

import { Stack, useTheme } from "@mui/material";

import { EmailSettingsMenu } from "../components/EmailSettingsMenu";
import { Header, LandingPage } from "../components/LandingPage";
import { RegistrationForm } from "../components/RegistrationForm";
import { useSamplesDrawerOpen } from "../documents/editor/EditorContext";
import { useRegistrationStatus } from "../hooks/useRegistrationStatus";

import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from "./SamplesDrawer";
import TemplatePanel from "./TemplatePanel";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Don't show error UI for browser extension errors
  if (
    error.message?.includes("_controlUniqueID") ||
    error.message?.includes("FormMetadata") ||
    error.stack?.includes("content_script.js")
  ) {
    return null;
  }

  return (
    <div role='alert'>
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function useDrawerTransition(cssProperty: "margin-left" | "margin-right", open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

export default function App() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const [showLanding, setShowLanding] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const { isRegistered, registrationData } = useRegistrationStatus();

  const marginLeftTransition = useDrawerTransition("margin-left", samplesDrawerOpen);

  // Check if we should show landing page
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      // Show landing only if hash is empty (first visit) or explicitly '#landing'
      setShowLanding(!hash || hash === "#landing");
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const handleLogoClick = () => {
    window.location.hash = "#landing";
    setShowLanding(true);
  };

  const handleBackToBuilder = () => {
    window.location.hash = "#empty";
    setShowLanding(false);
  };

  const handleRegistrationClick = () => {
    if (isRegistered) {
      // Show settings menu if already registered
      setSettingsMenuOpen(true);
    } else {
      // Show registration form for new users
      setRegistrationOpen(true);
    }
  };

  const handleRegistrationSuccess = () => {
    // Navigate to builder after successful registration
    window.location.hash = "#empty";
    setShowLanding(false);
  };

  const handleEditCredentials = () => {
    setSettingsMenuOpen(false);
    setRegistrationOpen(true);
  };

  if (showLanding) {
    return (
      <>
        <Header
          onLogoClick={handleLogoClick}
          showBackToBuilder={false}
          onBackToBuilder={handleBackToBuilder}
          onRegistrationClick={handleRegistrationClick}
        />
        <LandingPage />
        <ToastContainer
          position='top-right'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SamplesDrawer
        onSettingsOpen={() => setSettingsMenuOpen(true)}
        onRegistrationOpen={() => setRegistrationOpen(true)}
      />

      <Stack
        sx={{
          marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: marginLeftTransition,
          minHeight: "100vh",
        }}
      >
        <TemplatePanel />
      </Stack>

      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Modals rendered outside any containers to avoid aria-hidden conflicts */}
      <RegistrationForm
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
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

      <EmailSettingsMenu
        open={settingsMenuOpen}
        onClose={() => setSettingsMenuOpen(false)}
        onEditCredentials={handleEditCredentials}
      />
    </ErrorBoundary>
  );
}
