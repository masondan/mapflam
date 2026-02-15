# MapFlam SEO & Metadata Audit ✅

**Last Updated:** February 2026

## Summary

MapFlam is now fully configured for sharing, SEO, PWA support, and mobile optimization. All metadata, icons, and social sharing tags are in place and production-ready.

---

## 1. ✅ Robots & Indexing

**Status:** Correctly configured for non-commercial, educational use

- **robots.txt** (`static/robots.txt`): `Disallow: /` — Prevents indexing across all search engines
- **HTML Meta Tags** (`index.html`):
  - `<meta name="robots" content="noindex, nofollow" />`
  - `<meta name="googlebot" content="noindex, nofollow" />`

**Intent:** Educational tool, not for search discovery. Both tags ensure no indexing.

---

## 2. ✅ SEO Metadata

**Page Title:**
- `MapFlam - Create Locator Maps for Journalists`

**Meta Description:**
- `MapFlam is a free, mobile-first web app for journalists and content creators to build beautiful locator maps. Search locations, customize markers, and export as PNG.`

**Meta Keywords:**
- `locator map, map maker, journalist tools, free map builder, location map, marker map`

**Canonical URL:**
- `https://mapflam.pages.dev/`

**Author:**
- `MapFlam Contributors`

---

## 3. ✅ Social Sharing (Open Graph + Twitter Card)

### Open Graph Tags (Facebook, LinkedIn, WhatsApp, etc.)
```
og:type: website
og:url: https://mapflam.pages.dev/
og:title: MapFlam - Create Locator Maps
og:description: A free web app for journalists to build and export locator maps. No login required. Educational use.
og:image: https://mapflam.pages.dev/icons/logo-mapflam-share.png
og:image:width: 1200
og:image:height: 600
og:image:type: image/png
og:site_name: MapFlam
```

### Twitter Card Tags (Twitter/X)
```
twitter:card: summary_large_image
twitter:title: MapFlam - Create Locator Maps
twitter:description: A free web app for journalists and content creators to build beautiful locator maps.
twitter:image: https://mapflam.pages.dev/icons/logo-mapflam-share.png
```

**Share Image:** `logo-mapflam-share.png` (1200×600 px) ✅ Incorporated

---

## 4. ✅ Icons & Favicons

### Icon Inventory

| Icon | Path | Size | Purpose |
|------|------|------|---------|
| **Favicon** | `/icons/logo-mapflam-favicon.png` | 64×64 | Browser tab (standard) |
| **Apple Touch Icon** | `/icons/apple-touch-icon.png` | 192×192, 512×512 | iOS home screen |
| **Maskable Icon** | `/icons/logo-mapflam-maskable.png` | 192×192, 512×512 | PWA icon (maskable format) |
| **Share Image** | `/icons/logo-mapflam-share.png` | 1200×600 | Social sharing (OG/Twitter) |
| **Logotype** | `/icons/logotype-mapflam-purple-trs.png` | — | In-app header logo |

### References in HTML
- ✅ `<link rel="icon" href="/icons/logo-mapflam-favicon.png" />`
- ✅ `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`

---

## 5. ✅ PWA Manifest (`static/manifest.json`)

**Key Features:**
- ✅ `name`: "MapFlam - Locator Map Builder"
- ✅ `short_name`: "MapFlam"
- ✅ `start_url`: "/" (correct for Cloudflare Pages root)
- ✅ `scope`: "/" (entire domain accessible)
- ✅ `display`: "standalone" (fullscreen web app mode)
- ✅ `theme_color`: "#5422b0" (purple brand)
- ✅ `background_color`: "#ffffff" (white)
- ✅ `orientation`: "portrait-primary" (mobile-first)

**Icons Array:**
- ✅ 64×64 favicon (any)
- ✅ 192×192 generic icon (any)
- ✅ 512×512 generic icon (any)
- ✅ 192×192 maskable icon (maskable)
- ✅ 512×512 maskable icon (maskable)

**Shortcuts (for app home screen):**
- ✅ "Create New Map" → `/?tab=create`
- ✅ "View Saved Maps" → `/?tab=saved`

**App Categories:**
- `productivity`, `utilities`

---

## 6. ✅ Viewport & Mobile

**Responsive Design:**
- ✅ `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
- ✅ `viewport-fit=cover` — Safe area support for notched devices (iPhone X+)

**Status Bar:**
- ✅ `<meta name="theme-color" content="#5422b0" />` — Android status bar color
- ✅ `<meta name="msapplication-TileColor" content="#5422b0" />` — Windows tile color

---

## 7. ✅ Character Encoding & HTML Structure

- ✅ `<!doctype html>` — HTML5 doctype
- ✅ `<html lang="en">` — Language declaration
- ✅ `<meta charset="UTF-8" />` — UTF-8 encoding (first meta tag)

---

## 8. ✅ Performance Optimizations

- ✅ Leaflet CSS: CDN (unpkg.com) — reliable, fast
- ✅ Google Fonts: Preload + stylesheet — Inter font stack
- ✅ PWA Manifest linked — offline capability ready

---

## Checklist Summary

| Item | Status | Notes |
|------|--------|-------|
| robots.txt disallow indexing | ✅ | User-agent: * / Disallow: / |
| SEO meta tags | ✅ | Title, description, keywords |
| Open Graph tags | ✅ | Full set with share image (1200×600) |
| Twitter Card tags | ✅ | summary_large_image format |
| Favicon | ✅ | 64×64 PNG |
| Apple Touch Icon | ✅ | 192×192 + 512×512 PNG |
| Maskable PWA Icon | ✅ | 192×192 + 512×512 PNG |
| Share Image | ✅ | 1200×600 PNG (logo-mapflam-share.png) |
| PWA Manifest | ✅ | Full manifest with icons, shortcuts, categories |
| Mobile viewport | ✅ | viewport-fit=cover for notched devices |
| Status bar color | ✅ | #5422b0 (theme-color + msapplication-TileColor) |
| Canonical URL | ✅ | https://mapflam.pages.dev/ |
| Character encoding | ✅ | UTF-8 |
| HTML5 doctype | ✅ | <!doctype html> |

---

## Notes

1. **Non-Indexing:** Both `robots.txt` and HTML meta tags prevent indexing. This is intentional for educational use only.
2. **Share Image:** `logo-mapflam-share.png` is properly referenced in OG and Twitter tags at full 1200×600 dimensions.
3. **PWA:** App can be installed on iOS (via home screen shortcut) and Android (full PWA), with app shortcuts on home screen.
4. **Mobile First:** Design is responsive (480px constraint per AGENTS.md), with safe area support for notched devices.
5. **Production Ready:** All assets are in place; no additional configuration needed for Cloudflare Pages deployment.

---

## Deployment Verification

Before deploying to Cloudflare Pages, verify:

```bash
# 1. Check robots.txt is served
curl https://mapflam.pages.dev/robots.txt

# 2. Verify manifest.json
curl https://mapflam.pages.dev/manifest.json

# 3. Check share image
curl -I https://mapflam.pages.dev/icons/logo-mapflam-share.png

# 4. Open in browser and inspect:
# - Right-click > Inspect > <head> section
# - Check Console for any 404s on icon/manifest resources
```

---

**All systems ready for production.** ✅
