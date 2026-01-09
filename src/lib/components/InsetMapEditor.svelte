<script lang="ts">
  import { onDestroy } from 'svelte';
  import L from 'leaflet';
  import { insetConfig, insetLeafletMap, editingPinId } from '../stores';
  import { searchLocations } from '../services/nominatim';
  import {
    COLOR_PALETTE,
    INSET_MAP_TILES,
    type InsetPosition,
    type InsetSize,
    type InsetBaseMap,
  } from '../types';

  let previewContainer: HTMLDivElement;
  let previewMap: L.Map | null = null;
  let tileLayer: L.TileLayer | null = null;
  let spotlightMarker: L.Marker | null = null;
  let searchInput = '';
  let searchResults: Array<{ display_name: string; lat: string; lon: string }> = [];
  let isSearching = false;
  let showResults = false;
  let searchTimeout: ReturnType<typeof setTimeout>;
  let isExpanded = true;
  let baseMapExpanded = false;
  let isDraggingSize = false;
  let isDraggingSpotlightSize = false;

  const positions: { id: InsetPosition; icon: string }[] = [
    { id: 'top-right', icon: '/icons/icon-right-up-fill.svg' },
    { id: 'top-left', icon: '/icons/icon-left-up-fill.svg' },
    { id: 'bottom-right', icon: '/icons/icon-right-down-fill.svg' },
    { id: 'bottom-left', icon: '/icons/icon-left-down-fill.svg' },
  ];

  const baseMapOptions: InsetBaseMap[] = ['positron-nolabels', 'watercolor', 'voyager'];

  const SPOTLIGHT_SIZE_MAP: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 30,
    2: 45,
    3: 60,
    4: 75,
    5: 90,
  };

  function toggleEnabled() {
    insetConfig.update((c) => {
      if (!c.enabled) {
        editingPinId.set(null);
      }
      return { ...c, enabled: !c.enabled };
    });
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function toggleBaseMapDropdown() {
    baseMapExpanded = !baseMapExpanded;
  }

  function setPosition(pos: InsetPosition) {
    insetConfig.update((c) => ({ ...c, position: pos }));
  }

  function setBorderColor(color: string) {
    insetConfig.update((c) => ({ ...c, borderColor: color }));
  }

  function setSpotlightColor(color: string) {
    insetConfig.update((c) => ({
      ...c,
      spotlight: { ...c.spotlight, color },
    }));
    updateSpotlightMarker();
  }

  function setSpotlightSize(size: 1 | 2 | 3 | 4 | 5) {
    insetConfig.update((c) => ({
      ...c,
      spotlight: { ...c.spotlight, size },
    }));
    updateSpotlightMarker();
  }

  function setSize(size: InsetSize) {
    insetConfig.update((c) => ({ ...c, size }));
  }

  function setBaseMap(baseMap: InsetBaseMap) {
    insetConfig.update((c) => ({ ...c, baseMap }));
    updateTileLayer(baseMap);
  }

  function updateTileLayer(baseMap: InsetBaseMap) {
    if (!previewMap) return;
    if (tileLayer) {
      previewMap.removeLayer(tileLayer);
    }
    const tiles = INSET_MAP_TILES[baseMap];
    tileLayer = L.tileLayer(tiles.url, {
      attribution: '',
    }).addTo(previewMap);
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    if (searchInput.length < 2) {
      searchResults = [];
      showResults = false;
      return;
    }
    isSearching = true;
    searchTimeout = setTimeout(async () => {
      try {
        const results = await searchLocations(searchInput);
        searchResults = results.slice(0, 5);
        showResults = searchResults.length > 0;
      } catch {
        searchResults = [];
      } finally {
        isSearching = false;
      }
    }, 300);
  }

  function handleSearchSubmit() {
    if (searchResults.length > 0) {
      selectLocation(searchResults[0].lat, searchResults[0].lon);
    }
  }

  function selectLocation(lat: string, lon: string) {
    const newLat = parseFloat(lat);
    const newLng = parseFloat(lon);
    insetConfig.update((c) => ({
      ...c,
      center: { lat: newLat, lng: newLng },
      spotlight: { ...c.spotlight, enabled: true, lat: newLat, lng: newLng },
    }));
    if (previewMap) {
      previewMap.setView([newLat, newLng], $insetConfig.zoom);
    }
    updateSpotlightMarker();
    searchInput = '';
    searchResults = [];
    showResults = false;
  }

  function addSpotlightManually() {
    const center = $insetConfig.center;
    insetConfig.update((c) => ({
      ...c,
      spotlight: { ...c.spotlight, enabled: true, lat: center.lat, lng: center.lng },
    }));
    updateSpotlightMarker();
  }

  function createSpotlightIcon(color: string, size: number) {
    return L.divIcon({
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        border: 3px solid ${color};
        border-radius: 50%;
        background: transparent;
        box-sizing: border-box;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: 'spotlight-marker',
    });
  }

  function updateSpotlightMarker() {
    if (!previewMap) return;
    const config = $insetConfig;
    if (!config.spotlight.enabled) {
      if (spotlightMarker) {
        previewMap.removeLayer(spotlightMarker);
        spotlightMarker = null;
      }
      return;
    }

    const size = SPOTLIGHT_SIZE_MAP[config.spotlight.size];
    const icon = createSpotlightIcon(config.spotlight.color, size);

    if (spotlightMarker) {
      spotlightMarker.setLatLng([config.spotlight.lat, config.spotlight.lng]);
      spotlightMarker.setIcon(icon);
    } else {
      spotlightMarker = L.marker([config.spotlight.lat, config.spotlight.lng], {
        icon,
        draggable: true,
      }).addTo(previewMap);

      spotlightMarker.on('dragend', () => {
        if (!spotlightMarker) return;
        const latlng = spotlightMarker.getLatLng();
        insetConfig.update((c) => ({
          ...c,
          spotlight: { ...c.spotlight, lat: latlng.lat, lng: latlng.lng },
        }));
      });
    }
  }

  function initPreviewMap() {
    if (!previewContainer || previewMap) return;

    previewMap = L.map(previewContainer, {
      center: [$insetConfig.center.lat, $insetConfig.center.lng],
      zoom: $insetConfig.zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
    });

    updateTileLayer($insetConfig.baseMap);

    previewMap.on('moveend', () => {
      if (!previewMap) return;
      const center = previewMap.getCenter();
      insetConfig.update((c) => ({
        ...c,
        center: { lat: center.lat, lng: center.lng },
        zoom: previewMap!.getZoom(),
      }));
    });

    if ($insetConfig.spotlight.enabled) {
      updateSpotlightMarker();
    }

    insetLeafletMap.set(previewMap);
  }

  function destroyPreviewMap() {
    if (previewMap) {
      previewMap.remove();
      previewMap = null;
      tileLayer = null;
      spotlightMarker = null;
      insetLeafletMap.set(null);
    }
  }

  $: if ($insetConfig.enabled && previewContainer && !previewMap) {
    setTimeout(initPreviewMap, 50);
  }

  $: if (!$insetConfig.enabled && previewMap) {
    destroyPreviewMap();
  }

  $: if (previewMap && $insetConfig.spotlight) {
    updateSpotlightMarker();
  }

  onDestroy(() => {
    destroyPreviewMap();
    clearTimeout(searchTimeout);
  });

  function getSizeIndex(size: InsetSize): number {
    const sizes: InsetSize[] = ['small', 'medium', 'large'];
    return sizes.indexOf(size);
  }
</script>

<div class="inset-toggle-wrapper">
  <button class="toggle-header" onclick={toggleExpand}>
    <img
      src={isExpanded && $insetConfig.enabled ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
      alt="Toggle"
      class="toggle-chevron"
    />
    <span class="toggle-label">Inset map</span>
  </button>
  <button
    class="toggle-switch"
    class:active={$insetConfig.enabled}
    onclick={toggleEnabled}
    aria-pressed={$insetConfig.enabled}
    aria-label="Toggle inset map"
  >
    <span class="toggle-thumb"></span>
  </button>
</div>

{#if $insetConfig.enabled && isExpanded}
  <div class="inset-card">
    <p class="info-line">Spotlight the wider region to add extra context</p>

    <div class="section">
      <div class="search-row">
        <div class="search-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search or tap pin to add"
            bind:value={searchInput}
            oninput={handleSearchInput}
            onkeydown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button class="search-go-btn" onclick={handleSearchSubmit} aria-label="Search">
            <img src="/icons/icon-go.svg" alt="Search" />
          </button>
          {#if showResults}
            <div class="search-results">
              {#each searchResults as result}
                <button
                  class="search-result-item"
                  onclick={() => selectLocation(result.lat, result.lon)}
                >
                  {result.display_name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <button class="pushpin-btn" onclick={addSpotlightManually} aria-label="Add spotlight manually">
          <img src="/icons/icon-pushpin-fill.svg" alt="Add pin" />
        </button>
      </div>
    </div>

    <div class="section">
      <div
        class="preview-map-container"
        style="border-color: {$insetConfig.borderColor}"
        bind:this={previewContainer}
      ></div>
    </div>

    <div class="section">
      <button class="dropdown-header" onclick={toggleBaseMapDropdown}>
        <span class="dropdown-label">Base map</span>
        <img
          src={baseMapExpanded ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
          alt="Toggle"
          class="dropdown-chevron"
        />
      </button>
      {#if baseMapExpanded}
        <div class="base-style-grid">
          {#each baseMapOptions as baseMap}
            <button
              class="base-style-thumb"
              class:active={$insetConfig.baseMap === baseMap}
              onclick={() => setBaseMap(baseMap)}
              aria-label="Select {INSET_MAP_TILES[baseMap].name} base map"
            >
              <div class="thumb-preview" data-style={baseMap}></div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="section row-section">
      <span class="section-label">Position</span>
      <div class="position-row">
        {#each positions as pos}
          <button
            class="position-btn"
            class:active={$insetConfig.position === pos.id}
            onclick={() => setPosition(pos.id)}
            aria-label={pos.id}
          >
            <img src={pos.icon} alt={pos.id} />
          </button>
        {/each}
      </div>
    </div>

    <div class="section row-section">
      <span class="section-label">Inset map size</span>
      <div class="slider-wrapper">
        <input
          type="range"
          class="slider"
          min="1"
          max="3"
          value={getSizeIndex($insetConfig.size) + 1}
          oninput={(e) => {
            isDraggingSize = true;
            const val = parseInt((e.target as HTMLInputElement).value);
            const sizes: InsetSize[] = ['small', 'medium', 'large'];
            setSize(sizes[val - 1]);
          }}
          onchange={() => isDraggingSize = false}
          onmouseup={() => isDraggingSize = false}
          ontouchend={() => isDraggingSize = false}
        />
        {#if isDraggingSize}
          <span class="slider-feedback">{getSizeIndex($insetConfig.size) + 1}</span>
        {/if}
      </div>
    </div>

    <div class="section">
      <span class="section-label with-underline">Border colour</span>
      <div class="color-picker">
        {#each COLOR_PALETTE as color}
          <button
            class="color-btn"
            class:active={$insetConfig.borderColor === color}
            class:white={color === '#FFFFFF'}
            style="background-color: {color}"
            onclick={() => setBorderColor(color)}
            aria-label="Select {color} border color"
          ></button>
        {/each}
      </div>
    </div>

    <div class="section">
      <span class="section-label with-underline">Spotlight colour</span>
      <div class="color-picker">
        {#each COLOR_PALETTE as color}
          <button
            class="color-btn"
            class:active={$insetConfig.spotlight.color === color}
            class:white={color === '#FFFFFF'}
            style="background-color: {color}"
            onclick={() => setSpotlightColor(color)}
            aria-label="Select {color} spotlight color"
          ></button>
        {/each}
      </div>
    </div>

    <div class="section row-section">
      <span class="section-label">Spotlight size</span>
      <div class="slider-wrapper">
        <input
          type="range"
          class="slider"
          min="1"
          max="5"
          value={$insetConfig.spotlight.size}
          oninput={(e) => {
            isDraggingSpotlightSize = true;
            const val = parseInt((e.target as HTMLInputElement).value) as 1 | 2 | 3 | 4 | 5;
            setSpotlightSize(val);
          }}
          onchange={() => isDraggingSpotlightSize = false}
          onmouseup={() => isDraggingSpotlightSize = false}
          ontouchend={() => isDraggingSpotlightSize = false}
        />
        {#if isDraggingSpotlightSize}
          <span class="slider-feedback">{$insetConfig.spotlight.size}</span>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .inset-toggle-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
  }

  .toggle-header {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .toggle-chevron {
    width: 20px;
    height: 20px;
  }

  .toggle-label {
    font-size: 16px;
    color: var(--color-text-primary);
  }

  .toggle-switch {
    width: 48px;
    height: 28px;
    background: var(--color-text-primary);
    border: none;
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle-switch.active {
    background: var(--color-brand);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background: var(--color-white);
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-switch.active .toggle-thumb {
    transform: translateX(20px);
  }

  .inset-card {
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 12px;
  }

  .info-line {
    font-size: 14px;
    color: var(--color-text-light);
    margin: 0 0 16px 0;
  }

  .section {
    margin-bottom: 20px;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .row-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-bg-panel);
  }

  .section-label {
    font-size: 14px;
    color: var(--color-text-primary);
    display: block;
    margin-bottom: 12px;
  }

  .section-label.with-underline {
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-bg-panel);
  }

  .row-section .section-label {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .search-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-wrapper {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 12px 48px 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--color-text-dark);
    background: var(--color-white);
    box-sizing: border-box;
  }

  .search-input::placeholder {
    color: var(--color-text-light);
  }

  .search-go-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .search-go-btn img {
    width: 24px;
    height: 24px;
    filter: brightness(0) saturate(100%) invert(50%);
  }

  .pushpin-btn {
    width: 48px;
    height: 48px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
  }

  .pushpin-btn img {
    width: 28px;
    height: 28px;
    filter: brightness(0) saturate(100%) invert(50%);
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
  }

  .search-result-item {
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    font-size: 13px;
    color: var(--color-text-dark);
    background: none;
    border: none;
    border-bottom: 1px solid var(--color-bg-panel);
    cursor: pointer;
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .search-result-item:hover {
    background: var(--color-bg-panel);
  }

  .preview-map-container {
    width: 240px;
    height: 240px;
    margin: 0 auto;
    border: 4px solid var(--color-brand);
    border-radius: var(--radius-md);
    background: var(--color-bg-panel);
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 0 12px 0;
    background: none;
    border: none;
    border-bottom: 1px solid var(--color-bg-panel);
    cursor: pointer;
  }

  .dropdown-label {
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .dropdown-chevron {
    width: 20px;
    height: 20px;
    filter: brightness(0) saturate(100%) invert(50%);
  }

  .base-style-grid {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .base-style-thumb {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0;
    background: transparent;
    border: 2px solid var(--color-bg-panel);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color 0.2s;
    overflow: hidden;
  }

  .base-style-thumb.active {
    border-color: var(--color-text-primary);
  }

  .thumb-preview {
    width: 100%;
    aspect-ratio: 1;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .thumb-preview[data-style='positron-nolabels'] {
    background-image: url('https://a.basemaps.cartocdn.com/light_nolabels/2/2/0.png');
  }

  .thumb-preview[data-style='watercolor'] {
    background-image: url('https://tiles.stadiamaps.com/tiles/stamen_watercolor/2/2/0.jpg');
  }

  .thumb-preview[data-style='voyager'] {
    background-image: url('https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/2/2/0.png');
  }

  .position-row {
    display: flex;
    gap: 12px;
  }

  .position-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    padding: 0;
    transition: all 0.2s;
  }

  .position-btn img {
    width: 28px;
    height: 28px;
    filter: brightness(0) saturate(100%) invert(60%);
  }

  .position-btn.active img {
    filter: brightness(0) saturate(100%) invert(22%) sepia(51%) saturate(1886%) hue-rotate(247deg) brightness(102%) contrast(102%);
  }

  .slider-wrapper {
    position: relative;
    width: 50%;
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg-panel);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-text-primary);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-text-primary);
    cursor: pointer;
    border: none;
  }

  .slider-feedback {
    position: absolute;
    right: 0;
    top: -24px;
    font-size: 12px;
    color: var(--color-text-dark);
    background-color: var(--color-bg-panel);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .color-picker {
    display: flex;
    justify-content: space-between;
  }

  .color-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .color-btn.white {
    border-color: var(--color-text-light);
  }

  .color-btn.active {
    transform: scale(1.05);
    box-shadow: 0 0 0 3px var(--color-white), 0 0 0 5px currentColor;
  }

  .color-btn.white.active {
    box-shadow: 0 0 0 3px var(--color-white), 0 0 0 5px var(--color-text-light);
  }

  :global(.spotlight-marker) {
    background: transparent !important;
    border: none !important;
  }
</style>
