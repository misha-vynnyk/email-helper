/**
 * Template Library Public API
 */

// Main component
export { default as TemplateLibrary } from "./TemplateLibrary";

// Types (from main types)
export type { EmailTemplate, TemplateCategory } from "../types/template";

// Components (for direct import if needed)
export { default as DirectoryManagementModal } from "./DirectoryManagementModal";
export { default as PreviewSettings } from "./PreviewSettings";
export { default as TemplateItem } from "./TemplateItem";
