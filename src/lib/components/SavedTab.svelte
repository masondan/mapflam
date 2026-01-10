<script lang="ts">
  import { onMount } from 'svelte';
  import { markers, selectedFormat, selectedBaseMap, mapCenter, mapZoom, activeTab } from '../stores';
  import { loadSavedMaps, deleteMap as deleteMapFromStorage, saveMap } from '../services/persistence';
  import type { SavedMap } from '../types';

  let savedMaps: SavedMap[] = [];
  let expandedMenuId: string | null = null;
  let confirmingDeleteId: string | null = null;
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
    markers.set(map.state.markers);
    selectedFormat.set(map.state.selectedFormat);
    selectedBaseMap.set(map.state.selectedBaseMap);
    mapCenter.set(map.state.mapCenter);
    mapZoom.set(map.state.mapZoom);
    activeTab.set('create');
    expandedMenuId = null;
  }

  function handleDownloadMap(map: SavedMap) {
    // Load map state, then trigger export on create tab
    markers.set(map.state.markers);
    selectedFormat.set(map.state.selectedFormat);
    selectedBaseMap.set(map.state.selectedBaseMap);
    mapCenter.set(map.state.mapCenter);
    mapZoom.set(map.state.mapZoom);
    activeTab.set('create');
    expandedMenuId = null;
  }

  function toggleMenu(mapId: string) {
    expandedMenuId = expandedMenuId === mapId ? null : mapId;
    confirmingDeleteId = null;
  }

  function closeMenu() {
    expandedMenuId = null;
    confirmingDeleteId = null;
  }

  function initiateDelete(mapId: string) {
    confirmingDeleteId = mapId;
  }

  function confirmDelete(map: SavedMap) {
    deleteMapFromStorage(map.id);
    loadStoredMaps();
    expandedMenuId = null;
    confirmingDeleteId = null;
  }

  function startEditing(map: SavedMap) {
    editingMapId = map.id;
    editingMapName = map.name;
  }

  function saveMapName(map: SavedMap) {
    if (editingMapName.trim()) {
      map.name = editingMapName.trim();
      saveMap(map);
      loadStoredMaps();
    }
    editingMapId = null;
    editingMapName = '';
  }

  function cancelEditing() {
    editingMapId = null;
    editingMapName = '';
  }

  function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
</script>

<div class="saved-tab">
  {#if savedMaps.length === 0}
    <div class="empty-state">
      <p class="empty-title">No saved maps yet.</p>
      <p class="empty-text">Maps are deleted after 30 days to conserve device memory</p>
      <p class="empty-text">Deleting your cache may delete maps.</p>
    </div>
  {:else}
    <div class="map-list">
      {#each savedMaps as map (map.id)}
        <div class="map-item">
          <div class="map-thumbnail">
            <img src={map.thumbnail} alt="Map thumbnail" />
          </div>
          
          <div class="map-details">
            {#if editingMapId === map.id}
              <input
                type="text"
                class="name-input"
                bind:value={editingMapName}
                on:blur={() => saveMapName(map)}
                on:keydown={(e) => e.key === 'Enter' && saveMapName(map)}
              />
            {:else}
              <div class="map-name-row">
                <span class="map-name">{map.name}</span>
                <button class="edit-name-btn" on:click={() => startEditing(map)}>
                  <img src="/icons/icon-pencil-fill.svg" alt="Edit name" />
                </button>
              </div>
            {/if}
            
            <div class="map-meta">
              <span class="meta-item">
                <img src="/icons/icon-time.svg" alt="" class="meta-icon" />
                {formatTimeAgo(map.createdAt)}
              </span>
            </div>
            
            <div class="map-pins">
              <span class="meta-item">
                <img src="/icons/icon-pushpin.svg" alt="" class="meta-icon" />
                {map.state.markers.length}
              </span>
            </div>
          </div>
          
          <button class="menu-btn" on:click={() => toggleMenu(map.id)}>
            <img src="/icons/icon-more.svg" alt="More options" />
          </button>
        </div>

        {#if expandedMenuId === map.id}
          <div class="action-buttons">
            <div style="flex-direction: row; display: flex; align-items: center; gap: 0;">
              <button class="action-btn" on:click={() => closeMenu()}>Cancel</button>
              <span class="divider"></span>
              <button class="action-btn" on:click={() => initiateDelete(map.id)}>Delete</button>
              <span class="divider"></span>
              <button class="action-btn" on:click={() => handleDownloadMap(map)}>Download</button>
              <span class="divider"></span>
              <button class="action-btn" on:click={() => handleEditMap(map)}>Edit</button>
            </div>
            
            {#if confirmingDeleteId === map.id}
              <div class="delete-confirmation">
                <button class="confirm-btn cancel-btn" on:click={() => (confirmingDeleteId = null)}>
                  Cancel
                </button>
                <span class="confirm-divider"></span>
                <button class="confirm-btn delete-btn" on:click={() => confirmDelete(map)}>
                  Delete
                </button>
              </div>
            {/if}
          </div>
        {/if}
        
        <div class="list-divider"></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .saved-tab {
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .empty-title {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 16px;
    color: var(--color-text-dark);
  }

  .empty-text {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 14px;
    color: var(--color-text-light);
  }

  .map-list {
    display: flex;
    flex-direction: column;
  }

  .map-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .map-thumbnail {
    width: 102px;
    height: 102px;
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-bg-panel);
    flex-shrink: 0;
  }

  .map-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .map-details {
    flex: 1;
    min-width: 0;
  }

  .map-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .map-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .edit-name-btn {
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    opacity: 0.6;
  }

  .edit-name-btn:hover {
    opacity: 1;
  }

  .edit-name-btn img {
    width: 16px;
    height: 16px;
  }

  .name-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--color-brand);
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-dark);
    font-family: inherit;
  }

  .name-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(84, 34, 176, 0.1);
  }

  .map-meta {
    display: flex;
    gap: var(--spacing-md);
  }

  .map-pins {
    display: flex;
    gap: var(--spacing-md);
    margin-top: 4px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--color-text-light);
  }

  .meta-icon {
    width: 14px;
    height: 14px;
    opacity: 0.6;
  }

  .menu-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .menu-btn img {
    width: 20px;
    height: 20px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 0;
    margin: var(--spacing-sm) 0;
    width: 100%;
  }

  .action-btn {
    border: none;
    background: none;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s ease;
  }

  .action-btn:hover {
    color: var(--color-brand);
  }

  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--color-text-primary);
    margin: 0 4px;
  }

  .delete-confirmation {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 8px 12px;
    background-color: var(--color-brand);
    color: var(--color-white);
    border-radius: 8px;
    width: fit-content;
  }

  .confirm-btn {
    border: none;
    background: none;
    padding: 4px 10px;
    font-size: 13px;
    font-weight: 400;
    color: var(--color-white);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  .cancel-btn:hover {
    opacity: 0.8;
  }

  .delete-btn:hover {
    opacity: 0.8;
  }

  .confirm-divider {
    width: 1px;
    height: 14px;
    background-color: rgba(255, 255, 255, 0.4);
    margin: 0 2px;
  }

  .list-divider {
    height: 1px;
    background-color: #eee;
  }
</style>
