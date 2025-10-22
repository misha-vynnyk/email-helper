/**
 * Template Storage Configuration
 * Manages storage locations for templates with localStorage persistence
 *
 * Supports custom arbitrary paths for template synchronization
 */

export interface TemplateStorageLocation {
  id: string;
  name: string;
  path: string;
  description?: string;
  isDefault: boolean;
  isHidden?: boolean; // Hide location from template display
}

const STORAGE_KEY = "template-storage-locations";

/**
 * Get all storage locations from localStorage
 * @param includeHidden - If true, return all locations including hidden ones
 */
export function getTemplateStorageLocations(
  includeHidden: boolean = false
): TemplateStorageLocation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const locations: TemplateStorageLocation[] = JSON.parse(stored);

      // Ensure at least one default exists among visible locations
      const visibleLocations = includeHidden ? locations : locations.filter((loc) => !loc.isHidden);
      if (visibleLocations.length > 0 && !visibleLocations.some((loc) => loc.isDefault)) {
        visibleLocations[0].isDefault = true;
      }

      return includeHidden ? locations : visibleLocations;
    }
  } catch (error) {
    console.warn("Failed to load template storage locations:", error);
  }
  return [];
}

/**
 * Save storage locations to localStorage
 */
function saveLocations(locations: TemplateStorageLocation[]): TemplateStorageLocation[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error("Failed to save template storage locations:", error);
  }
  return locations;
}

/**
 * Add a new storage location
 */
export function addTemplateStorageLocation(
  name: string,
  path: string,
  description?: string
): TemplateStorageLocation[] {
  const locations = getTemplateStorageLocations();

  // Check for duplicate names
  if (locations.some((loc) => loc.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Location with this name already exists");
  }

  // Check for duplicate paths
  if (locations.some((loc) => loc.path === path)) {
    throw new Error("Location with this path already exists");
  }

  const newLocation: TemplateStorageLocation = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    path: path.trim(),
    description: description?.trim(),
    isDefault: locations.length === 0, // First location is default
  };

  locations.push(newLocation);
  return saveLocations(locations);
}

/**
 * Toggle visibility of a storage location
 */
export function toggleTemplateLocationVisibility(id: string): TemplateStorageLocation[] {
  const locations = getTemplateStorageLocations(true); // Include hidden

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
export function removeTemplateStorageLocation(id: string): TemplateStorageLocation[] {
  const locations = getTemplateStorageLocations(true); // Include hidden
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
export function setDefaultTemplateLocation(id: string): TemplateStorageLocation[] {
  const locations = getTemplateStorageLocations(true); // Include hidden

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
export function getDefaultTemplateLocation(): TemplateStorageLocation | null {
  const locations = getTemplateStorageLocations();
  return locations.find((loc) => loc.isDefault) || locations[0] || null;
}

/**
 * Get location by ID
 */
export function getTemplateLocationById(id: string): TemplateStorageLocation | null {
  const locations = getTemplateStorageLocations();
  return locations.find((loc) => loc.id === id) || null;
}

/**
 * Reset to empty (clear all locations)
 */
export function resetTemplateStorageDefaults(): TemplateStorageLocation[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset template storage locations:", error);
  }
  return [];
}
