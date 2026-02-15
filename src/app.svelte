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
    insetConfig,
  } from './lib/stores';
  import { loadSavedMaps, saveMap, loadWorkingState, saveWorkingState, clearWorkingState, promoteWorkingStateToSavedMap } from './lib/services/persistence';
  import { exportMap, generateThumbnail } from './lib/services/export';
  import { getUserLocation } from './lib/services/geolocation';
  import MapContainer from './lib/components/MapContainer.svelte';
  import RatioSelector from './lib/components/RatioSelector.svelte';
  import BaseMapSelector from './lib/components/BaseMapSelector.svelte';
  import PinEditor from './lib/components/PinEditor.svelte';
  import SavedTab from './lib/components/SavedTab.svelte';
  import InsetMapEditor from './lib/components/InsetMapEditor.svelte';

  let currentTab: 'create' | 'saved' = 'create';
  let currentMarkers: any[] = [];
  let pinEditorRef: PinEditor;
  let currentFormat: string = 'square';
  let currentBaseMap: string = 'positron';
  let currentCenter: any = { lat: 6.5244, lng: 3.3792 };
  let currentZoom: number = 12;
  let showNewMapModal = false;
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  const AUTO_SAVE_DEBOUNCE = 2000; // 2 seconds

  $: activeTab.subscribe((tab) => (currentTab = tab));
  $: markers.subscribe((m) => {
    currentMarkers = m;
    // Trigger auto-save when markers change (debounced)
    if (m.length > 0) {
      triggerAutoSave();
    }
  });
  $: selectedFormat.subscribe((f) => (currentFormat = f));
  $: selectedBaseMap.subscribe((b) => (currentBaseMap = b));
  $: mapCenter.subscribe((c) => (currentCenter = c));
  $: mapZoom.subscribe((z) => (currentZoom = z));

  $: hasPins = currentMarkers.length > 0;

  function triggerAutoSave() {
    if (currentMarkers.length === 0) return; // Only auto-save if there are pins

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
      saveWorkingState({
        markers: currentMarkers,
        selectedFormat: currentFormat as any,
        selectedBaseMap: currentBaseMap as any,
        mapCenter: currentCenter,
        mapZoom: currentZoom,
        lastAutoSave: Date.now(),
      });
      console.log('Auto-saved working state');
    }, AUTO_SAVE_DEBOUNCE);
  }

  function saveAndPromozeWorkingStateIfNeeded() {
    if (currentMarkers.length > 0) {
      // If there's work in progress, promote it to a saved map before clearing
      const workingState = {
        markers: currentMarkers,
        selectedFormat: currentFormat as any,
        selectedBaseMap: currentBaseMap as any,
        mapCenter: currentCenter,
        mapZoom: currentZoom,
        lastAutoSave: Date.now(),
      };
      const savedMap = promoteWorkingStateToSavedMap(workingState);
      if (savedMap) {
        saveMap(savedMap);
        console.log('Promoted working state to saved map:', savedMap.name);
      }
      clearWorkingState();
    }
  }

  onMount(async () => {
    loadSavedMaps();

    // Detect user's current location and update map center
    const userLocation = await getUserLocation();
    mapCenter.set(userLocation);

    // Update inset map to show regional view of user's location
    insetConfig.update((config) => ({
      ...config,
      center: userLocation,
      spotlight: {
        ...config.spotlight,
        lat: userLocation.lat,
        lng: userLocation.lng,
      },
    }));

    // On app launch, if there's unsaved work from last session, promote it to saved maps
    const workingState = loadWorkingState();
    if (workingState && workingState.markers.length > 0) {
      const savedMap = promoteWorkingStateToSavedMap(workingState);
      if (savedMap) {
        saveMap(savedMap);
        console.log('Restored previous session work as saved map:', savedMap.name);
      }
      clearWorkingState();
    }

    // Setup beforeunload to save any unsaved work
    const handleBeforeUnload = () => {
      if (currentMarkers.length > 0) {
        saveWorkingState({
          markers: currentMarkers,
          selectedFormat: currentFormat as any,
          selectedBaseMap: currentBaseMap as any,
          mapCenter: currentCenter,
          mapZoom: currentZoom,
          lastAutoSave: Date.now(),
        });
      }
    };

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
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('marker-click', handleMarkerClick);
      window.removeEventListener('edit-map', handleEditMap);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
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

  async function confirmNewMap() {
    // First, save any auto-saved work from previous state (if it has markers)
    saveAndPromozeWorkingStateIfNeeded();

    // Generate map name: cycle through "Map 1" to "Map 5"
    const savedMaps = loadSavedMaps();
    const nextNumber = (savedMaps.length % 5) + 1;
    
    // Generate thumbnail from map container
    let thumbnail = '';
    try {
      console.log('Generating thumbnail...');
      thumbnail = await generateThumbnail('#map-container');
      console.log('Thumbnail generated:', thumbnail.substring(0, 50) + '...');
      if (thumbnail.startsWith('data:image/png;base64,iVBORw0K')) {
        console.warn('Thumbnail is placeholder - map may not have rendered');
      }
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
    }

    const mapData: SavedMap = {
      id: Date.now().toString(),
      name: `Map ${nextNumber}`,
      createdAt: Date.now(),
      state: {
        markers: $markers,
        selectedFormat: currentFormat as any,
        selectedBaseMap: currentBaseMap as any,
        mapCenter: currentCenter,
        mapZoom: currentZoom,
      },
      pinCount: $markers.length,
      thumbnail,
    };
    console.log('Saving map:', mapData.name, 'with thumbnail length:', thumbnail.length);
    saveMap(mapData);
    clearWorkingState(); // Clear working state since we just saved this map
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
          <span class="add-pin-icon"></span>
        </button>

        <InsetMapEditor />

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
    border-bottom: 1px solid #999999;
    background-color: var(--color-white);
  }

  .logo-container {
    display: flex;
    justify-content: center;
  }

  .logo {
    height: 36px;
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
    margin-top: var(--spacing-sm);
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
    display: block;
    background-color: var(--color-brand);
    -webkit-mask-image: url('/icons/icon-newpin.svg');
    mask-image: url('/icons/icon-newpin.svg');
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-md);
  }

  .action-button {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--color-brand);
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
