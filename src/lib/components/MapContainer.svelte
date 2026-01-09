<script lang="ts">
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount, onDestroy } from 'svelte';
  import { leafletMap, mapCenter, mapZoom, markers, selectedBaseMap, selectedFormat } from '../stores';
  import { BASE_MAP_TILES, SIZE_MAP, LABEL_SIZES, ICON_FILES } from '../types';
  import type { Marker, MapFormat, BaseMap } from '../types';

  let mapContainer: HTMLDivElement;
  let map: L.Map | null = null;
  let leafletMarkers: Map<string, L.Marker> = new Map();
  let panZoomTimeout: ReturnType<typeof setTimeout>;
  let currentFormat: MapFormat = 'square';

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

    return () => {
      unsubscribeMarkers();
      unsubscribeBaseMap();
      unsubscribeFormat();
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

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

<div
  bind:this={mapContainer}
  class="map-wrapper"
  style="aspect-ratio: {getAspectRatio(currentFormat)};"
></div>

<style>
  .map-wrapper {
    width: 100%;
    overflow: hidden;
    position: relative;
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
</style>
