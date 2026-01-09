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

  let currentTab: 'create' | 'saved' = 'create';
  let currentMarkers: any[] = [];
  let pinEditorRef: PinEditor;
  let currentFormat: string = 'square';
  let currentBaseMap: string = 'positron';
  let currentCenter: any = { lat: 6.5244, lng: 3.3792 };
  let currentZoom: number = 12;
  let showNewMapModal = false;
  let insetMapEnabled = false;

  $: activeTab.subscribe((tab) => (currentTab = tab));
  $: markers.subscribe((m) => (currentMarkers = m));
  $: selectedFormat.subscribe((f) => (currentFormat = f));
  $: selectedBaseMap.subscribe((b) => (currentBaseMap = b));
  $: mapCenter.subscribe((c) => (currentCenter = c));
  $: mapZoom.subscribe((z) => (currentZoom = z));

  $: hasPins = currentMarkers.length > 0;

  onMount(() => {
    loadSavedMaps();

    const handleMarkerClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const markerId = customEvent.detail.markerId;
      const pin = $markers.find((m) => m.id === markerId);
      if (pin && pinEditorRef) {
        pinEditorRef.initPin(pin);
      }
    };

    const handleEditMap = () => {
      activeTab.set('create');
    };

    window.addEventListener('marker-click', handleMarkerClick);
    window.addEventListener('edit-map', handleEditMap);

    return () => {
      window.removeEventListener('marker-click', handleMarkerClick);
      window.removeEventListener('edit-map', handleEditMap);
    };
  });

  function openAddPin() {
    if (pinEditorRef) {
      pinEditorRef.initPin();
    }
  }

  async function handleExport() {
    await exportMap('#map-container', currentFormat as any, `mapflam_${currentFormat}_${new Date().toISOString().split('T')[0]}.png`);
  }

  function handleNewMapClick() {
    showNewMapModal = true;
  }

  function confirmNewMap() {
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
    markers.set([]);
    showNewMapModal = false;
  }

  function cancelNewMap() {
    showNewMapModal = false;
  }
</script>

<div class="app-container">
  <header class="app-header">
    <div class="logo-container">
      <img src="/icons/logotype-mapflam-purple-trs.png" alt="MapFlam" class="logo" />
    </div>
  </header>

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

  <main class="main-content">
    {#if currentTab === 'create'}
      <div class="create-tab">
        <div class="controls-row">
          <BaseMapSelector />
          <RatioSelector />
        </div>

        <div class="map-section" id="map-container">
          <MapContainer />
        </div>

        <PinEditor bind:this={pinEditorRef} />

        <button class="add-pin-button" on:click={openAddPin} aria-label="Add new pin">
          <img src="/icons/icon-newpin.svg" alt="" class="add-pin-icon" />
        </button>

        <div class="inset-toggle-row">
          <span class="inset-label">Inset map</span>
          <button 
            class="toggle-switch" 
            class:active={insetMapEnabled}
            on:click={() => insetMapEnabled = !insetMapEnabled}
            aria-label="Toggle inset map"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        <div class="action-buttons">
          <button 
            class="action-button" 
            class:disabled={!hasPins}
            disabled={!hasPins}
            on:click={handleExport}
          >
            Download
          </button>
          <button 
            class="action-button" 
            class:disabled={!hasPins}
            disabled={!hasPins}
            on:click={handleNewMapClick}
          >
            New map
          </button>
        </div>
      </div>
    {:else if currentTab === 'saved'}
      <SavedTab />
    {/if}
  </main>

  {#if showNewMapModal}
    <div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" on:click={cancelNewMap} on:keydown={(e) => e.key === 'Escape' && cancelNewMap()}>
      <div class="modal-card" on:click|stopPropagation>
        <p class="modal-text">Your maps (up to five)<br/>are auto-saved for 30 days</p>
        <div class="modal-actions">
          <button class="modal-cancel" on:click={cancelNewMap}>Cancel</button>
          <button class="modal-confirm" on:click={confirmNewMap}>Start new map</button>
        </div>
      </div>
    </div>
  {/if}
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
    min-height: 100vh;
    max-width: 480px;
    margin: 0 auto;
    background-color: var(--color-white);
    box-shadow: -20px 0 40px rgba(0, 0, 0, 0.03), 20px 0 40px rgba(0, 0, 0, 0.03);
  }

  .app-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-white);
  }

  .logo-container {
    display: flex;
    justify-content: center;
  }

  .logo {
    height: 40px;
    width: auto;
  }

  .tab-navigation {
    display: flex;
    gap: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-md) 0;
    background-color: var(--color-white);
  }

  .tab-button {
    position: relative;
    flex: 0 0 auto;
    padding: var(--spacing-sm) 0;
    border: none;
    background-color: transparent;
    color: var(--color-text-primary);
    font-size: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .tab-button:hover {
    color: var(--color-brand);
  }

  .tab-button.active {
    color: var(--color-brand);
  }

  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--color-brand);
    border-radius: 2px;
  }

  .main-content {
    flex: 1;
    padding: var(--spacing-md);
    overflow-y: auto;
  }

  .create-tab {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .controls-row {
    display: flex;
    align-items: stretch;
    gap: 12px;
  }

  .map-section {
    width: 100%;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid #ddd;
    background-color: #f5f5f5;
    position: relative;
    contain: layout;
  }

  .add-pin-button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: var(--spacing-md) auto;
    transition: all 200ms ease;
    padding: 0;
  }

  .add-pin-button:hover {
    opacity: 0.8;
  }

  .add-pin-button:active {
    transform: scale(0.95);
  }

  .add-pin-icon {
    width: 56px;
    height: 56px;
    filter: brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(89%);
  }

  .inset-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid #ddd;
  }

  .inset-label {
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .toggle-switch {
    width: 48px;
    height: 28px;
    border-radius: 14px;
    border: none;
    background-color: #ccc;
    position: relative;
    cursor: pointer;
    transition: background-color 200ms ease;
    padding: 0;
  }

  .toggle-switch.active {
    background-color: var(--color-brand);
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--color-white);
    transition: transform 200ms ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active .toggle-knob {
    transform: translateX(20px);
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-md);
  }

  .action-button {
    flex: 1;
    padding: var(--spacing-md);
    border: 2px solid var(--color-brand);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-brand);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .action-button:hover:not(.disabled) {
    background-color: var(--color-brand-light);
  }

  .action-button.disabled {
    border-color: var(--color-text-light);
    color: var(--color-text-light);
    cursor: not-allowed;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-card {
    background-color: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
    max-width: 300px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    text-align: center;
  }

  .modal-text {
    margin: 0 0 var(--spacing-lg) 0;
    font-size: 14px;
    color: var(--color-text-dark);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
  }

  .modal-cancel {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    background: none;
    color: var(--color-text-primary);
    font-size: 14px;
    cursor: pointer;
  }

  .modal-confirm {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    background: none;
    color: var(--color-text-dark);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
