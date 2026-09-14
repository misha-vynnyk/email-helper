import { createContext, useContext } from "react";

export interface EmailSenderContextType {
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
