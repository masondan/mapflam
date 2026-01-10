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
| Maps | **Leaflet 1.9** | CartoDB, Stamen, OpenStreetMap tiles (no API keys) |
| Geocoding | **Nominatim API** | Free; rate-limit: ~1 req/sec |
| Export | **html2canvas** | DOM → PNG at format-dependent sizes |
| State | **Svelte stores** | Global reactivity for markers, map state, UI |
| Persistence | **localStorage** | JSON serialization; 5 maps max, 30-day expiry |
| Hosting | **Cloudflare Pages** | Root URL: mapflam.pages.dev |

---

## Project Structure

```
src/
├── app.svelte                    # Root component (Create/Saved tabs)
├── app.css                       # Global styles, CSS variables
├── main.ts                       # Vite entry point
└── lib/
    ├── stores.ts                 # Reactive state (markers, map, UI)
    ├── types.ts                  # TypeScript interfaces
    ├── services/
    │   ├── nominatim.ts          # Location search (debounced)
    │   ├── export.ts             # PNG export via html2canvas
    │   └── persistence.ts        # localStorage (save/load/delete/expiry)
    └── components/
        ├── MapContainer.svelte   # Leaflet map instance
        ├── RatioSelector.svelte  # 9:16, 1:1, 16:9 buttons
        ├── BaseMapSelector.svelte # Basemap dropdown (thumbnails)
        ├── PinEditor.svelte      # Pin card (search, icons, sliders, labels)
        ├── SearchBar.svelte      # Location search UI
        ├── SavedTab.svelte       # Saved maps list
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
// Map
export const leafletMap = writable<L.Map | null>(null);
export const mapCenter = writable({ lat: 6.5244, lng: 3.3792 });  // Lagos default
export const mapZoom = writable(12);

// Markers
export const markers = writable<Marker[]>([]);

// UI
export const selectedFormat = writable('square');      // 'square' | '16:9' | '9:16'
export const selectedBaseMap = writable('positron');   // 'positron' | 'positron-nolabels' | 'toner'
export const activeTab = writable('create');           // 'create' | 'saved'
export const editingPinId = writable<string | null>(null); // Expanded pin card

// Search (debounced)
export const searchQuery = writable('');
export const searchResults = writable<NominatimResult[]>([]);

// Inset (Phase 2)
export const insetConfig = writable<InsetConfig>({ /* ... */ });
export const insetLeafletMap = writable<L.Map | null>(null);
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

### 2. Nominatim Search (Debounced)

```typescript
// src/lib/services/nominatim.ts
export async function searchLocations(query: string): Promise<NominatimResult[]> {
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
  return response.json();
}
```

**Important:** Debounce input at 300ms to respect rate limits (~1 req/sec).

### 3. Export (html2canvas)

```typescript
// src/lib/services/export.ts
export async function exportMap(
  containerSelector: string,
  format: 'square' | '16:9' | '9:16'
): Promise<void> {
  const sizes = {
    square: { width: 1080, height: 1080 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
  };
  
  const canvas = await html2canvas(document.querySelector(containerSelector)!, {
    width: sizes[format].width,
    height: sizes[format].height,
    scale: 2,
    backgroundColor: '#ffffff',
  });
  
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `mapflam_${format}_${Date.now()}.png`;
  link.click();
}
```

### 4. Persistence (localStorage)

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
  thumbnail: string;  // Base64 64×64 PNG
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
  
  return saved
    .filter((m: SavedMap) => (now - m.createdAt) < thirtyDays)
    .sort((a: SavedMap, b: SavedMap) => b.createdAt - a.createdAt);
}

export function deleteMap(id: string): void {
  const saved = JSON.parse(localStorage.getItem('mapflam_saved') || '[]');
  localStorage.setItem('mapflam_saved', JSON.stringify(
    saved.filter((m: SavedMap) => m.id !== id)
  ));
}
```

Auto-save debounced at 1 sec on any marker/format/baseMap change.

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
// BASE_MAP_TILES
positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
positron-nolabels: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
toner: 'https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png'

// INSET_MAP_TILES (Phase 2)
positron-nolabels, watercolor, voyager
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

None required for MVP. All APIs (Nominatim, tile providers) are public.

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
    │   ├── SearchBar (location search)
    │   ├── Icon selector
    │   ├── Size slider
    │   ├── Opacity slider
    │   ├── Color picker
    │   └── Label controls (text, size, color, opacity, nudge)
    ├── InsetMapToggle
    ├── InsetMapEditor (Phase 2, if enabled)
    └── ExportButtons (Download, New Map)

    {#if activeTab === 'saved'}
    └── SavedTab
        ├── Empty state (no maps)
        └── Map list (thumbnail, name, timestamp, menu)
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
