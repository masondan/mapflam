// Type definitions for MapFlam

export type IconType = 'pin1' | 'pin2' | 'pin3' | 'pin4' | 'pin5' | 'pin6';
export type PinSize = 1 | 2 | 3 | 4 | 5; // 1=small, 5=large, 3=default
export type LabelSize = 'small' | 'medium' | 'large';
export type MapFormat = 'square' | '16:9' | '9:16';
export type BaseMap = 'positron' | 'voyager' | 'osm-standard' | 'positron-nolabels' | 'esri-satellite' | 'opentopomap';

// Inset map types (Phase 2)
export type InsetPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type InsetSize = 'small' | 'medium' | 'large';
export type InsetBaseMap = 'positron' | 'voyager' | 'osm-standard';

export interface InsetConfig {
  enabled: boolean;
  position: InsetPosition;
  size: InsetSize;
  borderColor: string;
  baseMap: InsetBaseMap;
  center: { lat: number; lng: number };
  zoom: number;
  spotlight: {
    enabled: boolean;
    lat: number;
    lng: number;
    color: string;
    size: 1 | 2 | 3 | 4 | 5;
    opacity: number; // 0-100
  };
}

export interface Label {
  text: string;
  size: LabelSize;
  bgColor: string; // hex, from 6-color palette
  bgOpacity: number; // 0-100
  offsetX: number; // px for nudge buttons
  offsetY: number; // px for nudge buttons
}

export interface Marker {
  id: string; // UUID
  lat: number;
  lng: number;
  icon: IconType;
  size: PinSize; // sticky: default 3
  opacity: number; // 0-100
  color: string; // hex from palette
  name: string; // "Pin 1", "Pin 2", etc.
  label?: Label;
}

export interface SavedMap {
  id: string; // UUID, generated at creation
  name: string; // "Map 1", user-editable
  createdAt: number; // timestamp ms
  pinCount: number; // for display in SavedTab
  state: {
    markers: Marker[];
    selectedFormat: MapFormat;
    selectedBaseMap: BaseMap;
    mapCenter: { lat: number; lng: number };
    mapZoom: number;
  };
  thumbnail: string; // base64 64×64 PNG
}

export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}

export interface MapState {
  leafletMap: L.Map | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  markers: Marker[];
  selectedFormat: MapFormat;
  selectedBaseMap: BaseMap;
  activeTab: 'create' | 'saved';
  editingPinId: string | null;
}

// 6-color fixed palette
export const COLOR_PALETTE = [
  '#5422b0', // purple (default)
  '#02441F', // dark green
  '#004269', // dark blue
  '#AB0000', // red
  '#000000', // black
  '#FFFFFF', // white
];

// Icon metadata: maps icon type to SVG filename (with extension)
export const ICON_FILES: Record<IconType, string> = {
  pin1: 'icon-pin1-fill.svg',
  pin2: 'icon-pin1.svg',
  pin3: 'icon-pin2-fill.svg',
  pin4: 'icon-pin2.svg',
  pin5: 'icon-pin3-fill.svg',
  pin6: 'icon-pin3.svg',
};

// Inline SVG paths for html2canvas export compatibility (mask-image not supported)
export const ICON_SVG_PATHS: Record<IconType, string> = {
  pin1: 'M18.364 17.364L12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364ZM12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15ZM12 13C10.8954 13 10 12.1046 10 11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11C14 12.1046 13.1046 13 12 13Z',
  pin2: 'M12 20.8995L16.9497 15.9497C19.6834 13.2161 19.6834 8.78392 16.9497 6.05025C14.2161 3.31658 9.78392 3.31658 7.05025 6.05025C4.31658 8.78392 4.31658 13.2161 7.05025 15.9497L12 20.8995ZM12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364L12 23.7279ZM12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13ZM12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15Z',
  pin3: 'M11 19.9451C6.50005 19.4476 3 15.6326 3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11C21 15.6326 17.5 19.4476 13 19.9451V24H11V19.9451Z',
  pin4: 'M11 19.9451C6.50005 19.4476 3 15.6326 3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11C21 15.6326 17.5 19.4476 13 19.9451V24H11V19.9451ZM12 18C15.866 18 19 14.866 19 11C19 7.13401 15.866 4 12 4C8.13401 4 5 7.13401 5 11C5 14.866 8.13401 18 12 18Z',
  pin5: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z',
  pin6: 'M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z',
};

// Size map: PinSize to CSS scale factor
export const SIZE_MAP: Record<PinSize, number> = {
  1: 1.2, // 24px
  2: 1.5, // 36px
  3: 2.0, // 48px default (doubled from 24px)
  4: 2.5, // 60px
  5: 3.0, // 72px
};

// Label sizes
export const LABEL_SIZES: Record<LabelSize, string> = {
  small: '12px',
  medium: '16px',
  large: '18px',
};

// Base map tile providers
export const BASE_MAP_TILES: Record<BaseMap, { url: string; attribution: string }> = {
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
  },
  'osm-standard': {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  'positron-nolabels': {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
  },
  'esri-satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, DigitalGlobe, Earthstar Geographics',
  },
  'opentopomap': {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © OpenTopoMap',
  },
};

// Inset map tile providers (simpler styles)
export const INSET_MAP_TILES: Record<InsetBaseMap, { url: string; attribution: string; name: string }> = {
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    name: 'Positron',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    name: 'Voyager',
  },
  'osm-standard': {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    name: 'OSM Standard',
  },
};

// Inset size dimensions (px)
export const INSET_SIZE_MAP: Record<InsetSize, number> = {
  small: 100,
  medium: 140,
  large: 180,
};

// Export sizes by format
export const EXPORT_SIZES: Record<MapFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};
