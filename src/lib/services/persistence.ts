import type { SavedMap, Marker, MapFormat, BaseMap } from '../types';
import { savedMaps } from '../stores';

const STORAGE_KEY = 'mapflam_saved';
const EXPIRY_DAYS = 30;
const MAX_MAPS = 5;

/**
 * Save a map to localStorage
 * Keeps only 5 most recent maps; older ones are evicted
 */
export function saveMap(map: SavedMap): void {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedMap[];

    // Remove if already exists (to re-add as most recent)
    const filtered = existing.filter((m) => m.id !== map.id);

    // Add new map at front, slice to MAX_MAPS
    const updated = [map, ...filtered].slice(0, MAX_MAPS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    savedMaps.set(updated);
  } catch (error) {
    console.error('Failed to save map:', error);
  }
}

/**
 * Load all saved maps from localStorage
 * Filters out maps older than 30 days
 * Returns sorted by creation date (newest first)
 */
export function loadSavedMaps(): SavedMap[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedMap[];
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const valid = saved.filter((m) => now - m.createdAt < expiryMs);

    // Update store if any were filtered out
    if (valid.length < saved.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to load saved maps:', error);
    return [];
  }
}

/**
 * Delete a saved map by ID
 */
export function deleteMap(id: string): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedMap[];
    const updated = saved.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    savedMaps.set(updated);
  } catch (error) {
    console.error('Failed to delete map:', error);
  }
}

/**
 * Update map metadata (name only, for now)
 */
export function updateMapName(id: string, newName: string): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedMap[];
    const map = saved.find((m) => m.id === id);
    if (map) {
      map.name = newName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      savedMaps.set(saved);
    }
  } catch (error) {
    console.error('Failed to update map name:', error);
  }
}

/**
 * Initialize auto-save: debounce state changes and save to localStorage
 * Called from root component on mount
 */
export function initAutoSave(
  markers: Marker[],
  selectedFormat: MapFormat,
  selectedBaseMap: BaseMap,
  mapCenter: { lat: number; lng: number },
  mapZoom: number,
  currentMapId: string | null
): void {
  // Auto-save is handled by debounced store subscriptions in root component
  // This function is reserved for future enhancements (e.g., external sync)
}

/**
 * Clear all saved maps (debug/testing)
 */
export function clearAllMaps(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    savedMaps.set([]);
  } catch (error) {
    console.error('Failed to clear all maps:', error);
  }
}

/**
 * Get storage usage info (for debugging)
 */
export function getStorageInfo(): { usedBytes: number; maxBytes: number; mapCount: number } {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || '[]';
    const usedBytes = new Blob([data]).size;
    const maps = JSON.parse(data) as SavedMap[];

    return {
      usedBytes,
      maxBytes: 5 * 1024 * 1024, // Approximate 5MB limit
      mapCount: maps.length,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { usedBytes: 0, maxBytes: 5 * 1024 * 1024, mapCount: 0 };
  }
}
