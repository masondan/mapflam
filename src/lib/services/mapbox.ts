import type { NominatimResult } from '../types';

const MAPBOX_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
  text: string;
  properties: Record<string, unknown>;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

/**
 * Search for locations via MapBox Geocoding API
 * Used as fallback when Nominatim returns no results
 */
export async function searchMapbox(query: string): Promise<NominatimResult[]> {
  const apiKey = import.meta.env.VITE_MAPBOX_API_KEY;
  
  if (!apiKey) {
    console.warn('MapBox API key not configured');
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${MAPBOX_BASE}/${encodedQuery}.json?access_token=${apiKey}&limit=5&language=en`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MapBox API error: ${response.status}`);
    }

    const data: MapboxResponse = await response.json();

    // Convert MapBox response to NominatimResult format for compatibility
    return data.features.map((feature, index) => ({
      place_id: parseInt(feature.id.replace(/\D/g, '')) || index,
      licence: 'MapBox',
      osm_type: 'node' as const,
      osm_id: index,
      lat: String(feature.center[1]),
      lon: String(feature.center[0]),
      class: feature.place_type[0] || 'place',
      type: feature.place_type[0] || 'place',
      place_rank: 10,
      importance: 0.5,
      addresstype: feature.place_type[0] || 'place',
      name: feature.text,
      display_name: feature.place_name,
      boundingbox: ['0', '0', '0', '0'],
    }));
  } catch (error) {
    console.error('MapBox geocoding error:', error);
    return [];
  }
}
