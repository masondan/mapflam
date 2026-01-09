<script lang="ts">
  import { selectedFormat } from '../stores';
  import type { MapFormat } from '../types';

  const formats: { label: string; value: MapFormat }[] = [
    { label: '9:16', value: '9:16' },
    { label: '1:1', value: 'square' },
    { label: '16:9', value: '16:9' },
  ];

  function selectFormat(format: MapFormat) {
    selectedFormat.set(format);
  }
</script>

<div class="ratio-selector">
  {#each formats as format (format.value)}
    <button
      class="ratio-button"
      class:active={$selectedFormat === format.value}
      on:click={() => selectFormat(format.value)}
      aria-label="Select {format.label} format"
    >
      {format.label}
    </button>
  {/each}
</div>

<style>
  .ratio-selector {
    display: flex;
    gap: 8px;
  }

  .ratio-button {
    min-width: 48px;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .ratio-button:hover {
    background-color: var(--color-bg-panel);
  }

  .ratio-button.active {
    background-color: var(--color-text-primary);
    color: var(--color-white);
    border-color: var(--color-text-primary);
  }
</style>
