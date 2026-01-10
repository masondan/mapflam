<script lang="ts">
  import { selectedBaseMap } from '../stores';
  import type { BaseMap } from '../types';

  const baseMaps: { label: string; value: BaseMap; thumbnailUrl: string }[] = [
    { 
      label: 'Positron', 
      value: 'positron',
      thumbnailUrl: 'https://a.basemaps.cartocdn.com/light_all/2/2/0.png'
    },
    { 
      label: 'Voyager', 
      value: 'voyager',
      thumbnailUrl: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/2/2/0.png'
    },
    { 
      label: 'OSM', 
      value: 'osm-standard',
      thumbnailUrl: 'https://tile.openstreetmap.org/2/2/0.png'
    },
  ];

  let isOpen = false;

  function selectMap(baseMap: BaseMap) {
    selectedBaseMap.set(baseMap);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.base-map-selector')) {
      isOpen = false;
    }
  }

  $: if (typeof window !== 'undefined') {
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    } else {
      window.removeEventListener('click', handleClickOutside);
    }
  }
</script>

<div class="base-map-selector">
  <button 
    class="dropdown-trigger" 
    class:open={isOpen}
    on:click|stopPropagation={toggleDropdown}
    aria-label="Select base map"
  >
    <span class="trigger-label">Base map</span>
    <img 
      src={isOpen ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'} 
      alt="" 
      class="trigger-icon"
    />
  </button>

  {#if isOpen}
    <div class="dropdown-panel">
      <div class="thumbnail-grid">
        {#each baseMaps as baseMap (baseMap.value)}
          <button
            class="thumbnail-card"
            class:active={$selectedBaseMap === baseMap.value}
            on:click={() => selectMap(baseMap.value)}
            aria-label="Select {baseMap.label} basemap"
          >
            <div 
              class="thumbnail-preview"
              style="background-image: url('{baseMap.thumbnailUrl}')"
            ></div>
            <span class="thumbnail-label">{baseMap.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .base-map-selector {
    position: relative;
    flex: 1;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .dropdown-trigger.open {
    background-color: var(--color-bg-panel);
  }

  .dropdown-trigger:hover {
    background-color: var(--color-bg-panel);
  }

  .trigger-icon {
    width: 20px;
    height: 20px;
    opacity: 0.6;
  }

  .dropdown-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    padding: var(--spacing-sm);
    width: calc(100vw - 32px);
    max-width: 448px;
  }

  .thumbnail-grid {
    display: flex;
    gap: 8px;
  }

  .thumbnail-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #999999;
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    cursor: pointer;
    transition: all 200ms ease;
    padding: 0;
    overflow: hidden;
  }

  .thumbnail-card:hover {
    border-color: var(--color-text-primary);
  }

  .thumbnail-card.active {
    border-color: #777777;
    border-width: 3px;
  }

  .thumbnail-preview {
    flex: 1;
    width: 100%;
    aspect-ratio: 1;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: var(--color-bg-panel);
  }

  .thumbnail-label {
    padding: 8px;
    font-size: 11px;
    color: var(--color-text-primary);
    text-align: center;
    background-color: var(--color-white);
  }
</style>
