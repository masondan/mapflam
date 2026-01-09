<script lang="ts">
  import { selectedBaseMap } from '../stores';
  import type { BaseMap } from '../types';

  const baseMaps: { label: string; value: BaseMap; description: string }[] = [
    { label: 'Positron', value: 'positron', description: 'Light, clean map with labels' },
    { label: 'Positron No Labels', value: 'positron-nolabels', description: 'Light map, minimal labels' },
    { label: 'Toner', value: 'toner', description: 'High-contrast B&W map' },
  ];

  let isOpen = false;

  function selectMap(baseMap: BaseMap) {
    selectedBaseMap.set(baseMap);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }
</script>

<div class="base-map-selector">
  <button class="dropdown-button" on:click={toggleDropdown} aria-label="Select base map">
    <span>{baseMaps.find(m => m.value === $selectedBaseMap)?.label || 'Positron'}</span>
    <img src="/icons/icon-more.svg" alt="" width="16" height="16" />
  </button>

  {#if isOpen}
    <div class="dropdown-menu">
      {#each baseMaps as baseMap (baseMap.value)}
        <button
          class="dropdown-item"
          class:active={$selectedBaseMap === baseMap.value}
          on:click={() => selectMap(baseMap.value)}
        >
          <div class="item-label">{baseMap.label}</div>
          <div class="item-description">{baseMap.description}</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .base-map-selector {
    position: relative;
    margin-bottom: var(--spacing-md);
  }

  .dropdown-button {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 200ms ease;
  }

  .dropdown-button:hover {
    border-color: var(--color-brand);
    background-color: var(--color-brand-light);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-white);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
    margin-top: 4px;
  }

  .dropdown-item {
    width: 100%;
    padding: var(--spacing-md);
    border: none;
    background-color: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 200ms ease;
    border-bottom: 1px solid var(--color-border);
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item:hover {
    background-color: var(--color-brand-light);
  }

  .dropdown-item.active {
    background-color: var(--color-brand);
    color: var(--color-white);
  }

  .item-label {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
  }

  .item-description {
    font-size: 12px;
    opacity: 0.7;
  }

  .dropdown-item.active .item-description {
    opacity: 0.9;
  }
</style>
