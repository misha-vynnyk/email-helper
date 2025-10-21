// EmailSender - Main exports
export { default as EmailHtmlEditor } from "./EmailHtmlEditor";
export { EmailValidationPanel } from "../emailValidator";
export { EmailHTMLValidator as EmailValidator } from "../emailValidator";
export { EmailSenderProvider, useEmailSender } from "./EmailSenderContext";
export { default as EmailCredentialsForm } from "./EmailCredentialsForm";
export { StorageToggle } from "./StorageToggle";

// Types
export type {
  ValidationResult as EmailValidationIssue,
  EmailValidationReport,
  ValidationRule as EmailValidationRule,
} from "../emailValidator";
