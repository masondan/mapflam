// Type definitions for MapFlam

export type IconType = 'pin1' | 'pin2' | 'pin3' | 'pin4' | 'pin5' | 'pin6';
export type PinSize = 1 | 2 | 3 | 4 | 5; // 1=small, 5=large, 3=default
export type LabelSize = 'small' | 'medium' | 'large';
export type MapFormat = 'square' | '16:9' | '9:16';
export type BaseMap = 'positron' | 'positron-nolabels' | 'toner';

// Inset map types (Phase 2)
export type InsetPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type InsetSize = 'small' | 'medium' | 'large';
export type InsetBaseMap = 'positron-nolabels' | 'watercolor' | 'voyager';

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
    attribution:
      '© OpenStreetMap contributors, © CartoDB',
  },
  'positron-nolabels': {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '© OpenStreetMap contributors, © CartoDB',
  },
  toner: {
    url: 'https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
    attribution:
      '© OpenStreetMap contributors, © Stamen Design',
  },
};

// Inset map tile providers (simpler styles)
export const INSET_MAP_TILES: Record<InsetBaseMap, { url: string; attribution: string; name: string }> = {
  'positron-nolabels': {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    name: 'Light',
  },
  watercolor: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    attribution: '© OpenStreetMap contributors, © Stamen Design',
    name: 'Watercolor',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    name: 'Voyager',
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
