import type { NominatimResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const CACHE = new Map<string, { results: NominatimResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search for locations via Nominatim API
 * Results are cached in sessionStorage for 5 minutes
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

    const results: NominatimResult[] = await response.json();

    // Cache results
    CACHE.set(query, { results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('Geocoding error:', error);
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
