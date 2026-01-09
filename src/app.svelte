<script lang="ts">
  import { onMount } from 'svelte';
  import type { SavedMap } from './lib/types';
  import {
    activeTab,
    markers,
    selectedFormat,
    selectedBaseMap,
    mapCenter,
    mapZoom,
  } from './lib/stores';
  import { loadSavedMaps, saveMap } from './lib/services/persistence';
  import { exportMap } from './lib/services/export';
  import MapContainer from './lib/components/MapContainer.svelte';
  import RatioSelector from './lib/components/RatioSelector.svelte';
  import BaseMapSelector from './lib/components/BaseMapSelector.svelte';
  import PinEditor from './lib/components/PinEditor.svelte';
  import SavedTab from './lib/components/SavedTab.svelte';

  let autoSaveTimeout: ReturnType<typeof setTimeout>;
  let currentTab: 'create' | 'saved' = 'create';
  let currentMarkers: any[] = [];
  let pinEditorRef: PinEditor;
  let currentFormat: string = 'square';
  let currentBaseMap: string = 'positron';
  let currentCenter: any = { lat: 6.5244, lng: 3.3792 };
  let currentZoom: number = 12;

  // Subscribe to stores
  $: activeTab.subscribe((tab) => (currentTab = tab));
  $: markers.subscribe((m) => (currentMarkers = m));
  $: selectedFormat.subscribe((f) => (currentFormat = f));
  $: selectedBaseMap.subscribe((b) => (currentBaseMap = b));
  $: mapCenter.subscribe((c) => (currentCenter = c));
  $: mapZoom.subscribe((z) => (currentZoom = z));

  onMount(() => {
    // Load saved maps on app start
    loadSavedMaps();

    // Initialize auto-save debounce
    const unsubscribe = markers.subscribe(() => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        // Auto-save will be triggered by Svelte's reactive updates
        // The actual persistence is handled in component-level saves
      }, 1000);
    });

    // Handle marker click (edit)
    const handleMarkerClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const markerId = customEvent.detail.markerId;
      const pin = $markers.find((m) => m.id === markerId);
      if (pin && pinEditorRef) {
        pinEditorRef.initPin(pin);
      }
    };

    window.addEventListener('marker-click', handleMarkerClick);

    return () => {
      unsubscribe();
      window.removeEventListener('marker-click', handleMarkerClick);
    };
  });

  function openAddPin() {
    if (pinEditorRef) {
      pinEditorRef.initPin();
    }
  }

  async function handleExport() {
    await exportMap('#map', currentFormat as any, `mapflam_${currentFormat}_${new Date().toISOString().split('T')[0]}.png`);
  }

  function handleNewMap() {
    if (confirm('Save current map before creating a new one?')) {
      // Save current state
      const mapData: SavedMap = {
        id: Date.now().toString(),
        name: `Map ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        state: {
          markers: $markers,
          selectedFormat: currentFormat as any,
          selectedBaseMap: currentBaseMap as any,
          mapCenter: currentCenter,
          mapZoom: currentZoom,
        },
        pinCount: $markers.length,
        thumbnail: '',
      };
      saveMap(mapData);
    }
    // Reset
    markers.set([]);
  }
</script>

<div class="app-container">
  <header class="app-header">
    <h1>MapFlam</h1>
    <nav class="tab-navigation">
      <button
        class="tab-button"
        class:active={currentTab === 'create'}
        on:click={() => activeTab.set('create')}
      >
        Create
      </button>
      <button
        class="tab-button"
        class:active={currentTab === 'saved'}
        on:click={() => activeTab.set('saved')}
      >
        Saved
      </button>
    </nav>
  </header>

  <main class="main-content">
    {#if currentTab === 'create'}
      <div class="create-tab">
        <div class="map-section">
          <MapContainer />
        </div>

        <div class="controls-section">
          <fieldset class="control-group">
            <legend class="control-label">Map Format</legend>
            <RatioSelector />
          </fieldset>

          <div class="control-group">
            <span class="control-label">Base Map</span>
            <BaseMapSelector />
          </div>

          <div class="control-group">
            <button class="primary-button" on:click={openAddPin}>+ Add Pin</button>
          </div>

          {#if currentMarkers.length > 0}
            <div class="export-controls">
              <button class="export-button" on:click={handleExport}>⬇ Download PNG</button>
              <button class="secondary-button" on:click={handleNewMap}>→ New Map</button>
            </div>

            <div class="pin-list">
              <h3>Pins ({currentMarkers.length})</h3>
              {#each currentMarkers as marker (marker.id)}
                <div class="pin-item">
                  <span>{marker.name}</span>
                  <button class="icon-button" on:click={() => pinEditorRef.initPin(marker)}>Edit</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {:else if currentTab === 'saved'}
      <SavedTab />
    {/if}
  </main>

  <PinEditor bind:this={pinEditorRef} />
</div>

<style>
  :global(:root) {
    --color-brand: #5422b0;
    --color-brand-light: #f0e6f7;
    --color-text-primary: #777777;
    --color-text-dark: #333333;
    --color-text-light: #999999;
    --color-bg-panel: #efefef;
    --color-white: #ffffff;
    --color-border: #777777;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --radius-md: 8px;
    --color-picker-0: #5422b0;
    --color-picker-1: #02441f;
    --color-picker-2: #004269;
    --color-picker-3: #ab0000;
    --color-picker-4: #000000;
    --color-picker-5: #ffffff;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: var(--color-white);
    color: var(--color-text-primary);
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 480px;
    margin: 0 auto;
    background-color: var(--color-white);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .app-header {
    padding: var(--spacing-md);
    border-bottom: 2px solid var(--color-border);
    background-color: var(--color-white);
  }

  .app-header h1 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .tab-navigation {
    display: flex;
    gap: var(--spacing-md);
  }

  .tab-button {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-panel);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .tab-button:hover {
    background-color: var(--color-brand-light);
  }

  .tab-button.active {
    background-color: var(--color-brand);
    color: var(--color-white);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
  }

  .create-tab {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .map-section {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .control-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .primary-button {
    padding: var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-brand);
    color: var(--color-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .primary-button:hover {
    background-color: #4318a3;
  }

  .primary-button:active {
    transform: scale(0.98);
  }

  .pin-list {
    padding: var(--spacing-md);
    background-color: var(--color-bg-panel);
    border-radius: var(--radius-md);
  }

  .pin-list h3 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .pin-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    background-color: var(--color-white);
    border-radius: 4px;
  }

  .pin-item:last-child {
    margin-bottom: 0;
  }

  .icon-button {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background-color: var(--color-brand-light);
    color: var(--color-brand);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .icon-button:hover {
    background-color: var(--color-brand);
    color: var(--color-white);
  }

  .export-controls {
    display: flex;
    gap: var(--spacing-md);
    flex-direction: column;
  }

  .export-button {
    padding: var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: #02441f;
    color: var(--color-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .export-button:hover {
    background-color: #1a5c37;
  }

  .secondary-button {
    padding: var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-panel);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .secondary-button:hover {
    background-color: #d9d9d9;
  }
</style>
