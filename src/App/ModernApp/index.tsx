import "react-toastify/dist/ReactToastify.css";

import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";

import { EmailSettingsMenu } from "../../components/EmailSettingsMenu";
import { RegistrationForm } from "../../components/RegistrationForm";
import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { useTheme } from "../../themes/modern";

import ModernHeader from "./ModernHeader";
import ModernSidebar from "./ModernSidebar";
import ModernTemplatePanel from "./ModernTemplatePanel";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  if (
    error.message?.includes("_controlUniqueID") ||
    error.message?.includes("FormMetadata") ||
    error.stack?.includes("content_script.js")
  ) {
    return null;
  }

  return (
    <div role='alert' className="p-4">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary} className="btn btn-primary">Try again</button>
    </div>
  );
}

export default function ModernApp() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const { isRegistered, registrationData } = useRegistrationStatus();

  const handleRegistrationClick = () => {
    if (isRegistered) {
      setSettingsMenuOpen(true);
    } else {
      setRegistrationOpen(true);
    }
  };

  const handleRegistrationSuccess = () => {
    window.location.hash = "#empty";
  };

  const handleEditCredentials = () => {
    setSettingsMenuOpen(false);
    setRegistrationOpen(true);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="layout">
        <ModernSidebar
          open={samplesDrawerOpen}
          onSettingsOpen={() => setSettingsMenuOpen(true)}
          onRegistrationOpen={() => setRegistrationOpen(true)}
        />

        <main className={`main-content ${!samplesDrawerOpen ? 'sidebar-hidden' : ''}`}>
          <ModernHeader onRegistrationClick={handleRegistrationClick} />
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ModernTemplatePanel />
          </div>
        </main>

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
      </div>
    </ErrorBoundary>
  );
}
