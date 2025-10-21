import { useEffect, useState } from "react";

interface RegistrationData {
  userEmail: string;
  senderEmail: string;
  appPassword: string;
  registeredAt?: string;
  useStorageToggle?: string;
}

interface RegistrationStatus {
  isRegistered: boolean;
  registrationData: RegistrationData | null;
  hasValidCredentials: boolean;
  registeredAt: string | null;
}

export const useRegistrationStatus = (): RegistrationStatus => {
  const [status, setStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    registrationData: null,
    hasValidCredentials: false,
    registeredAt: null,
  });

  const checkRegistrationStatus = () => {
    try {
      // Check new format first
      const registrationData = localStorage.getItem("emailSenderCredentials");
      if (registrationData) {
        const parsed: RegistrationData = JSON.parse(registrationData);
        const hasValidCredentials = Boolean(
          parsed.userEmail &&
            parsed.senderEmail &&
            parsed.appPassword &&
            parsed.userEmail.includes("@") &&
            parsed.senderEmail.includes("@gmail.com") &&
            parsed.appPassword.length >= 16
        );

        setStatus({
          isRegistered: true,
          registrationData: parsed,
          hasValidCredentials,
          registeredAt: parsed.registeredAt || null,
        });
        return;
      }

      // Fallback to old format
      const oldData = localStorage.getItem("emailSenderForm");
      if (oldData) {
        const parsed: RegistrationData = JSON.parse(oldData);
        const hasValidCredentials = Boolean(
          parsed.userEmail &&
            parsed.senderEmail &&
            parsed.appPassword &&
            parsed.userEmail.includes("@") &&
            parsed.senderEmail.includes("@gmail.com") &&
            parsed.appPassword.length >= 16
        );

        setStatus({
          isRegistered: true,
          registrationData: parsed,
          hasValidCredentials,
          registeredAt: null,
        });
        return;
      }

      // No registration data found
      setStatus({
        isRegistered: false,
        registrationData: null,
        hasValidCredentials: false,
        registeredAt: null,
      });
    } catch (error) {
      console.warn("Error checking registration status", error);
      setStatus({
        isRegistered: false,
        registrationData: null,
        hasValidCredentials: false,
        registeredAt: null,
      });
    }
  };

  useEffect(() => {
    checkRegistrationStatus();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emailSenderCredentials" || e.key === "emailSenderForm") {
        checkRegistrationStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for manual localStorage updates within the same tab
    const handleLocalUpdate = () => {
      checkRegistrationStatus();
    };

    // Create a custom event for manual updates
    window.addEventListener("registrationStatusUpdate", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("registrationStatusUpdate", handleLocalUpdate);
    };
  }, []);

  return status;
};

// Helper function to trigger status update
export const triggerRegistrationStatusUpdate = () => {
  window.dispatchEvent(new CustomEvent("registrationStatusUpdate"));
};

export default useRegistrationStatus;
