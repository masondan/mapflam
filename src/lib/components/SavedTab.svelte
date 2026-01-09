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

  function toggleMenu(mapId: string) {
    if (expandedMenuId === mapId) {
      expandedMenuId = null;
      confirmingDeleteId = null;
    } else {
      expandedMenuId = mapId;
      confirmingDeleteId = null;
    }
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
    expandedMenuId = null;
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
            <img src="/icons/logo-mapflam-purple-gen.png" alt="Map thumbnail" />
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
          <div class="action-toolbar">
            {#if confirmingDeleteId === map.id}
              <button class="toolbar-btn delete-confirm" on:click={() => confirmDelete(map)}>
                <img src="/icons/icon-trash-fill.svg" alt="" class="toolbar-icon delete-icon" />
                Delete?
              </button>
            {:else}
              <button class="toolbar-btn" on:click={() => initiateDelete(map.id)}>
                <img src="/icons/icon.trash.svg" alt="" class="toolbar-icon" />
              </button>
            {/if}
            <span class="toolbar-divider"></span>
            <button class="toolbar-btn" on:click={() => handleEditMap(map)}>
              Download
            </button>
            <span class="toolbar-divider"></span>
            <button class="toolbar-btn" on:click={() => handleEditMap(map)}>
              Edit
            </button>
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
    width: 64px;
    height: 64px;
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
  }

  .menu-btn img {
    width: 20px;
    height: 20px;
  }

  .action-toolbar {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    margin-left: 80px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
  }

  .toolbar-btn {
    border: none;
    background: none;
    padding: 8px 12px;
    font-size: 14px;
    color: var(--color-text-dark);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar-btn:hover {
    color: var(--color-brand);
  }

  .toolbar-btn.delete-confirm {
    color: var(--color-brand);
  }

  .toolbar-icon {
    width: 16px;
    height: 16px;
  }

  .delete-icon {
    filter: invert(17%) sepia(87%) saturate(3063%) hue-rotate(262deg) brightness(87%) contrast(101%);
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background-color: var(--color-border);
  }

  .list-divider {
    height: 1px;
    background-color: #eee;
  }
</style>
