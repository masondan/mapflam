<script lang="ts">
  import { selectedFormat } from '../stores';
  import type { MapFormat } from '../types';

  const formats: { label: string; value: MapFormat; ratio: string }[] = [
    { label: '9:16', value: '9:16', ratio: 'Portrait' },
    { label: '1:1', value: 'square', ratio: 'Square' },
    { label: '16:9', value: '16:9', ratio: 'Landscape' },
  ];

  function selectFormat(format: MapFormat) {
    selectedFormat.set(format);
  }
</script>

<div class="ratio-selector">
  {#each formats as format (format.value)}
    <button
      class="format-button"
      class:active={$selectedFormat === format.value}
      on:click={() => selectFormat(format.value)}
      aria-label="Select {format.ratio} ({format.label})"
    >
      <span class="format-label">{format.label}</span>
      <span class="format-ratio">{format.ratio}</span>
    </button>
  {/each}
</div>

<style>
  .ratio-selector {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .format-button {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .format-button:active {
    border-color: var(--color-brand);
    background-color: var(--color-brand-light);
    color: var(--color-brand);
  }

  .format-ratio {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .format-button.active {
    border-color: var(--color-brand);
    background-color: var(--color-brand);
    color: var(--color-white);
  }

  .format-button.active .format-ratio {
    color: rgba(255, 255, 255, 0.8);
  }
</style>
