<script lang="ts">
  import L from 'leaflet';
  import { onMount } from 'svelte';
  import { leafletMap, mapCenter, mapZoom, markers, selectedBaseMap, selectedFormat } from '../stores';
  import { BASE_MAP_TILES, SIZE_MAP, LABEL_SIZES } from '../types';
  import type { Marker, MapFormat, BaseMap } from '../types';

  let mapContainer: HTMLDivElement;
  let map: L.Map | null = null;
  let leafletMarkers: Map<string, L.Marker> = new Map();
  let panZoomTimeout: ReturnType<typeof setTimeout>;

  // Responsive map dimensions are handled via CSS aspect-ratio in the DOM

  onMount(() => {
    // Initialize Leaflet map
    map = L.map(mapContainer).setView([$mapCenter.lat, $mapCenter.lng], $mapZoom);

    // Set initial tile layer
    updateTileLayer($selectedBaseMap);

    // Store map instance in global state
    leafletMap.set(map);

    // Debounce pan/zoom events to avoid excessive store updates
    map.on('moveend', () => {
      clearTimeout(panZoomTimeout);
      panZoomTimeout = setTimeout(() => {
        const center = map!.getCenter();
        mapCenter.set({ lat: center.lat, lng: center.lng });
        mapZoom.set(map!.getZoom());
      }, 300);
    });

    // Sync markers with Leaflet layer
    const unsubscribeMarkers = markers.subscribe(($markers) => {
      updateMapMarkers($markers);
    });

    // Handle base map changes
    const unsubscribeBaseMap = selectedBaseMap.subscribe(($baseMap) => {
      if (map) updateTileLayer($baseMap);
    });

    // Handle map center/zoom changes from stores
    const unsubscribeCenter = mapCenter.subscribe(($center) => {
      if (map && map.getCenter().lat !== $center.lat) {
        map.setView([$center.lat, $center.lng], map.getZoom(), { animate: true });
      }
    });

    const unsubscribeZoom = mapZoom.subscribe(($newZoom) => {
      if (map && map.getZoom() !== $newZoom) {
        map.setZoom($newZoom);
      }
    });

    return () => {
      unsubscribeMarkers();
      unsubscribeBaseMap();
      unsubscribeCenter();
      unsubscribeZoom();
      if (map) {
        map.remove();
      }
    };
  });

  function updateTileLayer(baseMap: BaseMap): void {
    if (!map) return;

    // Remove existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map!.removeLayer(layer);
      }
    });

    // Add new tile layer
    const tileConfig = BASE_MAP_TILES[baseMap];
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);
  }

  function updateMapMarkers(markerList: Marker[]): void {
    if (!map) return;

    // Remove markers no longer in the list
    leafletMarkers.forEach((leafletMarker, id) => {
      if (!markerList.find((m) => m.id === id)) {
        map!.removeLayer(leafletMarker);
        leafletMarkers.delete(id);
      }
    });

    // Add or update markers
    markerList.forEach((marker) => {
      if (leafletMarkers.has(marker.id)) {
        // Update existing marker
        const leafletMarker = leafletMarkers.get(marker.id)!;
        leafletMarker.setLatLng([marker.lat, marker.lng]);
        
        // Re-render icon if any visual properties changed
        const icon = L.divIcon({
          html: createMarkerHTML(marker),
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
          className: 'custom-marker',
        });
        leafletMarker.setIcon(icon);
      } else {
        // Create new marker
        const leafletMarker = createLeafletMarker(marker);
        leafletMarkers.set(marker.id, leafletMarker);
        if (map) {
          leafletMarker.addTo(map);
        }
      }
    });
  }

  function createLeafletMarker(marker: Marker): L.Marker {
    // Create custom icon with SVG
    const icon = L.divIcon({
      html: createMarkerHTML(marker),
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
      className: 'custom-marker',
    });

    const leafletMarker = L.marker([marker.lat, marker.lng], { icon, draggable: true });

    // Handle drag events to update marker in store
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

    // Click to edit
    leafletMarker.on('click', () => {
      // Dispatch event for app to handle
      const event = new CustomEvent('marker-click', { detail: { markerId: marker.id } });
      window.dispatchEvent(event);
    });

    return leafletMarker;
  }

  function createMarkerHTML(marker: Marker): string {
    const scale = SIZE_MAP[marker.size] || 1;
    const opacity = marker.opacity / 100;

    // SVG icon with inline styling
    const iconSvg = `
      <svg width="${24 * scale}" height="${24 * scale}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 7.25 10 13 10 13s10-5.75 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="${marker.color}" />
      </svg>
    `;

    const labelHTML = marker.label
      ? `
        <div style="
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%) translateX(${marker.label.offsetX}px) translateY(${marker.label.offsetY}px);
          background-color: ${marker.label.bgColor};
          opacity: ${marker.label.bgOpacity / 100};
          padding: 4px 8px;
          border-radius: 4px;
          font-size: ${LABEL_SIZES[marker.label.size]};
          font-weight: bold;
          white-space: nowrap;
          color: ${marker.label.bgColor === '#FFFFFF' ? '#333333' : '#FFFFFF'};
        ">
          ${marker.label.text}
        </div>
      `
      : '';

    return `<div style="position: relative;">${iconSvg}${labelHTML}</div>`;
  }

  function updateMarkerPopup(leafletMarker: L.Marker, marker: Marker): void {
    // Update popup or tooltip if exists (for future phases)
  }

  // Helper to handle marker drag start (visual feedback)
  onMount(() => {
    // Add custom CSS for dragging state
    if (!document.getElementById('mapflam-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'mapflam-marker-styles';
      style.textContent = `
        .custom-marker {
          cursor: grab;
        }
        .custom-marker.dragging {
          cursor: grabbing;
        }
      `;
      document.head.appendChild(style);
    }
  });
</script>

<div
  bind:this={mapContainer}
  id="map"
></div>

<style>
  :global(#map) {
    background-color: #f0f0f0;
  }

  :global(.custom-marker) {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
</style>
