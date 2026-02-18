import "react-toastify/dist/ReactToastify.css";

import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";

import { Stack, useTheme } from "@mui/material";

import { EmailSettingsMenu } from "../components/EmailSettingsMenu";
import { RegistrationForm } from "../components/RegistrationForm";
import { SplashLoader } from "../components/SplashLoader";
import { useSamplesDrawerOpen } from "../contexts/AppState";
import { useRegistrationStatus } from "../hooks/useRegistrationStatus";
import { useServerHealthCheck } from "../hooks/useServerHealthCheck";

import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from "./SamplesDrawer";
import TemplatePanel from "./TemplatePanel";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // Don't show error UI for browser extension errors
  if (error.message?.includes("_controlUniqueID") || error.message?.includes("FormMetadata") || error.stack?.includes("content_script.js")) {
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
  const [showSplash, setShowSplash] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const { isRegistered, registrationData } = useRegistrationStatus();
  const serverHealth = useServerHealthCheck();

  const marginLeftTransition = useDrawerTransition("margin-left", samplesDrawerOpen);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleRegistrationSuccess = () => {
    // Close registration form after success
  };

  const handleEditCredentials = () => {
    setSettingsMenuOpen(false);
    setRegistrationOpen(true);
  };

  if (showSplash || serverHealth.isChecking) {
    return <SplashLoader onComplete={handleSplashComplete} duration={2500} statusMessage={serverHealth.isChecking ? serverHealth.error || "Initializing..." : undefined} />;
  }

  // Show error if server is not healthy
  if (!serverHealth.isHealthy) {
    return <SplashLoader onComplete={handleSplashComplete} duration={0} statusMessage={`❌ ${serverHealth.error}`} isError={true} />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SamplesDrawer onSettingsOpen={() => setSettingsMenuOpen(true)} onRegistrationOpen={() => setRegistrationOpen(true)} />

      <Stack
        sx={{
          marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: marginLeftTransition,
          minHeight: "100vh",
        }}>
        <TemplatePanel />
      </Stack>

      <ToastContainer position='top-right' autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

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

      <EmailSettingsMenu open={settingsMenuOpen} onClose={() => setSettingsMenuOpen(false)} onEditCredentials={handleEditCredentials} />
    </ErrorBoundary>
  );
}
