/**
 * Block Storage Configuration
 * Manages storage locations for blocks with localStorage persistence
 *
 * Supports both legacy hardcoded paths ('src', 'data') and custom arbitrary paths
 */

import { StorageConfigManager, StorageLocation } from "../utils/storageConfigManager";
import { STORAGE_KEYS } from "../utils/storageKeys";

export type { StorageLocation };

// Create singleton instance for block storage
const blockStorageManager = new StorageConfigManager<StorageLocation>(
  STORAGE_KEYS.BLOCK_STORAGE_LOCATIONS,
  "BlockStorage"
);

/**
 * Get all storage locations from localStorage
 * @param includeHidden - If true, return all locations including hidden ones
 */
export function getStorageLocations(includeHidden: boolean = false): StorageLocation[] {
  return blockStorageManager.getLocations(includeHidden);
}

/**
 * Add a new storage location
 */
export function addStorageLocation(
  name: string,
  path: string,
  description?: string
): StorageLocation[] {
  return blockStorageManager.addLocation(name, path, description);
}

/**
 * Toggle visibility of a storage location
 */
export function toggleLocationVisibility(id: string): StorageLocation[] {
  return blockStorageManager.toggleLocationVisibility(id);
}

/**
 * Remove a storage location
 */
export function removeStorageLocation(id: string): StorageLocation[] {
  return blockStorageManager.removeLocation(id);
}

/**
 * Set a location as default
 */
export function setDefaultLocation(id: string): StorageLocation[] {
  return blockStorageManager.setDefaultLocation(id);
}

/**
 * Get the default storage location (or null if none configured)
 */
export function getDefaultLocation(): StorageLocation | null {
  return blockStorageManager.getDefaultLocation();
}

/**
 * Get location by ID
 */
export function getLocationById(id: string): StorageLocation | null {
  return blockStorageManager.getLocationById(id);
}

/**
 * Reset to empty (clear all locations)
 */
export function resetToDefaults(): StorageLocation[] {
  return blockStorageManager.resetToDefaults();
}
