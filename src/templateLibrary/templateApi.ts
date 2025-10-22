/**
 * Template Library API Client
 *
 * Frontend client for interacting with the Template Manager backend
 */

import API_URL from "../config/api";
import {
  AddTemplatePayload,
  AllowedRootPayload,
  EmailTemplate,
  ImportFolderPayload,
  TemplateStats,
  UpdateTemplatePayload,
} from "../types/template";

const API_BASE = `${API_URL}/api/templates`;

/**
 * List all templates in the library
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch(`${API_BASE}/list`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to list templates");
  }
  return response.json();
}

/**
 * Add a new template from a file path
 */
export async function addTemplate(payload: AddTemplatePayload): Promise<EmailTemplate> {
  const response = await fetch(`${API_BASE}/add`, {
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
  const response = await fetch(`${API_BASE}/${id}/content`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get template content");
  }
  return response.text();
}

/**
 * Update template metadata
 */
export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload
): Promise<EmailTemplate> {
  const response = await fetch(`${API_BASE}/${id}`, {
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
  const response = await fetch(`${API_BASE}/${id}`, {
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
  const response = await fetch(`${API_BASE}/import-folder`, {
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
  const response = await fetch(`${API_BASE}/${id}/sync`, {
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
  const response = await fetch(`${API_BASE}/stats/summary`);
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
  const response = await fetch(`${API_BASE}/settings/allowed-roots`);
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
  const response = await fetch(`${API_BASE}/settings/allowed-roots`, {
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
export async function removeAllowedRoot(
  payload: AllowedRootPayload
): Promise<{ allowedRoots: string[]; removedTemplates: number; message: string }> {
  const response = await fetch(`${API_BASE}/settings/allowed-roots`, {
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
  const response = await fetch(`${API_BASE}/sync-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to sync templates");
  }
  return response.json();
}
