<script lang="ts">
  import { onMount } from 'svelte';
  import { markers, selectedFormat, selectedBaseMap, mapCenter, mapZoom } from '../stores';
  import { loadSavedMaps, deleteMap as deleteMapFromStorage, saveMap } from '../services/persistence';
  import { exportMap } from '../services/export';
  import type { SavedMap } from '../types';

  let savedMaps: SavedMap[] = [];
  let showMenu: Record<string, boolean> = {};
  let editingMapId: string | null = null;
  let editingMapName: string = '';

  onMount(() => {
    loadStoredMaps();
  });

  function loadStoredMaps() {
    const maps = loadSavedMaps();
    savedMaps = maps;
  }

  function handleEditMap(map: SavedMap) {
    // Load map state into create tab
    markers.set(map.state.markers);
    selectedFormat.set(map.state.selectedFormat);
    selectedBaseMap.set(map.state.selectedBaseMap);
    mapCenter.set(map.state.mapCenter);
    mapZoom.set(map.state.mapZoom);

    // Switch to create tab
    // Note: activeTab is imported but not used here, should dispatch to parent
    const event = new CustomEvent('edit-map', { detail: { map } });
    window.dispatchEvent(event);
  }

  function handleDelete(map: SavedMap) {
    if (confirm(`Delete "${map.name}"?`)) {
      deleteMapFromStorage(map.id);
      loadStoredMaps();
      showMenu[map.id] = false;
    }
  }

  async function handleDownload(map: SavedMap) {
    // This is tricky - we'd need to recreate the map on a hidden canvas
    // For now, show a message
    alert('Download feature requires map re-rendering. Coming in Phase 2.');
  }

  function startEditing(map: SavedMap) {
    editingMapId = map.id;
    editingMapName = map.name;
  }

  function cancelEditing() {
    editingMapId = null;
    editingMapName = '';
  }

  function saveMapName(map: SavedMap) {
    if (editingMapName.trim()) {
      map.name = editingMapName.trim();
      saveMap(map);
      loadStoredMaps();
    }
    cancelEditing();
  }

  function toggleMenu(mapId: string) {
    showMenu[mapId] = !showMenu[mapId];
  }
</script>

<div class="saved-tab">
  <h2>Saved Maps</h2>

  {#if savedMaps.length === 0}
    <div class="empty-state">
      <p>No saved maps yet.</p>
      <p>Create a map and click "New Map" to save it.</p>
    </div>
  {:else}
    <div class="map-list">
      {#each savedMaps as map (map.id)}
        <div class="map-card">
          <div class="map-info">
            {#if editingMapId === map.id}
              <div class="edit-form">
                <input
                  type="text"
                  value={editingMapName}
                  on:input={(e) => (editingMapName = e.currentTarget.value)}
                  class="map-name-input"
                />
                <div class="edit-buttons">
                  <button class="save-btn" on:click={() => saveMapName(map)}>Save</button>
                  <button class="cancel-btn" on:click={cancelEditing}>Cancel</button>
                </div>
              </div>
            {:else}
              <div class="map-header">
                <div class="map-name-wrapper">
                  <h3 class="map-name">{map.name}</h3>
                  <span class="pin-count">{map.state.markers.length} pin{map.state.markers.length !== 1 ? 's' : ''}</span>
                </div>
                <button class="menu-button" on:click={() => toggleMenu(map.id)}>⋯</button>
              </div>
              <p class="map-date">{new Date(map.createdAt).toLocaleDateString()}</p>
            {/if}
          </div>

          {#if showMenu[map.id]}
            <div class="menu-dropdown">
              <button class="menu-item edit" on:click={() => startEditing(map)}>✏️ Rename</button>
              <button class="menu-item load" on:click={() => handleEditMap(map)}>📂 Edit</button>
              <button class="menu-item delete" on:click={() => handleDelete(map)}>🗑️ Delete</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <p class="footer-note">Maps expire after 30 days. Clearing your browser cache will delete all saved maps.</p>
</div>

<style>
  .saved-tab {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  h2 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-panel);
    border-radius: var(--radius-md);
  }

  .empty-state p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 14px;
    color: var(--color-text-light);
  }

  .empty-state p:last-child {
    margin: 0;
  }

  .map-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .map-card {
    position: relative;
    padding: var(--spacing-md);
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all 200ms ease;
  }

  .map-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .map-name-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .map-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .pin-count {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .map-date {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .menu-button {
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--color-text-primary);
    font-size: 18px;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .menu-button:hover {
    color: var(--color-brand);
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 140px;
    z-index: 10;
    overflow: hidden;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: var(--spacing-md);
    border: none;
    background: none;
    text-align: left;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 150ms ease;
  }

  .menu-item:hover {
    background-color: var(--color-bg-panel);
  }

  .menu-item.delete {
    color: #ab0000;
  }

  .menu-item.delete:hover {
    background-color: rgba(171, 0, 0, 0.1);
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .map-name-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brand);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    color: var(--color-text-primary);
  }

  .map-name-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(84, 34, 176, 0.1);
  }

  .edit-buttons {
    display: flex;
    gap: var(--spacing-sm);
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .save-btn {
    background-color: var(--color-brand);
    color: var(--color-white);
    border-color: var(--color-brand);
  }

  .save-btn:hover {
    background-color: #4318a3;
  }

  .cancel-btn:hover {
    background-color: var(--color-bg-panel);
  }

  .footer-note {
    margin: var(--spacing-md) 0 0 0;
    font-size: 12px;
    color: var(--color-text-light);
    text-align: center;
  }
</style>
