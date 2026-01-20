/**
 * Generic Storage Configuration Manager
 * Provides reusable logic for managing storage locations with localStorage persistence
 */

import { logger } from "./logger";

export interface StorageLocation {
  id: string;
  name: string;
  path: string;
  description?: string;
  isDefault: boolean;
  isHidden?: boolean;
}

export class StorageConfigManager<T extends StorageLocation> {
  constructor(
    private readonly storageKey: string,
    private readonly contextName: string
  ) {}

  /**
   * Get all storage locations from localStorage
   */
  getLocations(includeHidden: boolean = false): T[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const locations: T[] = JSON.parse(stored);

        // Ensure at least one default exists among visible locations
        const visibleLocations = includeHidden
          ? locations
          : locations.filter((loc) => !loc.isHidden);
        if (visibleLocations.length > 0 && !visibleLocations.some((loc) => loc.isDefault)) {
          visibleLocations[0].isDefault = true;
        }

        return includeHidden ? locations : visibleLocations;
      }
    } catch (error) {
      logger.warn(this.contextName, "Failed to load storage locations", error);
    }
    return [];
  }

  /**
   * Save storage locations to localStorage
   */
  private saveLocations(locations: T[]): T[] {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(locations));
    } catch (error) {
      logger.error(this.contextName, "Failed to save storage locations", error);
    }
    return locations;
  }

  /**
   * Add a new storage location
   */
  addLocation(name: string, path: string, description?: string, additionalProps?: Partial<T>): T[] {
    const locations = this.getLocations();

    // Check for duplicate names
    if (locations.some((loc) => loc.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Location with this name already exists");
    }

    // Check for duplicate paths
    if (locations.some((loc) => loc.path === path)) {
      throw new Error("Location with this path already exists");
    }

    const newLocation: T = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      path: path.trim(),
      description: description?.trim(),
      isDefault: locations.length === 0, // First location is default
      ...additionalProps,
    } as T;

    locations.push(newLocation);
    return this.saveLocations(locations);
  }

  /**
   * Toggle visibility of a storage location
   */
  toggleLocationVisibility(id: string): T[] {
    const locations = this.getLocations(true); // Include hidden

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

    return this.saveLocations(locations);
  }

  /**
   * Remove a storage location
   */
  removeLocation(id: string): T[] {
    const locations = this.getLocations(true); // Include hidden
    const filtered = locations.filter((loc) => loc.id !== id);

    // If we removed the default, make the first visible location default
    const visibleLocations = filtered.filter((loc) => !loc.isHidden);
    if (visibleLocations.length > 0 && !visibleLocations.some((loc) => loc.isDefault)) {
      visibleLocations[0].isDefault = true;
    }

    return this.saveLocations(filtered);
  }

  /**
   * Set a location as default
   */
  setDefaultLocation(id: string): T[] {
    const locations = this.getLocations(true); // Include hidden

    // Don't allow setting hidden location as default
    const location = locations.find((loc) => loc.id === id);
    if (location?.isHidden) {
      throw new Error("Cannot set hidden location as default");
    }

    const updated = locations.map((loc) => ({
      ...loc,
      isDefault: loc.id === id,
    }));
    return this.saveLocations(updated);
  }

  /**
   * Get the default storage location (or null if none configured)
   */
  getDefaultLocation(): T | null {
    const locations = this.getLocations();
    return locations.find((loc) => loc.isDefault) || locations[0] || null;
  }

  /**
   * Get location by ID
   */
  getLocationById(id: string): T | null {
    const locations = this.getLocations();
    return locations.find((loc) => loc.id === id) || null;
  }

  /**
   * Reset to empty (clear all locations)
   */
  resetToDefaults(): T[] {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      logger.error(this.contextName, "Failed to reset storage locations", error);
    }
    return [];
  }
}
