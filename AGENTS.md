# MapFlam – Development Guide for AI Agents

**Purpose:** Technical reference for AI agents refining and maintaining MapFlam.  
**Updated:** January 2026

---

## Project Overview

**MapFlam** is a mobile-first web app for journalists and content creators to build and export locator maps. No authentication required. Educational use only.

**Core features:**
- Search locations (Nominatim), place/customize markers, export as PNG
- Multi-pin support with icon, size, opacity, color, label customization
- Inset maps for context (Phase 2)
- Auto-save to localStorage (5 maps, 30-day expiry)
- Maps persist in "Saved" tab for re-editing

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | **Vite + Svelte 5** (TypeScript) | Reactive, typed, fast HMR |
| Styling | **Native CSS variables** | No Tailwind; see color tokens below |
| Maps | **Leaflet 1.9** | Multiple free tile providers (CartoDB, OSM, ESRI, OpenTopoMap) |
| Geocoding | **Nominatim API** (primary) | Free, open-source; rate-limit ~1 req/sec |
| Geocoding Fallback | **MapBox Geocoding** | Optional fallback when Nominatim empty; requires `VITE_MAPBOX_API_KEY` |
| Export | **html2canvas** | DOM → PNG at format-dependent sizes |
| State | **Svelte stores** | Global reactivity for markers, map state, UI |
| Persistence | **localStorage** | JSON serialization; 5 maps max, 30-day expiry; working state recovery |
| Hosting | **Cloudflare Pages** | Root URL: mapflam.pages.dev |

---

## Project Structure

```
src/
├── app.svelte                    # Root component (Create/Saved tabs, auto-save logic)
├── app.css                       # Global styles, CSS variables
├── main.ts                       # Vite entry point
├── vite-env.d.ts                 # Vite environment type definitions
└── lib/
    ├── stores.ts                 # Reactive state (markers, map, UI, inset, search)
    ├── types.ts                  # TypeScript interfaces, color palette, icon data
    ├── services/
    │   ├── nominatim.ts          # Location search (Nominatim + MapBox fallback, cached, GPS parse)
    │   ├── mapbox.ts             # MapBox Geocoding fallback (VITE_MAPBOX_API_KEY)
    │   ├── export.ts             # PNG export via html2canvas, thumbnail generation
    │   └── persistence.ts        # localStorage (save/load/delete/expiry, working state recovery)
    └── components/
        ├── MapContainer.svelte   # Leaflet map instance, marker rendering
        ├── RatioSelector.svelte  # 9:16, 1:1, 16:9 buttons
        ├── BaseMapSelector.svelte # Basemap dropdown (6 options)
        ├── PinEditor.svelte      # Pin card (search, icons, sliders, labels)
        ├── SearchBar.svelte      # Location search UI with debounce
        ├── SavedTab.svelte       # Saved maps list with thumbnails
        ├── TwoFingerOverlay.svelte # Mobile gesture hint overlay
        └── InsetMapEditor.svelte # Inset map controls (Phase 2)

static/
├── icons/                        # SVGs + PNGs (logos, marker icons, UI icons)
├── manifest.json                 # PWA manifest
└── robots.txt                    # Disallow: / (no indexing)
```

---

## Running the App

```bash
npm install              # Install deps
npm run dev              # Local dev (http://localhost:5173, hot reload)
npm run check            # TypeScript + Svelte checks
npm run build            # Production build → dist/
npm run preview          # Preview dist locally
```

---

## Reactive State (Svelte Stores)

Core stores in `src/lib/stores.ts`:

```typescript
// Map instance & view
export const leafletMap = writable<L.Map | null>(null);
export const mapCenter = writable({ lat: 6.5244, lng: 3.3792 });  // Lagos default
export const mapZoom = writable(12);

// Markers
export const markers = writable<Marker[]>([]);

// UI
export const selectedFormat = writable<MapFormat>('square');      // 'square' | '16:9' | '9:16'
export const selectedBaseMap = writable<BaseMap>('voyager');      // 6 options (see below)
export const activeTab = writable<'create' | 'saved'>('create');  // 'create' | 'saved'
export const editingPinId = writable<string | null>(null);        // Expanded pin card

// Search state (debounced, cached)
export const searchQuery = writable('');
export const searchResults = writable<NominatimResult[]>([]);
export const isSearching = writable(false);

// Saved maps state
export const savedMaps = writable<SavedMap[]>([]);

// Inset (Phase 2)
export const insetConfig = writable<InsetConfig>({ /* ... */ });
export const insetLeafletMap = writable<L.Map | null>(null);

// Derived stores
export const pinCount = derived(markers, ($markers) => $markers.length);
export const currentMapState = derived(
  [mapCenter, mapZoom, markers, selectedFormat, selectedBaseMap],
  ([$center, $zoom, $markers, $format, $baseMap]) => ({ /* ... */ })
);
```

Subscribe in components with `$store` syntax (reactive).

---

## Key Patterns

### 1. Marker Data Structure

```typescript
interface Marker {
  id: string;              // UUID
  lat: number; lng: number;
  icon: 'pin1' | 'pin2' | 'pin3' | 'pin4' | 'pin5' | 'pin6';
  size: 1 | 2 | 3 | 4 | 5;  // 1=small, 5=large, 3=default
  opacity: number;         // 0–100
  color: string;           // Hex from 6-color palette
  name: string;            // "Pin 1", user-editable
  label?: {
    text: string;
    size: 'small' | 'medium' | 'large';
    bgColor: string;
    bgOpacity: number;
    offsetX: number; offsetY: number;  // Nudge buttons
  };
}
```

### 2. Nominatim Search with MapBox Fallback

```typescript
// src/lib/services/nominatim.ts
export async function searchLocations(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];

  // Check 5-minute cache first
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

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    
    let results: NominatimResult[] = await response.json();

    // Fallback to MapBox if Nominatim returns empty
    if (results.length === 0) {
      results = await searchMapbox(query);  // Requires VITE_MAPBOX_API_KEY
    }

    // Cache results
    CACHE.set(query, { results, timestamp: Date.now() });
    return results;
  } catch (error) {
    // On error, try MapBox fallback
    return await searchMapbox(query);
  }
}

// GPS coordinate detection (e.g., "40.7128,-74.0060")
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
```

**Features:**
- **Primary:** Nominatim (free, open-source; ~1 req/sec rate limit)
- **Fallback:** MapBox Geocoding (when Nominatim empty; requires `VITE_MAPBOX_API_KEY` env var)
- **Cache:** 5-minute TTL per query
- **GPS:** Auto-detect coordinates from input (e.g., "40.7128,-74.0060")
- **Debounce:** 300ms input debounce (in SearchBar component)

### 3. Export (html2canvas) & Thumbnails

```typescript
// src/lib/services/export.ts
export async function exportMap(
  containerSelector: string,
  format: MapFormat,
  filename?: string
): Promise<void> {
  const container = document.querySelector(containerSelector) as HTMLElement;
  if (!container) throw new Error(`Container not found: ${containerSelector}`);

  const size = EXPORT_SIZES[format];
  const containerRect = container.getBoundingClientRect();

  // Calculate scale factor
  const scaleX = size.width / containerRect.width;
  const scaleY = size.height / containerRect.height;
  const scale = Math.max(scaleX, scaleY);

  // Wait for tiles to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Capture at high resolution
  const capturedCanvas = await html2canvas(container, {
    scale: scale,
    backgroundColor: '#ffffff',
    logging: true,
    useCORS: true,
    allowTaint: true,
  });

  // Create final canvas at exact export dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = size.width;
  finalCanvas.height = size.height;
  const ctx = finalCanvas.getContext('2d');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);
  
  // Center and draw captured canvas
  const offsetX = (size.width - containerRect.width * scale) / 2;
  const offsetY = (size.height - containerRect.height * scale) / 2;
  ctx.drawImage(capturedCanvas, offsetX, offsetY, containerRect.width * scale, containerRect.height * scale);

  // Download PNG
  const link = document.createElement('a');
  link.href = finalCanvas.toDataURL('image/png');
  link.download = filename || `mapflam_${format}_${new Date().toISOString().split('T')[0]}.png`;
  link.click();
}

// Generate thumbnail: 102×102 PNG base64 (for SavedTab preview)
export async function generateThumbnail(containerSelector: string): Promise<string> {
  const container = document.querySelector(containerSelector);
  if (!container) throw new Error(`Container not found: ${containerSelector}`);

  // Wait for tiles to load and settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const canvas = await html2canvas(container as HTMLElement, {
    width: 102,
    height: 102,
    scale: 1.5,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
    ignoreElements: (element) => {
      // Ignore Leaflet controls for cleaner thumbnail
      const classList = (element as HTMLElement).classList;
      return classList?.contains('leaflet-control') || classList?.contains('leaflet-control-attribution');
    },
  });

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl;
}
```

### 4. Persistence (localStorage) & Working State Recovery

```typescript
// src/lib/services/persistence.ts
interface SavedMap {
  id: string;
  name: string;
  createdAt: number;
  state: {
    markers: Marker[];
    selectedFormat: MapFormat;
    selectedBaseMap: BaseMap;
    mapCenter: { lat: number; lng: number };
    mapZoom: number;
  };
  pinCount: number;
  thumbnail: string;  // Base64 102×102 PNG
}

interface WorkingState {
  markers: Marker[];
  selectedFormat: MapFormat;
  selectedBaseMap: BaseMap;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  lastAutoSave: number;
}

export function saveMap(map: SavedMap): void {
  const saved = JSON.parse(localStorage.getItem('mapflam_saved') || '[]');
  const updated = [map, ...saved.filter(m => m.id !== map.id)].slice(0, 5);
  localStorage.setItem('mapflam_saved', JSON.stringify(updated));
}

export function loadSavedMaps(): SavedMap[] {
  const saved = JSON.parse(localStorage.getItem('mapflam_saved') || '[]');
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
  const valid = saved.filter((m: SavedMap) => (now - m.createdAt) < thirtyDays);
  return valid.sort((a: SavedMap, b: SavedMap) => b.createdAt - a.createdAt);
}

export function deleteMap(id: string): void {
  const saved = JSON.parse(localStorage.getItem('mapflam_saved') || '[]');
  localStorage.setItem('mapflam_saved', JSON.stringify(
    saved.filter((m: SavedMap) => m.id !== id)
  ));
}

// Auto-save & working state recovery
export function saveWorkingState(state: WorkingState): void {
  localStorage.setItem('mapflam_working_state', JSON.stringify(state));
}

export function loadWorkingState(): WorkingState | null {
  const data = localStorage.getItem('mapflam_working_state');
  return data ? JSON.parse(data) : null;
}

export function promoteWorkingStateToSavedMap(workingState: WorkingState): SavedMap {
  return {
    id: Date.now().toString(),
    name: `Map ${(loadSavedMaps().length % 5) + 1}`,
    createdAt: Date.now(),
    state: { /* markers, format, baseMap, center, zoom */ },
    pinCount: workingState.markers.length,
    thumbnail: '', // Captured on explicit save
  };
}
```

**Features:**
- **Auto-save:** Debounced at 2 seconds on marker/format/baseMap changes
- **Working state:** Recovered on app launch if session was interrupted
- **Promotion:** Auto-saved work promoted to saved map on app close (if >0 pins)
- **Expiry:** Saved maps expire after 30 days
- **Storage:** Max 5 maps in localStorage (~5MB)

---

## Design System

### Color Tokens

```css
--color-brand: #5422b0;           /* Buttons, active states */
--color-brand-light: #f0e6f7;     /* Highlights, hover */
--color-text-primary: #777777;    /* Labels, default text */
--color-text-dark: #333333;       /* Emphasis, dark headings */
--color-text-light: #999999;      /* Placeholder, disabled */
--color-bg-panel: #efefef;        /* Card backgrounds */
--color-white: #ffffff;
--color-border: #777777;
```

### Pin/Label Color Palette (6 Fixed)

```
#5422b0 (purple, default)
#02441F (dark green)
#004269 (dark blue)
#AB0000 (red)
#000000 (black)
#FFFFFF (white)
```

### Tile Providers

```typescript
// BASE_MAP_TILES (6 options in BASE_MAP_TILES from types.ts)
positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
osm-standard: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
positron-nolabels: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
esri-satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
opentopomap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'

// INSET_MAP_TILES (Phase 2)
positron, voyager, osm-standard
```

---

## Leaflet Integration

### Map Instance (MapContainer.svelte)

```typescript
import L from 'leaflet';

let map = L.map(containerEl, {
  center: [6.5244, 3.3792],
  zoom: 12,
  dragging: true,
  scrollWheelZoom: true,
  touchZoom: true,
  zoomControl: true,
});

L.tileLayer(tileUrl, { attribution: '' }).addTo(map);

// Subscribe to store changes, update map:
mapCenter.subscribe(center => map.setView([center.lat, center.lng]));
mapZoom.subscribe(zoom => map.setZoom(zoom));

// Update store on map events:
map.on('moveend', () => {
  const c = map.getCenter();
  mapCenter.set({ lat: c.lat, lng: c.lng });
  mapZoom.set(map.getZoom());
});
```

### Marker Rendering

Markers use custom SVG icons via `L.divIcon()`. Color/size applied via CSS.

```typescript
const icon = L.divIcon({
  html: `<img src="/icons/markers/${icon}.svg" style="filter: hue-rotate(...)" />`,
  iconSize: [size * 12, size * 12],
  iconAnchor: [size * 6, size * 12],
  popupAnchor: [0, -size * 12],
});

L.marker([lat, lng], { icon, draggable: true }).addTo(map);
```

---

## Deployment (Cloudflare Pages)

### Pre-Deployment Checklist

- ✅ `npm run build` succeeds
- ✅ `dist/` contains `index.html`, `manifest.json`, icons, assets
- ✅ `start_url: "/"` in manifest (app launches at root)
- ✅ No console errors (check build warnings)
- ✅ Favicon and apple-touch-icon in place
- ✅ robots.txt disallows indexing

### Connect to Cloudflare Pages

1. Push to GitHub
2. Login to Cloudflare Pages dashboard
3. Create project → connect repo → build command: `npm run build`
4. Output directory: `dist/`
5. Deploy

App will be live at `mapflam.pages.dev` (or custom domain if configured).

### Environment Variables

- **`VITE_MAPBOX_API_KEY`** (optional): Required to enable MapBox Geocoding as fallback when Nominatim returns no results. If not provided, only Nominatim will be used for location search.
- All tile providers are public (no keys needed).

---

## Component Hierarchy

```
app.svelte
├── Header (MapFlam logo)
├── Tab selector (Create | Saved)
└── {#if activeTab === 'create'}
    ├── RatioSelector
    ├── BaseMapSelector (dropdown)
    ├── MapContainer
    │   └── Leaflet map + markers
    ├── PinEditor (card, expanded/collapsed)
    │   ├── SearchBar (location search with debounce)
    │   ├── Icon selector (6 icon types)
    │   ├── Size slider (1–5)
    │   ├── Opacity slider (0–100)
    │   ├── Color picker (6-color palette)
    │   └── Label controls (text, size, color, opacity, nudge)
    ├── TwoFingerOverlay (mobile gesture hint)
    ├── InsetMapEditor (Phase 2, if enabled)
    └── Action buttons (Export PNG, New Map)

    {#if activeTab === 'saved'}
    └── SavedTab
        ├── Empty state (no maps)
        └── Map list (thumbnail, name, createdAt, edit/delete menu)
```

---

## Common Development Tasks

### Add a New Marker Customization Option

1. Update `Marker` interface in `types.ts`
2. Add store subscription in `app.svelte` if global
3. Add UI control in `PinEditor.svelte`
4. Update marker rendering in `MapContainer.svelte` (apply CSS/DOM)
5. Update `persistence.ts` to save new field

### Fix a Bug

1. Run `npm run dev`, reproduce locally
2. Check console for errors
3. Use Svelte DevTools (browser extension) to inspect stores
4. Edit `.svelte` or `.ts` file; HMR reloads automatically
5. Test on mobile (iOS Safari, Android Chrome) via ngrok or local IP

### Deploy a Hotfix

1. Commit and push to GitHub
2. Cloudflare Pages auto-rebuilds (watch dashboard)
3. Live at mapflam.pages.dev within 1–2 minutes

---

## Important Notes

- **No authentication:** App is public; use robots.txt if needed
- **Mobile-first:** Test on actual devices (iOS 14+, Android 10+)
- **localStorage only:** 5 maps max, 30-day expiry; no backend
- **Free APIs:** Nominatim (~1 req/sec), tiles (public CDNs)
- **Desktop constraint:** 480px on web (per design)
- **Base64 for encoding:** Use `btoa()`, not `Buffer` (browser compat)
- **XML escape in SVG:** If embedding user text in SVG, escape `<`, `>`, `&`

---

## Useful References

- **Leaflet API:** https://leafletjs.com/reference.html
- **Nominatim Docs:** https://nominatim.org/release-docs/latest/api/Overview/
- **CartoDB Tiles:** https://cartodb.com/basemaps/
- **Stamen Tiles:** http://maps.stamen.com/
- **html2canvas:** https://html2canvas.hertzen.com/
- **Cloudflare Pages:** https://pages.cloudflare.com/
- **Svelte 5 Docs:** https://svelte.dev/
- **Vite Guide:** https://vitejs.dev/guide/

---

## Quick Debugging

| Issue | Check |
|-------|-------|
| Map not rendering | Console errors? Leaflet CSS loaded? Container has height? |
| Markers not showing | SVG files exist? `iconSize` correct? Store subscribed? |
| Search not working | Nominatim reachable? Debounce timeout? CORS? |
| Export black PNG | `html2canvas` scale too high? Container overflow hidden? |
| Maps not saving | localStorage full (>5MB)? Check DevTools Application tab |
| PWA not installing | Manifest valid? HTTPS enabled? start_url correct? |
