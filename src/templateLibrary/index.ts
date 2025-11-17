/**
 * Template Library Public API
 */

// Main component
export { default as TemplateLibrary } from "./TemplateLibrary";

// Hooks
export { useTemplates } from "./hooks/useTemplates";

// Services
export { templateService, TemplateService } from "./services/templateService";

// Types
export type { EmailTemplate, TemplateCategory, TemplateMetadata } from "./types";

// Components (for direct import if needed)
export { default as DirectoryManagementModal } from "./DirectoryManagementModal";
export { default as PreviewSettings } from "./PreviewSettings";
export { default as TemplateItem } from "./TemplateItem";
