import type { NominatimResult } from '../types';
import { searchMapbox } from './mapbox';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const CACHE = new Map<string, { results: NominatimResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search for locations via Nominatim API with MapBox fallback
 * - Primary: Nominatim (free, open-source)
 * - Fallback: MapBox (when Nominatim returns zero results)
 * Results are cached for 5 minutes
 * Rate-limited by caller (debounce to 300ms)
 */
export async function searchLocations(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];

  // Check cache
  const cached = CACHE.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  try {
    // Try Nominatim first
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    let results: NominatimResult[] = await response.json();

    // Fallback to MapBox if Nominatim returns no results
    if (results.length === 0) {
      console.log('Nominatim returned no results, trying MapBox fallback...');
      results = await searchMapbox(query);
    }

    // Cache results (from either source)
    CACHE.set(query, { results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // On Nominatim failure, try MapBox as backup
    try {
      const fallbackResults = await searchMapbox(query);
      if (fallbackResults.length > 0) {
        CACHE.set(query, { results: fallbackResults, timestamp: Date.now() });
        return fallbackResults;
      }
    } catch (fallbackError) {
      console.error('MapBox fallback also failed:', fallbackError);
    }
    
    return [];
  }
}

/**
 * Detect if query is GPS coordinates (e.g., "40.7128,-74.0060")
 */
export function parseGpsCoordinates(query: string): { lat: number; lng: number } | null {
  const match = query.trim().match(/^([-+]?\d+\.?\d*)\s*,\s*([-+]?\d+\.?\d*)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

/**
 * Clear search cache (useful for testing or manual refresh)
 */
export function clearSearchCache(): void {
  CACHE.clear();
}
