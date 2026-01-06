# MapFlam

**Purpose:** Technical reference for AI agents working on MapFlam.  
**Status:** MVP Development (Phase 1)  
**Updated:** January 2026

---

## Project Phase

**Current:** Phase 1 - Core MVP. Build searchable map with markers and PNG export.

---

## Overview

**MapFlam** is a mobile-first web app for journalists and content creators to build locator maps. Search for locations, place markers, add context insets, and export as PNG/JPG.

- **No auth required** - public URL, hidden from search engines
- **Non-commercial, educational use only**
- **Free tile data** - CartoDB, Stamen, OpenStreetMap (no API keys)
- **Free geocoding** - Nominatim (OpenStreetMap)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vite + Svelte 5 (TypeScript) |
| Styling | Native CSS variables (no Tailwind) |
| Maps | Leaflet 1.9 + OpenStreetMap tiles |
| Geocoding | Nominatim API (free, no auth) |
| Export | html2canvas |
| Hosting | Cloudflare Pages |

---

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Local development (port 5173)
npm run build      # Production build
npm run check      # TypeScript/Svelte checks
```

---

## Project Structure

```
src/
├── app.svelte                    # Root component
├── app.css                       # Global styles, CSS variables
├── lib/
│   ├── stores.ts                 # Reactive state (map, markers, settings)
│   ├── services/
│   │   ├── nominatim.ts          # Geocoding API (search locations)
│   │   └── export.ts             # PNG/JPG export via html2canvas
│   └── components/
│       ├── MapContainer.svelte   # Main Leaflet map
│       ├── SearchBar.svelte      # Location search input
│       ├── MarkerList.svelte     # Marker management panel
│       ├── FormatSelector.svelte # Export format picker (3 ratios)
│       ├── MapSelector.svelte    # Base map style selector
│       ├── ExportPanel.svelte    # Export resolution picker
│       └── ContextMap.svelte     # Inset map (Phase 2)
├── index.html                    # HTML entry point
└── main.ts                       # Vite entry point

static/
├── icons/
│   ├── markers/                  # Marker SVG icons (user-provided)
│   │   ├── incident.svg
│   │   ├── location.svg
│   │   └── [more icons...]
│   └── [app icons, logos]
└── robots.txt                    # Disallow: / (no indexing)
```

---

## UX Flow (MVP → Phase 1)

```
1. Search location (Nominatim)
2. Drag marker to fine-tune placement
3. Select format (square 1:1, 16:9, 9:16)
4. Select base map (CartoDB, Stamen, OSM)
5. Replace/accept default marker
6. [Phase 2] Add context inset (optional)
7. Select export resolution (1080x1080, 1920x1080, 1080x1920)
8. Export as PNG
```

---

## Base Maps (Recommended)

| Map | Tile Provider | Look | Best For |
|-----|---------------|------|----------|
| **CartoDB Positron** | CartoDB + OSM | Minimal, light gray, readable labels | Default—clean, journalistic |
| **CartoDB Positron (No Labels)** | CartoDB + OSM | Minimal, light gray, no place names | Focus on location, not context |
| **Stamen Toner** | Stamen + OSM | High contrast, B&W, roads/geography clear | Print/grayscale-friendly |

**Implementation:** Leaflet L.tileLayer() with different URLs per map. No auth needed; tiles are public.

---

## Marker System (Phase 1)

**Icons:** User provides SVG files. Store in `static/icons/markers/`.

**MVP (Phase 1):**
- Single default marker (red pin, user-provided SVG)
- Drag to adjust position
- Delete marker

**Phase 2:**
- Icon selector dropdown
- Multiple markers per map
- Marker labels + metadata

---

## API Integrations

### Nominatim (Geocoding - Search)
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Method:** GET
- **Auth:** None (free, public)
- **Rate limit:** ~1 req/sec (acceptable for individual use)
- **Query:** `?q={location}&format=json&limit=5`
- **Response:** Array of locations with lat/lon

**Implementation:** `src/lib/services/nominatim.ts`
- Debounce search input (300ms)
- Cache results locally (sessionStorage)
- Show dropdown with top 5 results

### html2canvas (Export)
- **Function:** Render DOM (map + UI) to canvas, save as PNG
- **Implementation:** `src/lib/services/export.ts`
- **Workflow:** Capture map container at target resolution (1080x1080, etc.) → PNG blob → Download

---

## Reactive State (Svelte Stores)

```typescript
// src/lib/stores.ts

// Map state
export const mapCenter = writable({ lat: 6.5244, lng: 3.3792 }); // Lagos default
export const mapZoom = writable(12);

// Marker state
export const markers = writable([
  { id: 1, lat: 6.5244, lng: 3.3792, icon: 'incident.svg', label: '' }
]);

// UI state
export const selectedFormat = writable('square'); // square | 16:9 | 9:16
export const selectedBaseMap = writable('positron'); // positron | positron-nolabels | toner
export const exportResolution = writable(1080); // 1080 | 1920

// Search state
export const searchQuery = writable('');
export const searchResults = writable([]);
export const isSearching = writable(false);
```

---

## Design System

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#5422b0` | Buttons, active states |
| `--color-text-primary` | `#333333` | Body text |
| `--color-text-secondary` | `#777777` | Hints, labels |
| `--color-white` | `#ffffff` | Cards, surfaces |
| `--color-background` | `#efefef` | App background |
| `--color-border` | `#e0e0e0` | Borders |

### Spacing & Layout

| Token | Value |
|-------|-------|
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--radius-md` | 8px |

---

## Roadmap

### Phase 1 (Weeks 1–2): Core MVP
- [x] Project scaffolding (this file)
- [ ] Leaflet map component (basic, single map)
- [ ] Nominatim search + dropdown
- [ ] Marker placement (click to add, drag to adjust)
- [ ] Format selector (3 ratios)
- [ ] Base map selector (3 maps)
- [ ] Export via html2canvas (single resolution 1080x1080)
- [ ] Mobile responsive UI

**Deliverable:** Functional map builder; no inset map yet.

### Phase 2 (Week 3): Context Map + Polish
- [ ] Inset map component (linked pan/zoom)
- [ ] Export resolution picker (1080, 1920)
- [ ] Marker icon selector (5 user-provided SVGs)
- [ ] Marker labels + edit panel
- [ ] Performance optimization (lazy load Leaflet, debounce pan/zoom)

**Deliverable:** Full feature set as designed.

### Phase 3 (Week 4): Refinement
- [ ] Mobile UX polish (touch gestures, marker precision)
- [ ] Accessibility (keyboard nav, ARIA)
- [ ] Deploy to Cloudflare Pages
- [ ] Documentation

**Deliverable:** Production-ready app.

---

## Critical Rules

1. **Simplicity first** - single-purpose tool, mobile-first
2. **No auth** - public, no login
3. **No indexing** - `robots.txt` blocks crawlers
4. **Free APIs only** - Nominatim, tile servers
5. **Base64 encoding** - use `btoa()` not `Buffer` (Cloudflare compatibility)
6. **XML escaping** - escape user text if embedded in SSML/XML (e.g., marker labels)
7. **Mobile-first CSS** - responsive design, touch-friendly UI
8. **Debounce external calls** - Nominatim search, map pan/zoom events

---

## Environment Variables

None required for MVP. All APIs are free and public.

Optional (for future):
```env
# TBD (e.g., if adding analytics, custom tile server, etc.)
```

---

## Development Notes

- **Leaflet instance:** One per map component (main + inset in Phase 2)
- **Marker state:** Reactive store; update = re-render Leaflet markers
- **Search debounce:** 300ms input debounce → Nominatim query
- **Export:** Use html2canvas; render at target canvas size (e.g., 1080x1080)
- **Mobile:** Touch event handlers for marker drag on mobile devices

---

## Next Steps (For AI Agents)

1. Wait for user to provide **wireframes** (UI layout for each screen)
2. Wait for user to provide **marker icons** (SVGs for incident, location, etc.)
3. Build Phase 1 components in order:
   - Leaflet map component
   - Search bar + Nominatim integration
   - Marker placement logic
   - Format/map/resolution selectors
   - Export panel
4. Test on mobile (iOS Safari, Android Chrome)
5. Gather feedback from user; iterate

---

## Useful Links

- **Leaflet Docs:** https://leafletjs.com/
- **Nominatim API:** https://nominatim.org/
- **CartoDB Tiles:** https://cartodb.com/basemaps/
- **Stamen Tiles:** http://maps.stamen.com/
- **html2canvas:** https://html2canvas.hertzen.com/
- **Cloudflare Pages:** https://pages.cloudflare.com/
