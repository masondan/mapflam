# MapFlam – Development Guide for AI Agents

**Purpose:** Technical reference for AI agents implementing MapFlam.  
**Status:** Phase 1 Development (Core Map Builder)  
**Updated:** January 2026

---

## Project Overview

**MapFlam** is a mobile-first web app for journalists and content creators to build locator maps. Search for locations, place markers with custom styling, optionally add context insets, and export as PNG.

**Key principles:**
- No authentication required
- Non-commercial, educational use only
- Free APIs (Nominatim, CartoDB, Stamen, OpenStreetMap)
- Mobile-first, desktop-friendly (480px constraint on web)
- Not an interactive map tool—output is static PNG exports
- Maps auto-save to localStorage (5 maps max, 30-day expiry)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Vite + Svelte 5 (TypeScript) | Fast, reactive, typed |
| Styling | Native CSS variables (no Tailwind) | Per DESIGN.md tokens |
| Maps | Leaflet 1.9 + tile providers | CartoDB, Stamen, OSM (no API keys) |
| Geocoding | Nominatim API | Free, rate-limited (~1 req/sec) |
| Export | html2canvas | Render DOM to PNG at target size |
| State | Svelte stores (writable) | Reactive global state |
| Persistence | localStorage | JSON serialization, 5 maps + expiry |
| Hosting | Cloudflare Pages | Production deployment |

---

## Project Structure

```
src/
├── app.svelte                    # Root component (tabs, layout)
├── app.css                       # Global styles, CSS variables
├── lib/
│   ├── stores.ts                 # Reactive state (map, markers, UI)
│   ├── types.ts                  # TypeScript interfaces
│   ├── services/
│   │   ├── nominatim.ts          # Geocoding (search locations)
│   │   ├── export.ts             # PNG export via html2canvas
│   │   └── persistence.ts        # localStorage save/load/evict
│   └── components/
│       ├── CreateTab.svelte      # Main map builder (Phase 1)
│       ├── SavedTab.svelte       # Saved maps list (Phase 1)
│       ├── MapContainer.svelte   # Leaflet map instance
│       ├── RatioSelector.svelte  # Format picker (9:16, 1:1, 16:9)
│       ├── BaseMapSelector.svelte # Base map dropdown
│       ├── PinEditor.svelte      # Pin editing card (icons, size, color, label)
│       ├── SearchBar.svelte      # Location search (within pin editor)
│       ├── LabelPanel.svelte     # Label customization toggle
│       ├── InsetMapToggle.svelte # Inset toggle (Phase 1: non-functional)
│       ├── ExportButtons.svelte  # Download / New Map
│       └── InsetMapEditor.svelte # Inset controls (Phase 2)
├── index.html                    # HTML entry point
└── main.ts                       # Vite entry point

static/
├── icons/
│   ├── markers/
│   │   ├── icon-pin1-fill.svg
│   │   ├── icon-pin1.svg
│   │   ├── icon-pin2-fill.svg
│   │   ├── icon-pin2.svg
│   │   ├── icon-pin3-fill.svg
│   │   ├── icon-pin3.svg
│   │   └── ... (6 pins total)
│   ├── icon-newpin.svg
│   ├── icon-expand.svg
│   ├── icon-collapse.svg
│   ├── icon-go.svg
│   ├── icon-pushpin.fill.svg
│   ├── icon-center.svg
│   ├── icon-left.svg
│   ├── icon-right.svg
│   ├── icon-up.svg
│   ├── icon-down.svg
│   ├── icon-more.svg
│   ├── icon-pencil-fill.svg
│   ├── icon-time.svg
│   ├── icon-trash.svg
│   ├── icon-trash-fill.svg
│   └── ... (app icons, logos)
└── robots.txt                    # Disallow: / (no search indexing)
```

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Local dev server (port 5173, hot reload)
npm run build        # Production build
npm run check        # TypeScript + Svelte checks
npm run preview      # Preview production build locally
```

---

## Design System

### Color Tokens (From DESIGN.md)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#5422b0` | Buttons, active states, brand purple |
| `--color-brand-light` | `#f0e6f7` | Light purple highlights, hover states |
| `--color-text-primary` | `#777777` | Default text, labels, button text |
| `--color-text-dark` | `#333333` | Emphasis, dark headings, white text on white |
| `--color-text-light` | `#999999` | Placeholder text, disabled states, hints |
| `--color-bg-panel` | `#efefef` | Card backgrounds, input backgrounds |
| `--color-white` | `#ffffff` | Surfaces, white text backgrounds |
| `--color-border` | `#777777` | Default borders on cards |

### Marker & Label Color Palette (6 Fixed Colors)

Used for pin color selectors and label background selectors. **Do not use wireframe colors.**

```css
--color-picker-0: #5422b0  /* Default: purple */
--color-picker-1: #02441F  /* Dark green */
--color-picker-2: #004269  /* Dark blue */
--color-picker-3: #AB0000  /* Red */
--color-picker-4: #000000  /* Black */
--color-picker-5: #FFFFFF  /* White */
```

### Spacing & Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-sm` | 8px | Tight spacing |
| `--spacing-md` | 16px | Default spacing |
| `--spacing-lg` | 24px | Loose spacing |
| `--radius-md` | 8px | Border radius on cards, buttons |
| Font | Inter, Inter Bold | Sans-serif, system fallback |
| Font sizes | 14px (body), 16px (labels), 18px (headings) | Per wireframes |

---

## Reactive State (Svelte Stores)

```typescript
// src/lib/stores.ts

// Map instance & view
export const leafletMap = writable<L.Map | null>(null);
export const mapCenter = writable({ lat: 6.5244, lng: 3.3792 });  // Lagos default
export const mapZoom = writable(12);

// Marker state
interface Marker {
  id: string;                       // UUID
  lat: number;
  lng: number;
  icon: 'pin1' | 'pin2' | 'pin3' | 'pin4' | 'pin5' | 'pin6';
  size: 1 | 2 | 3 | 4 | 5;           // Sticky: 1=small, 5=large, default=3
  opacity: number;                   // 0–100
  color: string;                     // Hex from palette
  name: string;                      // "Pin 1", "Starting line", etc.
  label?: {
    text: string;
    size: 'small' | 'medium' | 'large';
    bgColor: string;                 // Hex from palette
    bgOpacity: number;               // 0–100
    offsetX: number;                 // px, for nudge buttons
    offsetY: number;
  };
}

export const markers = writable<Marker[]>([]);

// UI state
export const selectedFormat = writable('square');      // 'square' | '16:9' | '9:16'
export const selectedBaseMap = writable('positron');   // 'positron' | 'positron-nolabels' | 'toner'
export const insetMapEnabled = writable(false);        // Phase 2
export const activeTab = writable('create');           // 'create' | 'saved'
export const editingPinId = writable<string | null>(null); // Expanded pin card ID

// Search state (debounced)
export const searchQuery = writable('');
export const searchResults = writable<NominatimResult[]>([]);
export const isSearching = writable(false);

// Saved maps state
export const savedMaps = writable<SavedMap[]>([]);
```

---

## Key Implementation Details

### 1. Map Instance & Rendering

**Leaflet Setup:**
- One map instance per phase (main in Phase 1, + inset in Phase 2)
- Use `L.map()` with container selector
- Tiles loaded from public providers (no auth)
- Markers rendered as custom SVG icons with Leaflet's `L.divIcon()` or `L.marker()`

**Marker Rendering:**
- Pin icon: Load SVG from static folder, colorize with CSS filter or embedded `<tspan fill>`
- Size: Scale icon via CSS `transform: scale()`
- Opacity: CSS `opacity` property
- Labels: Render as div overlay near marker, styled with custom background color

**Real-time Updates:**
- Subscribe to `markers` store → update/re-render each Leaflet marker
- Subscribe to `mapCenter` and `mapZoom` → pan/zoom map
- Debounce pan/zoom events (300ms) to avoid excessive store updates

### 2. Search & Geocoding (Nominatim)

**Endpoint:** `https://nominatim.openstreetmap.org/search`

**Implementation (src/lib/services/nominatim.ts):**
```typescript
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

**Debounce input (300ms):**
- Use `setTimeout()` or Svelte's reactive statements
- Cancel pending request if user types again before timeout

**Cache results in sessionStorage** to avoid re-fetching the same query.

**Rate limiting:** Nominatim allows ~1 req/sec. Debounce handles this.

### 3. Pin Customization

**Icon Selection:**
- 6 SVG icons (pin1–pin6) provided in static/icons/markers/
- Render selected icon on map at marker position
- Colorize by tinting SVG or using multiple colored versions

**Size Slider (Sticky):**
- 5 positions: 1 (12px), 2 (18px), 3 (24px, default), 4 (30px), 5 (36px)
- Snap to nearest position on drag release
- Display size index (1–5) while dragging, hide on release

**Opacity Slider:**
- 0–100% in 10% steps
- Default: 100%
- Visual feedback during drag

**Color Picker:**
- 6 solid buttons (fixed palette, no custom colors)
- Active color has 2–3px border
- Clicking updates marker immediately

**Label System:**
- Toggle to enable/disable label input
- When enabled, show: text input, size slider (Small/Medium/Large), background color picker, background opacity slider, nudge buttons
- Label text rendered in **Inter Bold**
- White text by default; if white background selected, switch to dark text (#333333)
- Nudge buttons: move label by ±4px in x/y directions
- Label repositions with pin on drag (always moves together)

### 4. Pin Editing Card (Modal-like Overlay)

**Behavior:**
- Tapping "Add new pin" button expands card below map
- Card includes: search bar, 6 icon selector, size slider, opacity slider, color picker
- Toggling "Pin label" extends card with label controls
- Collapse arrow collapses card without losing state
- Each pin has its own expanded state; only one pin edited at a time

**Responsive:**
- On mobile: card takes ~80% of viewport height, scrollable
- On desktop (480px): same behavior

### 5. Export (html2canvas)

**Workflow:**
```typescript
export async function exportMap(
  containerSelector: string,
  format: 'square' | '16:9' | '9:16',
  filename?: string
): Promise<void> {
  const sizes = {
    square: { width: 1080, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
  };

  const size = sizes[format];
  const canvas = await html2canvas(document.querySelector(containerSelector)!, {
    width: size.width,
    height: size.height,
    scale: 2, // 2x for clarity
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename || `mapflam_${format}_${new Date().toISOString().split('T')[0]}.png`;
  link.click();
}
```

**No resolution picker UI.** Export size is determined by format:
- **9:16 (vertical):** 1080×1920
- **1:1 (square):** 1080×1080
- **16:9 (horizontal):** 1920×1080

Download button immediately exports; no modal or options.

### 6. localStorage Persistence

**SavedMap Interface:**
```typescript
interface SavedMap {
  id: string;           // UUID, generated at creation
  name: string;         // "Map 1", user-editable
  createdAt: number;    // timestamp ms
  state: {
    markers: Marker[];
    selectedFormat: 'square' | '16:9' | '9:16';
    selectedBaseMap: string;
    mapCenter: { lat: number; lng: number };
    mapZoom: number;
    inset?: InsetConfig;
  };
  thumbnail: string;    // base64 64×64 PNG (lightweight snapshot)
}
```

**Auto-save (src/lib/services/persistence.ts):**
```typescript
export function initAutoSave(debounceMs: number = 1000) {
  // Subscribe to markers, selectedFormat, selectedBaseMap, etc.
  // Debounce changes
  // On debounce timeout, save current state to localStorage
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
  const updated = saved.filter((m: SavedMap) => m.id !== id);
  localStorage.setItem('mapflam_saved', JSON.stringify(updated));
}
```

**Re-editing:** Clicking "Edit" on a saved map loads its `state` into the current stores, returns to Create tab. User can modify and save (creates new entry or updates existing).

**Challenges & mitigations:**
- **Cache clear:** Document that deleting browser cache deletes maps (unavoidable, mentioned in Saved tab UI)
- **Data size:** Keep thumbnail at 64×64 base64 only; full export PNG is not stored
- **Concurrent edits:** Unsupported; document as single-tab only

### 7. Nominatim API Best Practices

- **Rate limiting:** 1 req/sec max. Debounce input to 300ms.
- **Request format:** Include `Accept-Language: en` header to prefer English results.
- **Caching:** Store results in sessionStorage by query string. Clear on new session.
- **Error handling:** Show user-friendly error ("Couldn't find location. Try another search.") on 429, 500, etc.
- **Coordinate input:** Support GPS input (e.g., "40.7128,-74.0060") via regex detection.

### 8. Mobile Considerations

- **Touch events:** Use `@touchstart`, `@touchmove`, `@touchend` for marker drag precision
- **Viewport:** Constrain to 480px on desktop; full width on mobile
- **Icons:** Ensure touch targets ≥48px
- **Keyboard:** On mobile, search input should show mobile keyboard (iOS: numeric if GPS, text otherwise)
- **Orientation:** Support both portrait and landscape; map resizes with format selection

---

## Project Phasing

### Phase 1: Core Map Builder (Weeks 1–2)

**Goal:** Build fully functional map creation, multi-pin support, complete customization, save/load, export.

**Deliverables:**
- ✅ Leaflet map component (single instance, responsive, drag/zoom/pinch, mobile-friendly)
- ✅ Ratio selector (9:16, 1:1, 16:9) with real-time map aspect ratio
- ✅ Base map selector (CartoDB Positron, Positron No Labels, Stamen Toner) with dropdown and thumbnails
- ✅ Add pin button → modal card:
  - Search bar (Nominatim, debounced, dropdown results)
  - Manual pin placement (pushpin icon to place pin, drag to position)
  - 6 icon selector with visual preview
  - Pin size slider (sticky 1–5, default 3)
  - Pin opacity slider (0–100%, 10% steps)
  - Pin color selector (6 buttons, fixed palette)
  - Pin label toggle → label text input, label size (Small/Medium/Large), label background color, background opacity, nudge buttons (±x, ±y)
  - Delete pin button
  - Collapse/expand arrow
- ✅ Pin name editor (text field in bar; default "Pin 1", "Pin 2", etc., user-editable)
- ✅ Inset map toggle (UI visible, controls **grayed out and non-functional**)
- ✅ Download button (hidden until 1+ pin exists) → immediate PNG export at format-dependent size
- ✅ New Map button → confirmation modal → resets to blank Create tab, saves current map
- ✅ Auto-save to localStorage on any change (debounced 1 sec)
- ✅ Saved tab:
  - Empty state placeholder
  - Map list (thumbnail, name editable, timestamp, pin count)
  - Three-dot menu → Delete | Download | Edit
  - Delete confirmation flow
  - Edit button loads map into Create tab
- ✅ Mobile responsive (touch-friendly, 480px desktop constraint, shadow left/right)
- ✅ Color scheme per DESIGN.md tokens (not wireframe colors)
- ✅ Manifest file for PWA (logos, splash screen, theme color #5422b0)

**Tech focus:**
- Svelte 5 reactivity patterns
- Leaflet API (markers, controls, zoom/pan)
- Nominatim search integration
- html2canvas export
- localStorage persistence with expiry logic
- CSS custom properties for theming

**Success criteria:**
- User can add, customize, and export a 2–3 pin map
- Maps persist in Saved tab
- No console errors on mobile (iOS Safari, Android Chrome)
- UX matches wireframes

---

### Phase 2: Inset Map & Performance (Week 3)

**Goal:** Add optional context inset, optimize rendering, improve accessibility.

**Deliverables:**
- ✅ Inset map component (second Leaflet instance)
  - Toggle to enable/disable with visual feedback
  - Search bar (Nominatim) within inset card
  - Base style dropdown (3 simple tile sets, radio-style thumbnails)
  - Position buttons (4 corners: top-left, top-right, bottom-left, bottom-right; default top-right)
  - Border color selector (6 buttons, matches pin palette)
  - Size slider (sticky 3 positions: Small, Medium, Large; default Medium)
  - Preview map that updates main inset in real-time
- ✅ Linked pan/zoom (inset pans/zooms with main map automatically)
- ✅ Performance: lazy-load Leaflet on first use, debounce pan/zoom events (300ms)
- ✅ Accessibility: keyboard navigation (Tab, Enter, Arrow keys), ARIA labels, color contrast ≥4.5:1

**Tech focus:**
- Multiple Leaflet instances with synced state
- Svelte lifecycle (onMount for lazy load)
- WCAG 2.1 AA compliance
- Performance monitoring (Lighthouse)

---

### Phase 3: Refinement & Deployment (Week 4)

**Goal:** Polish UX, finalize deployment, documentation.

**Deliverables:**
- ✅ Mobile UX polish (gesture handling, label placement precision, touch feedback)
- ✅ robots.txt (Disallow: / to hide from search)
- ✅ Deploy to Cloudflare Pages
- ✅ README with usage guide
- ✅ Bug fixes and edge case handling

---

## Critical Rules for AI Agents

1. **Use DESIGN.md as visual source of truth** – All wireframes, layouts, and component hierarchies defined there.
2. **Use fixed color palette** – No custom colors. Only use the 6 picker colors and design tokens.
3. **Mobile-first mindset** – Design for touch, 9:16 portrait by default.
4. **No authentication** – Public URL, no login.
5. **Free APIs only** – Nominatim, CartoDB, Stamen, OSM. No paid services.
6. **Base64 encoding for Cloudflare** – Use `btoa()`, not `Buffer` (for browser compatibility).
7. **XML escaping for labels** – If embedding user text in SVG or SSML, escape `<`, `>`, `&`.
8. **Debounce external calls** – Nominatim search (300ms), map pan/zoom (300ms).
9. **Auto-save with debounce** – Save to localStorage 1 sec after last change to avoid thrashing.
10. **localStorage, not IndexedDB** – Simpler, sufficient for 5 maps. Document expiry in UI.

---

## Environment Variables

None required for MVP. All APIs are public and free.

Optional (future phases):
```env
# TBD (e.g., analytics, custom domain, etc.)
```

---

## Next Steps for AI Agents

1. **Verify tech setup:** Node 18+, npm, Vite, Svelte 5
2. **Install dependencies:** `npm install`
3. **Set up file structure:** Create directories under `src/lib/` (services, components)
4. **Phase 1 tasks (in order):**
   1. Define Svelte stores (types.ts, stores.ts)
   2. Build MapContainer component (Leaflet + reactive center/zoom)
   3. Build RatioSelector (9:16, 1:1, 16:9 buttons, store updates)
   4. Build BaseMapSelector (dropdown, thumbnails, tile switching)
   5. Build SearchBar + Nominatim service (debounce, dropdown UI)
   6. Build PinEditor card (icons, sliders, color picker, label toggle)
   7. Implement marker rendering on map (SVG icons, size, opacity, color, labels)
   8. Build export function (html2canvas, format-dependent sizing)
   9. Build persistence service (auto-save, load, delete, expiry)
   10. Build SavedTab (list, edit, delete, download, rename)
   11. Build CreateTab (compose all above components)
   12. Mobile testing (iOS Safari, Android Chrome)
   13. Accessibility audit (keyboard nav, ARIA)
   14. Deploy to Cloudflare Pages
5. **Phase 2 tasks:** Inset map, performance, accessibility
6. **Phase 3 tasks:** Refinement, documentation, deployment

---

## Useful References

- **Leaflet Docs:** https://leafletjs.com/
- **Nominatim API:** https://nominatim.org/
- **CartoDB Tiles:** https://cartodb.com/basemaps/
- **Stamen Tiles:** http://maps.stamen.com/
- **html2canvas:** https://html2canvas.hertzen.com/
- **Cloudflare Pages:** https://pages.cloudflare.com/
- **Svelte 5:** https://svelte.dev/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/

