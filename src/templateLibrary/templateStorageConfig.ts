/**
 * Template Storage Configuration
 * Manages storage locations for templates with localStorage persistence
 *
 * Supports custom arbitrary paths for template synchronization
 */

import { StorageConfigManager, StorageLocation } from "../utils/storageConfigManager";
import { STORAGE_KEYS } from "../utils/storageKeys";

export interface TemplateStorageLocation extends StorageLocation {}

// Create singleton instance for template storage
const templateStorageManager = new StorageConfigManager<TemplateStorageLocation>(
  STORAGE_KEYS.TEMPLATE_STORAGE_LOCATIONS,
  "TemplateStorage"
);

/**
 * Get all storage locations from localStorage
 * @param includeHidden - If true, return all locations including hidden ones
 */
export function getTemplateStorageLocations(
  includeHidden: boolean = false
): TemplateStorageLocation[] {
  return templateStorageManager.getLocations(includeHidden);
}

/**
 * Add a new storage location
 */
export function addTemplateStorageLocation(
  name: string,
  path: string,
  description?: string
): TemplateStorageLocation[] {
  return templateStorageManager.addLocation(name, path, description);
}

/**
 * Toggle visibility of a storage location
 */
export function toggleTemplateLocationVisibility(id: string): TemplateStorageLocation[] {
  return templateStorageManager.toggleLocationVisibility(id);
}

/**
 * Remove a storage location
 */
export function removeTemplateStorageLocation(id: string): TemplateStorageLocation[] {
  return templateStorageManager.removeLocation(id);
}

/**
 * Set a location as default
 */
export function setDefaultTemplateLocation(id: string): TemplateStorageLocation[] {
  return templateStorageManager.setDefaultLocation(id);
}

/**
 * Get the default storage location (or null if none configured)
 */
export function getDefaultTemplateLocation(): TemplateStorageLocation | null {
  return templateStorageManager.getDefaultLocation();
}

/**
 * Get location by ID
 */
export function getTemplateLocationById(id: string): TemplateStorageLocation | null {
  return templateStorageManager.getLocationById(id);
}

/**
 * Reset to empty (clear all locations)
 */
export function resetTemplateStorageDefaults(): TemplateStorageLocation[] {
  return templateStorageManager.resetToDefaults();
}
