import { writable, derived } from 'svelte/store';
import type L from 'leaflet';
import type { Marker, MapFormat, BaseMap, SavedMap, NominatimResult, InsetConfig } from './types';

// Map instance & view
export const leafletMap = writable<L.Map | null>(null);
export const mapCenter = writable({ lat: 6.5244, lng: 3.3792 }); // Lagos default
export const mapZoom = writable(12);

// Marker state
export const markers = writable<Marker[]>([]);

// UI state
export const selectedFormat = writable<MapFormat>('square');
export const selectedBaseMap = writable<BaseMap>('positron');
export const activeTab = writable<'create' | 'saved'>('create');
export const editingPinId = writable<string | null>(null);

// Inset map state (Phase 2)
export const insetConfig = writable<InsetConfig>({
  enabled: false,
  position: 'top-right',
  size: 'medium',
  borderColor: '#5422b0',
  baseMap: 'positron',
  center: { lat: 6.5244, lng: 3.3792 },
  zoom: 5,
  spotlight: {
    enabled: false,
    lat: 6.5244,
    lng: 3.3792,
    color: '#5422b0',
    size: 3,
    opacity: 100,
  },
});

// Inset map Leaflet instance
export const insetLeafletMap = writable<L.Map | null>(null);

// Search state (debounced)
export const searchQuery = writable('');
export const searchResults = writable<NominatimResult[]>([]);
export const isSearching = writable(false);

// Saved maps state
export const savedMaps = writable<SavedMap[]>([]);

// Derived: pin count for export button visibility
export const pinCount = derived(markers, ($markers) => $markers.length);

// Derived: map URL preview (useful for testing)
export const currentMapState = derived(
  [mapCenter, mapZoom, markers, selectedFormat, selectedBaseMap],
  ([$center, $zoom, $markers, $format, $baseMap]) => ({
    center: $center,
    zoom: $zoom,
    markerCount: $markers.length,
    format: $format,
    baseMap: $baseMap,
  })
);
