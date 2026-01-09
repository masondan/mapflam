<script lang="ts">
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount, onDestroy } from 'svelte';
  import { leafletMap, mapCenter, mapZoom, markers, selectedBaseMap, selectedFormat, insetConfig } from '../stores';
  import { BASE_MAP_TILES, SIZE_MAP, LABEL_SIZES, ICON_FILES, INSET_MAP_TILES, INSET_SIZE_MAP } from '../types';
  import type { Marker, MapFormat, BaseMap, InsetConfig } from '../types';

  let mapContainer: HTMLDivElement;
  let insetContainer: HTMLDivElement;
  let map: L.Map | null = null;
  let insetMap: L.Map | null = null;
  let insetTileLayer: L.TileLayer | null = null;
  let insetSpotlightMarker: L.Marker | null = null;
  let leafletMarkers: Map<string, L.Marker> = new Map();
  let panZoomTimeout: ReturnType<typeof setTimeout>;
  let currentFormat: MapFormat = 'square';
  let currentInsetConfig: InsetConfig;
  let previousInsetSize: string | null = null;

  const SPOTLIGHT_SIZE_MAP: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 20,
    2: 30,
    3: 40,
    4: 50,
    5: 60,
  };

  const unsubscribeFormat = selectedFormat.subscribe((f) => {
    currentFormat = f;
    if (map) {
      setTimeout(() => map?.invalidateSize(), 100);
    }
  });

  onMount(() => {
    let initialCenter = { lat: 6.5244, lng: 3.3792 };
    let initialZoom = 12;
    
    const unsubCenter = mapCenter.subscribe((c) => {
      initialCenter = c;
    });
    unsubCenter();
    
    const unsubZoom = mapZoom.subscribe((z) => {
      initialZoom = z;
    });
    unsubZoom();
    
    map = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: true,
    }).setView([initialCenter.lat, initialCenter.lng], initialZoom);

    let initialBaseMap: BaseMap = 'positron';
    const unsubBase = selectedBaseMap.subscribe((b) => {
      initialBaseMap = b;
    });
    unsubBase();
    
    updateTileLayer(initialBaseMap);

    leafletMap.set(map);

    map.on('moveend', () => {
      clearTimeout(panZoomTimeout);
      panZoomTimeout = setTimeout(() => {
        if (map) {
          const center = map.getCenter();
          mapCenter.set({ lat: center.lat, lng: center.lng });
          mapZoom.set(map.getZoom());
        }
      }, 300);
    });

    const unsubscribeMarkers = markers.subscribe(($markers) => {
      updateMapMarkers($markers);
    });

    const unsubscribeBaseMap = selectedBaseMap.subscribe(($baseMap) => {
      if (map) updateTileLayer($baseMap);
    });

    const unsubscribeInset = insetConfig.subscribe((config) => {
      currentInsetConfig = config;
      if (config.enabled && insetContainer && !insetMap) {
        setTimeout(initInsetMap, 50);
      } else if (!config.enabled && insetMap) {
        destroyInsetMap();
      } else if (insetMap) {
        updateInsetMap(config);
      }
    });

    return () => {
      unsubscribeMarkers();
      unsubscribeBaseMap();
      unsubscribeFormat();
      unsubscribeInset();
      destroyInsetMap();
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

  function initInsetMap() {
    if (!insetContainer || insetMap) return;

    insetMap = L.map(insetContainer, {
      center: [currentInsetConfig.center.lat, currentInsetConfig.center.lng],
      zoom: currentInsetConfig.zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
    });

    previousInsetSize = currentInsetConfig.size;
    updateInsetTileLayer(currentInsetConfig.baseMap);
    updateInsetSpotlight(currentInsetConfig);
  }

  function destroyInsetMap() {
    if (insetMap) {
      insetMap.remove();
      insetMap = null;
      insetTileLayer = null;
      insetSpotlightMarker = null;
    }
  }

  function updateInsetMap(config: InsetConfig) {
    if (!insetMap) return;
    
    // Check if size changed and invalidate to resize the map
    if (previousInsetSize !== null && previousInsetSize !== config.size) {
      setTimeout(() => {
        if (insetMap) {
          insetMap.invalidateSize();
        }
      }, 50);
    }
    previousInsetSize = config.size;
    
    insetMap.setView([config.center.lat, config.center.lng], config.zoom, { animate: false });
    updateInsetTileLayer(config.baseMap);
    updateInsetSpotlight(config);
  }

  function createSpotlightIcon(color: string, size: number): L.DivIcon {
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

  function updateInsetSpotlight(config: InsetConfig) {
    if (!insetMap) return;

    if (!config.spotlight.enabled) {
      if (insetSpotlightMarker) {
        insetMap.removeLayer(insetSpotlightMarker);
        insetSpotlightMarker = null;
      }
      return;
    }

    const size = SPOTLIGHT_SIZE_MAP[config.spotlight.size];
    const icon = createSpotlightIcon(config.spotlight.color, size);

    if (insetSpotlightMarker) {
      insetSpotlightMarker.setLatLng([config.spotlight.lat, config.spotlight.lng]);
      insetSpotlightMarker.setIcon(icon);
    } else {
      insetSpotlightMarker = L.marker([config.spotlight.lat, config.spotlight.lng], {
        icon,
        draggable: false,
        interactive: false,
      }).addTo(insetMap);
    }
  }

  function updateInsetTileLayer(baseMap: string) {
    if (!insetMap) return;
    if (insetTileLayer) {
      insetMap.removeLayer(insetTileLayer);
    }
    const tiles = INSET_MAP_TILES[baseMap as keyof typeof INSET_MAP_TILES];
    if (tiles) {
      insetTileLayer = L.tileLayer(tiles.url, {
        attribution: '',
        maxZoom: 19,
      }).addTo(insetMap);
    }
  }

  function updateTileLayer(baseMap: BaseMap): void {
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map!.removeLayer(layer);
      }
    });

    const tileConfig = BASE_MAP_TILES[baseMap];
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);
  }

  function updateMapMarkers(markerList: Marker[]): void {
    if (!map) return;

    leafletMarkers.forEach((leafletMarker, id) => {
      if (!markerList.find((m) => m.id === id)) {
        map!.removeLayer(leafletMarker);
        leafletMarkers.delete(id);
      }
    });

    markerList.forEach((marker) => {
      if (leafletMarkers.has(marker.id)) {
        const leafletMarker = leafletMarkers.get(marker.id)!;
        leafletMarker.setLatLng([marker.lat, marker.lng]);
        
        const icon = L.divIcon({
          html: createMarkerHTML(marker),
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
          className: 'custom-marker',
        });
        leafletMarker.setIcon(icon);
      } else {
        const leafletMarker = createLeafletMarker(marker);
        leafletMarkers.set(marker.id, leafletMarker);
        if (map) {
          leafletMarker.addTo(map);
        }
      }
    });
  }

  function createLeafletMarker(marker: Marker): L.Marker {
    const icon = L.divIcon({
      html: createMarkerHTML(marker),
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
      className: 'custom-marker',
    });

    const leafletMarker = L.marker([marker.lat, marker.lng], { icon, draggable: true });

    leafletMarker.on('dragend', () => {
      const latlng = leafletMarker.getLatLng();
      markers.update((markerList) => {
        const idx = markerList.findIndex((m) => m.id === marker.id);
        if (idx >= 0) {
          markerList[idx].lat = latlng.lat;
          markerList[idx].lng = latlng.lng;
        }
        return markerList;
      });
    });

    leafletMarker.on('click', () => {
      const event = new CustomEvent('marker-click', { detail: { markerId: marker.id } });
      window.dispatchEvent(event);
    });

    return leafletMarker;
  }

  function createMarkerHTML(marker: Marker): string {
    const scale = SIZE_MAP[marker.size] || 1;
    const opacity = marker.opacity / 100;
    const iconFileName = ICON_FILES[marker.icon] || 'icon-pin1-fill.svg';

    const iconSvg = `
      <div style="
        width: ${24 * scale}px;
        height: ${24 * scale}px;
        opacity: ${opacity};
        background-image: url('/icons/${iconFileName}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        filter: drop-shadow(0px 0px 0px ${marker.color});
      "></div>
    `;

    const labelHTML = marker.label && marker.label.text
      ? `<div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%) translateX(${marker.label.offsetX}px) translateY(calc(-100% - 2px)) translateY(${marker.label.offsetY}px); width: max-content; max-width: 320px; box-sizing: border-box; background-color: ${marker.label.bgColor}; opacity: ${marker.label.bgOpacity / 100}; padding: 4px 8px; border-radius: 4px; font-size: ${LABEL_SIZES[marker.label.size]}; font-weight: bold; font-family: 'Inter', sans-serif; white-space: pre-wrap; text-align: center; line-height: 1.15; color: ${marker.label.bgColor === '#FFFFFF' ? '#333333' : '#FFFFFF'}; pointer-events: none;">${marker.label.text.trim()}</div>`
      : '';

    return `<div style="position: relative; overflow: visible;">${iconSvg}${labelHTML}</div>`;
  }

  function getAspectRatio(format: MapFormat): string {
    switch (format) {
      case '9:16':
        return '9 / 16';
      case '16:9':
        return '16 / 9';
      case 'square':
      default:
        return '1 / 1';
    }
  }
</script>

<div class="map-outer" style="aspect-ratio: {getAspectRatio(currentFormat)};">
  <div
    bind:this={mapContainer}
    class="map-wrapper"
  ></div>
  
  {#if currentInsetConfig?.enabled}
    <div
      bind:this={insetContainer}
      class="inset-overlay"
      class:top-left={currentInsetConfig.position === 'top-left'}
      class:top-right={currentInsetConfig.position === 'top-right'}
      class:bottom-left={currentInsetConfig.position === 'bottom-left'}
      class:bottom-right={currentInsetConfig.position === 'bottom-right'}
      style="
        width: {INSET_SIZE_MAP[currentInsetConfig.size]}px;
        height: {INSET_SIZE_MAP[currentInsetConfig.size]}px;
        border-color: {currentInsetConfig.borderColor};
      "
    ></div>
  {/if}
</div>

<style>
  .map-outer {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .map-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .inset-overlay {
    position: absolute;
    border: 4px solid;
    border-radius: var(--radius-md, 8px);
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .inset-overlay.top-left {
    top: 12px;
    left: 12px;
  }

  .inset-overlay.top-right {
    top: 12px;
    right: 12px;
  }

  .inset-overlay.bottom-left {
    bottom: 12px;
    left: 12px;
  }

  .inset-overlay.bottom-right {
    bottom: 12px;
    right: 12px;
  }

  :global(.leaflet-container) {
    width: 100%;
    height: 100%;
    background-color: #e0e0e0;
    font-family: 'Inter', sans-serif;
  }

  :global(.custom-marker) {
    background: transparent;
    border: none;
    overflow: visible !important;
  }

  :global(.leaflet-control-attribution) {
    font-size: 9px;
    background-color: rgba(255, 255, 255, 0.7) !important;
  }

  :global(.spotlight-marker) {
    background: transparent !important;
    border: none !important;
  }
</style>
