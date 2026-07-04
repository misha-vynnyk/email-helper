// EmailSender - Main exports
export { EmailValidationPanel } from "../emailValidator";
export { EmailHTMLValidator as EmailValidator } from "../emailValidator";
export { default as EmailCredentialsForm } from "./EmailCredentialsForm";
export { default as EmailHtmlEditor } from "./EmailHtmlEditor";
export { EmailSenderProvider, useEmailSender } from "./EmailSenderContext";
export { StorageToggle } from "./StorageToggle";

// Types
export type {
  ValidationResult as EmailValidationIssue,
  EmailValidationReport,
  ValidationRule as EmailValidationRule,
} from "../emailValidator";
