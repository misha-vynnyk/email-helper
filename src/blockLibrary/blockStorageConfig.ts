/**
 * Block Storage Configuration
 * Manages storage locations for blocks with localStorage persistence
 *
 * Supports both legacy hardcoded paths ('src', 'data') and custom arbitrary paths
 */

export interface StorageLocation {
  id: string;
  name: string;
  path: string;
  description?: string;
  isDefault: boolean;
  isHidden?: boolean; // Hide location from block display
}

const STORAGE_KEY = "block-storage-locations";

/**
 * Get all storage locations from localStorage
 * @param includeHidden - If true, return all locations including hidden ones
 */
export function getStorageLocations(includeHidden: boolean = false): StorageLocation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const locations: StorageLocation[] = JSON.parse(stored);

      // Ensure at least one default exists among visible locations
      const visibleLocations = includeHidden ? locations : locations.filter((loc) => !loc.isHidden);
      if (visibleLocations.length > 0 && !visibleLocations.some((loc) => loc.isDefault)) {
        visibleLocations[0].isDefault = true;
      }

      return includeHidden ? locations : visibleLocations;
    }
  } catch (error) {
    console.warn("Failed to load storage locations:", error);
  }
  return [];
}

/**
 * Save storage locations to localStorage
 */
function saveLocations(locations: StorageLocation[]): StorageLocation[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error("Failed to save storage locations:", error);
  }
  return locations;
}

/**
 * Add a new storage location
 */
export function addStorageLocation(
  name: string,
  path: string,
  description?: string
): StorageLocation[] {
  const locations = getStorageLocations();

  // Check for duplicate names
  if (locations.some((loc) => loc.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Location with this name already exists");
  }

  // Check for duplicate paths
  if (locations.some((loc) => loc.path === path)) {
    throw new Error("Location with this path already exists");
  }

  const newLocation: StorageLocation = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    path: path.trim(),
    description: description?.trim(),
    isDefault: locations.length === 0, // First location is default
    isLegacy: false,
  };

  locations.push(newLocation);
  return saveLocations(locations);
}

/**
 * Toggle visibility of a storage location
 */
export function toggleLocationVisibility(id: string): StorageLocation[] {
  const locations = getStorageLocations(true); // Include hidden

  const location = locations.find((loc) => loc.id === id);
  if (!location) {
    throw new Error("Location not found");
  }

  // Toggle hidden state
  location.isHidden = !location.isHidden;

  // If hiding the default location, set another visible location as default
  if (location.isHidden && location.isDefault) {
    const firstVisible = locations.find((loc) => loc.id !== id && !loc.isHidden);
    if (firstVisible) {
      firstVisible.isDefault = true;
      location.isDefault = false;
    } else {
      throw new Error("Cannot hide all storage locations");
    }
  }

  return saveLocations(locations);
}

/**
 * Remove a storage location
 */
export function removeStorageLocation(id: string): StorageLocation[] {
  const locations = getStorageLocations(true); // Include hidden
  const filtered = locations.filter((loc) => loc.id !== id);

  // If we removed the default, make the first visible location default
  const visibleLocations = filtered.filter((loc) => !loc.isHidden);
  if (visibleLocations.length > 0 && !visibleLocations.some((loc) => loc.isDefault)) {
    visibleLocations[0].isDefault = true;
  }

  return saveLocations(filtered);
}

/**
 * Set a location as default
 */
export function setDefaultLocation(id: string): StorageLocation[] {
  const locations = getStorageLocations(true); // Include hidden

  // Don't allow setting hidden location as default
  const location = locations.find((loc) => loc.id === id);
  if (location?.isHidden) {
    throw new Error("Cannot set hidden location as default");
  }

  const updated = locations.map((loc) => ({
    ...loc,
    isDefault: loc.id === id,
  }));
  return saveLocations(updated);
}

/**
 * Get the default storage location (or null if none configured)
 */
export function getDefaultLocation(): StorageLocation | null {
  const locations = getStorageLocations();
  return locations.find((loc) => loc.isDefault) || locations[0] || null;
}

/**
 * Get location by ID
 */
export function getLocationById(id: string): StorageLocation | null {
  const locations = getStorageLocations();
  return locations.find((loc) => loc.id === id) || null;
}

/**
 * Reset to empty (clear all locations)
 */
export function resetToDefaults(): StorageLocation[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset storage locations:", error);
  }
  return [];
}
