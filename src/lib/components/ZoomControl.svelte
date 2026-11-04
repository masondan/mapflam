<script lang="ts">
  import type L from 'leaflet';

  export let map: L.Map | null = null;

  let canZoomIn = true;
  let canZoomOut = true;
  let attachedMap: L.Map | null = null;

  function updateZoomState() {
    if (!map) return;
    const zoom = map.getZoom();
    const maxZoom = map.getMaxZoom();
    const minZoom = map.getMinZoom();
    canZoomIn = zoom < maxZoom;
    canZoomOut = zoom > minZoom;
  }

  // Attach/detach zoomend listener whenever the map instance changes
  $: if (map !== attachedMap) {
    if (attachedMap) {
      attachedMap.off('zoomend', updateZoomState);
    }
    attachedMap = map;
    if (map) {
      updateZoomState();
      map.on('zoomend', updateZoomState);
    } else {
      canZoomIn = true;
      canZoomOut = true;
    }
  }

  function zoomIn() {
    map?.zoomIn();
  }

  function zoomOut() {
    map?.zoomOut();
  }
</script>

<div class="zoom-controls">
  <button
    type="button"
    class="zoom-btn"
    on:click={zoomOut}
    disabled={!map || !canZoomOut}
    aria-label="Zoom out"
  >
    &minus;
  </button>
  <button
    type="button"
    class="zoom-btn"
    on:click={zoomIn}
    disabled={!map || !canZoomIn}
    aria-label="Zoom in"
  >
    +
  </button>
</div>

<style>
  .zoom-controls {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .zoom-btn {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1.5px solid var(--color-text-primary);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 200ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .zoom-btn:active:not(:disabled) {
    transform: scale(0.9);
  }

  .zoom-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
