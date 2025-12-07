import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import API_URL from "../config/api";
import { preloadImages } from "../utils/imageUrlReplacer";

interface EmailSenderContextType {
  editorHtml: string;
  setEditorHtml: (html: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  loading: boolean;
  sendEmail: () => Promise<void>;
  sendEmailDirect: (html: string, emailSubject: string) => Promise<void>;
  userEmail: string;
  setUserEmail: (email: string) => void;
  senderEmail: string;
  setSenderEmail: (email: string) => void;
  appPassword: string;
  setAppPassword: (password: string) => void;
  isReadyToSend: boolean;
  areCredentialsValid: boolean;
  serverStatus: "checking" | "online" | "offline";
  checkServerStatus: () => Promise<void>;
  useStorageToggle: "localStorage" | "env" | "state";
  setUseStorageToggle: (toggle: "localStorage" | "env" | "state") => void;
}

export const EmailSenderContext = createContext<EmailSenderContextType | undefined>(undefined);

export const useEmailSender = () => {
  const context = useContext(EmailSenderContext);
  if (!context) {
    throw new Error("useEmailSender must be used within EmailSenderProvider");
  }
  return context;
};

// Проста валідація email
const validateEmail = (email: string): boolean => {
  return email.includes("@") && email.includes(".");
};

// Проста валідація HTML
const validateHTML = (html: string): boolean => {
  return html.trim().length > 0;
};

export const EmailSenderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Завантажуємо збережений HTML з sessionStorage або використовуємо дефолтний
  const [editorHtml, setEditorHtml] = useState(() => {
    const saved = sessionStorage.getItem("emailEditorHtml");
    return saved || "<h1>Hello email!</h1>";
  });

  const [subject, setSubject] = useState(() => {
    const saved = sessionStorage.getItem("emailSubject");
    return saved || "Untitled Email";
  });
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  // Email credentials
  const [userEmail, setUserEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");

  // Storage toggle state
  const [useStorageToggle, setUseStorageToggle] = useState<"localStorage" | "env" | "state">(
    "localStorage"
  );

  // Перевірка стану сервера
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      setServerStatus(response.ok ? "online" : "offline");
    } catch {
      setServerStatus("offline");
    }
  }, []);

  // Автоматичне збереження HTML та subject в sessionStorage
  useEffect(() => {
    sessionStorage.setItem("emailEditorHtml", editorHtml);
  }, [editorHtml]);

  // Preload зображень з HTML в кеш при зміні HTML
  useEffect(() => {
    if (editorHtml) {
      // Завантажуємо зображення в фоні, не блокуємо UI
      preloadImages(editorHtml).catch(error => {
        // Ігноруємо помилки - це не критично
        console.warn('[EmailSender] Failed to preload images:', error);
      });
    }
  }, [editorHtml]);

  useEffect(() => {
    sessionStorage.setItem("emailSubject", subject);
  }, [subject]);

  // Завантаження збережених даних та env змінних
  useEffect(() => {
    if (useStorageToggle === "localStorage") {
      // First try to load from registration data
      const registrationData = localStorage.getItem("emailSenderCredentials");
      if (registrationData) {
        try {
          const parsed = JSON.parse(registrationData);
          setUserEmail(parsed.userEmail || "");
          setSenderEmail(parsed.senderEmail || "");
          setAppPassword(parsed.appPassword || "");
        } catch {
          // Failed to parse registration credentials
        }
      } else {
        // Fallback to old format for compatibility
        const savedData = localStorage.getItem("emailSenderForm");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setUserEmail(parsed.userEmail || "");
            setSenderEmail(parsed.senderEmail || "");
            setAppPassword(parsed.appPassword || "");
          } catch {
            // Failed to parse saved email credentials
          }
        }
      }
    } else if (useStorageToggle === "env") {
      // Load from environment variables (would need to be passed from server)
      setUserEmail(import.meta.env.VITE_EMAIL_USER || "");
      setSenderEmail(import.meta.env.VITE_DESTINATION_EMAIL_USER || "");
      setAppPassword(import.meta.env.VITE_EMAIL_PASS || "");
    } else if (useStorageToggle === "state") {
      // Clear all credentials to use manual state
      setUserEmail("");
      setSenderEmail("");
      setAppPassword("");
    }

    checkServerStatus();
  }, [checkServerStatus, useStorageToggle]);

  // Автозбереження credentials (тільки для localStorage режиму)
  useEffect(() => {
    if (useStorageToggle === "localStorage" && (userEmail || senderEmail || appPassword)) {
      const dataToSave = {
        userEmail,
        senderEmail,
        appPassword,
        updatedAt: new Date().toISOString(),
      };

      // Save to both old and new format for compatibility
      localStorage.setItem("emailSenderForm", JSON.stringify(dataToSave));
      localStorage.setItem(
        "emailSenderCredentials",
        JSON.stringify({
          ...dataToSave,
          useStorageToggle: "localStorage",
        })
      );
    }
  }, [userEmail, senderEmail, appPassword, useStorageToggle]);

  const isReadyToSend = useMemo(() => {
    return subject.trim() !== "" && validateHTML(editorHtml);
  }, [subject, editorHtml]);

  const areCredentialsValid = useMemo(() => {
    return validateEmail(userEmail) && validateEmail(senderEmail) && appPassword.length > 0;
  }, [userEmail, senderEmail, appPassword]);

  const sendEmail = useCallback(async () => {
    if (loading) return;

    if (!isReadyToSend) {
      toast.warning("Subject and content are required.");
      return;
    }

    if (!areCredentialsValid) {
      toast.error("Email credentials are missing or invalid.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: editorHtml,
          subject,
          userEmail,
          senderEmail,
          appPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error ${response.status}`);
      }

      toast.success("Email sent successfully!");
    } catch (error) {
      let errorMessage = "Email send failed";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Cannot connect to server. Please ensure the server is running.";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    isReadyToSend,
    areCredentialsValid,
    editorHtml,
    subject,
    userEmail,
    senderEmail,
    appPassword,
  ]);

  const sendEmailDirect = useCallback(
    async (html: string, emailSubject: string) => {
      if (loading) return;

      if (!emailSubject.trim()) {
        toast.warning("Subject is required.");
        return;
      }

      if (!areCredentialsValid) {
        toast.error("Email credentials are missing or invalid.");
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html,
            subject: emailSubject,
            userEmail,
            senderEmail,
            appPassword,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error ${response.status}`);
        }

        toast.success("Email sent successfully!");
      } catch (error) {
        let errorMessage = "Email send failed";
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch")) {
            errorMessage = "Cannot connect to server. Please ensure the server is running.";
          } else {
            errorMessage = error.message;
          }
        }
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [loading, areCredentialsValid, userEmail, senderEmail, appPassword]
  );

  const contextValue: EmailSenderContextType = {
    editorHtml,
    setEditorHtml,
    subject,
    setSubject,
    loading,
    sendEmail,
    sendEmailDirect,
    userEmail,
    setUserEmail,
    senderEmail,
    setSenderEmail,
    appPassword,
    setAppPassword,
    isReadyToSend,
    areCredentialsValid,
    serverStatus,
    checkServerStatus,
    useStorageToggle,
    setUseStorageToggle,
  };

  return <EmailSenderContext.Provider value={contextValue}>{children}</EmailSenderContext.Provider>;
};
