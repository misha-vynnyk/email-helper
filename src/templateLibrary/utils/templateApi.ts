/**
 * Template Library API Client
 *
 * Frontend client for interacting with the Template Manager backend
 */

import { getApiBase, isApiAvailable } from "../../config/api";
import { AddTemplatePayload, AllowedRootPayload, EmailTemplate, ImportFolderPayload, TemplateStats, UpdateTemplatePayload } from "../../types/template";

const apiBase = () => `${getApiBase()}/api/templates`;

// Helper to handle connection errors
const handleConnectionError = (error: unknown): Error => {
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    return new Error("Server connection failed. Please ensure the server is running.");
  }
  return error instanceof Error ? error : new Error(String(error));
};

// Fails fast with a clear message on builds without a backend (e.g. GitHub Pages),
// instead of letting fetch() hit a relative /api/... URL and surface a raw
// "Failed to fetch" / JSON-parse error.
const ensureApiAvailable = (): void => {
  if (!isApiAvailable()) {
    throw new Error("Бібліотека шаблонів потребує backend.\n\nЗапустіть: npm run dev\nабо налаштуйте VITE_API_URL на існуючий backend.");
  }
};

/**
 * List all templates in the library
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  ensureApiAvailable();
  try {
    const response = await fetch(`${apiBase()}/list`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to list templates");
    }
    return response.json();
  } catch (error) {
    throw handleConnectionError(error);
  }
}

/**
 * Add a new template from a file path
 */
export async function addTemplate(payload: AddTemplatePayload): Promise<EmailTemplate> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add template");
  }
  return response.json();
}

/**
 * Get template HTML content
 */
export async function getTemplateContent(id: string): Promise<string> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/${id}/content`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get template content");
  }
  return response.text();
}

/**
 * Update template metadata
 */
export async function updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<EmailTemplate> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update template");
  }
  return response.json();
}

/**
 * Remove template from library (does not delete the file)
 */
export async function removeTemplate(id: string): Promise<void> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove template");
  }
}

/**
 * Import all HTML files from a folder
 */
export async function importFolder(payload: ImportFolderPayload): Promise<EmailTemplate[]> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/import-folder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to import folder");
  }
  return response.json();
}

/**
 * Sync template metadata with file system
 */
export async function syncTemplate(id: string): Promise<EmailTemplate> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/${id}/sync`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to sync template");
  }
  return response.json();
}

/**
 * Get library statistics
 */
export async function getStats(): Promise<TemplateStats> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/stats/summary`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get stats");
  }
  return response.json();
}

/**
 * Get allowed root directories
 */
export async function getAllowedRoots(): Promise<string[]> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/settings/allowed-roots`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get allowed roots");
  }
  return response.json();
}

/**
 * Add an allowed root directory
 */
export async function addAllowedRoot(payload: AllowedRootPayload): Promise<string[]> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/settings/allowed-roots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add allowed root");
  }
  // Backend now returns array directly
  return response.json();
}

/**
 * Remove an allowed root directory
 */
export async function removeAllowedRoot(payload: AllowedRootPayload): Promise<{ allowedRoots: string[]; removedTemplates: number; message: string }> {
  ensureApiAvailable();
  const response = await fetch(`${apiBase()}/settings/allowed-roots`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove allowed root");
  }
  return response.json();
}

/**
 * Sync all templates - scan all allowed roots and update database
 */
export async function syncAllTemplates(
  options: {
    recursive?: boolean;
    category?: string;
    paths?: string[]; // NEW: Specific paths to sync
  } = {}
): Promise<{
  success: boolean;
  templatesFound: number;
  templates: EmailTemplate[];
  removed: number;
  errors: Array<{ root: string; error: string }>;
  scannedRoots: number;
  message: string;
}> {
  ensureApiAvailable();
  try {
    const response = await fetch(`${apiBase()}/sync-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to sync templates");
    }
    return response.json();
  } catch (error) {
    throw handleConnectionError(error);
  }
}
