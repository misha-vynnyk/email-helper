/**
 * Template Library Public API
 */

// Main component
export { default as TemplateLibrary } from "./TemplateLibrary";

// Types (from main types)
export type { EmailTemplate, TemplateCategory } from "../types/template";

// Components (for direct import if needed)
export { default as DirectoryManagementModal } from "./components/DirectoryManagementModal";
export { default as PreviewSettings } from "./components/PreviewSettings";
export { default as TemplateItem } from "./components/TemplateItem";
