<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';
  import { markers, editingPinId } from '../stores';
  import { COLOR_PALETTE, ICON_FILES, SIZE_MAP, LABEL_SIZES } from '../types';
  import type { Marker, IconType, PinSize, LabelSize } from '../types';
  import SearchBar from './SearchBar.svelte';

  let isExpanded = false;
  let currentPin: Marker | null = null;
  let showLabelControls = false;
  let markerList: Marker[] = [];
  let editingExistingPin = false;

  // Subscribe to markers to get count for new pins
  markers.subscribe((m) => {
    markerList = m;
  });

  // Initialize new pin or edit existing
  export function initPin(pin?: Marker) {
    if (pin) {
      currentPin = { ...pin };
      editingPinId.set(pin.id);
      editingExistingPin = true;
    } else {
      currentPin = {
        id: uuidv4(),
        lat: 6.5244,
        lng: 3.3792,
        icon: 'pin1',
        size: 3,
        opacity: 100,
        color: COLOR_PALETTE[0],
        name: `Pin ${markerList.length + 1}`,
      };
      editingPinId.set(currentPin.id);
      editingExistingPin = false;
    }
    isExpanded = true;
    showLabelControls = !!currentPin.label;
  }

  function collapse() {
    isExpanded = false;
    if (currentPin && !editingExistingPin) {
      // If new pin, don't save
      currentPin = null;
      editingPinId.set(null);
    }
  }

  function savePin() {
    if (!currentPin) return;

    const pinToSave = currentPin;
    markers.update((markerList) => {
      const existingIndex = markerList.findIndex((m) => m.id === pinToSave.id);
      if (existingIndex >= 0) {
        markerList[existingIndex] = pinToSave;
      } else {
        markerList.push(pinToSave);
      }
      return markerList;
    });
    collapse();
  }

  function deletePin() {
    if (!currentPin) return;
    markers.update((markerList) => {
      return markerList.filter((m) => m.id !== currentPin!.id);
    });
    collapse();
  }

  function handleSearch(e: Event) {
    const customEvent = e as CustomEvent;
    if (currentPin) {
      currentPin.lat = customEvent.detail.lat;
      currentPin.lng = customEvent.detail.lng;
      currentPin.name = customEvent.detail.name.split(',')[0]; // Use first part as name
    }
  }

  function updateIcon(icon: IconType) {
    if (currentPin) {
      currentPin.icon = icon;
    }
  }

  function updateSize(size: PinSize) {
    if (currentPin) {
      currentPin.size = size;
    }
  }

  function updateOpacity(opacity: number) {
    if (currentPin) {
      currentPin.opacity = opacity;
    }
  }

  function updateColor(color: string) {
    if (currentPin) {
      currentPin.color = color;
    }
  }

  function updateLabelText(text: string) {
    if (!currentPin) return;
    if (!currentPin.label) {
      currentPin.label = {
        text: '',
        size: 'medium',
        bgColor: COLOR_PALETTE[0],
        bgOpacity: 100,
        offsetX: 0,
        offsetY: 0,
      };
    }
    currentPin.label.text = text;
  }

  function updateLabelSize(size: LabelSize) {
    if (currentPin?.label) {
      currentPin.label.size = size;
    }
  }

  function updateLabelBgColor(color: string) {
    if (currentPin?.label) {
      currentPin.label.bgColor = color;
    }
  }

  function updateLabelBgOpacity(opacity: number) {
    if (currentPin?.label) {
      currentPin.label.bgOpacity = opacity;
    }
  }

  function nudgeLabel(direction: 'left' | 'right' | 'up' | 'down') {
    if (!currentPin?.label) return;
    const step = 4;
    switch (direction) {
      case 'left':
        currentPin.label.offsetX -= step;
        break;
      case 'right':
        currentPin.label.offsetX += step;
        break;
      case 'up':
        currentPin.label.offsetY -= step;
        break;
      case 'down':
        currentPin.label.offsetY += step;
        break;
    }
  }

  function toggleLabel() {
    if (!currentPin) return;
    if (showLabelControls) {
      delete currentPin.label;
      showLabelControls = false;
    } else {
      if (!currentPin.label) {
        currentPin.label = {
          text: 'Label',
          size: 'medium',
          bgColor: COLOR_PALETTE[0],
          bgOpacity: 100,
          offsetX: 0,
          offsetY: 0,
        };
      }
      showLabelControls = true;
    }
  }
</script>

<div class="pin-editor-overlay" class:expanded={isExpanded}>
  {#if currentPin}
    <div class="pin-editor-card">
      <div class="card-header">
        <h3>Edit Pin</h3>
        <button class="close-button" aria-label="Close pin editor" on:click={collapse}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="card-content">
        <!-- Search Bar -->
        <div class="control-group">
          <label class="control-label">Location</label>
          <SearchBar on:select={handleSearch} />
        </div>

        <!-- Icon Selector -->
        <div class="control-group">
          <label class="control-label">Icon</label>
          <div class="icon-grid">
            {#each Object.keys(ICON_FILES) as iconKey}
              {@const icon = iconKey as IconType}
              <button
                class="icon-button"
                class:active={currentPin.icon === icon}
                on:click={() => updateIcon(icon)}
                title={icon}
              >
                <img src={`/icons/markers/${ICON_FILES[icon]}-fill.svg`} alt={icon} />
              </button>
            {/each}
          </div>
        </div>

        <!-- Size Slider -->
        <div class="control-group">
          <label class="control-label" for="pin-size">Size: {currentPin.size}/5</label>
          <input
            id="pin-size"
            type="range"
            min="1"
            max="5"
            value={currentPin.size}
            on:input={(e) => updateSize(parseInt(e.currentTarget.value) as PinSize)}
            class="slider"
          />
        </div>

        <!-- Opacity Slider -->
        <div class="control-group">
          <label class="control-label" for="pin-opacity">Opacity: {currentPin.opacity}%</label>
          <input
            id="pin-opacity"
            type="range"
            min="0"
            max="100"
            step="10"
            value={currentPin.opacity}
            on:input={(e) => updateOpacity(parseInt(e.currentTarget.value))}
            class="slider"
          />
        </div>

        <!-- Color Picker -->
        <div class="control-group">
          <label class="control-label">Color</label>
          <div class="color-picker">
            {#each COLOR_PALETTE as color}
              <button
                class="color-button"
                class:active={currentPin.color === color}
                style="--color: {color}"
                on:click={() => updateColor(color)}
                title={color}
                aria-label="Color {color}"
              ></button>
            {/each}
          </div>
        </div>

        <!-- Label Toggle -->
        <div class="control-group">
          <button
            class="toggle-button"
            class:active={showLabelControls}
            on:click={toggleLabel}
          >
            {showLabelControls ? '✓' : ''} Pin Label
          </button>
        </div>

        <!-- Label Controls (Conditional) -->
        {#if showLabelControls && currentPin.label}
          <div class="label-controls">
            <div class="control-group">
              <label class="control-label" for="label-text">Label Text</label>
              <input
                id="label-text"
                type="text"
                value={currentPin.label.text}
                on:input={(e) => updateLabelText(e.currentTarget.value)}
                placeholder="Enter label text"
                class="text-input"
              />
            </div>

            <div class="control-group">
              <label class="control-label" for="label-size">Label Size</label>
              <div class="size-buttons">
                {#each Object.keys(LABEL_SIZES) as sizeKey}
                  {@const size = sizeKey as LabelSize}
                  <button
                    class="size-button"
                    class:active={currentPin.label.size === size}
                    on:click={() => updateLabelSize(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                {/each}
              </div>
            </div>

            <div class="control-group">
              <label class="control-label" for="label-bg-color">Label Background Color</label>
              <div class="color-picker" id="label-bg-color">
                {#each COLOR_PALETTE as color}
                  <button
                    class="color-button"
                    class:active={currentPin.label.bgColor === color}
                    style="--color: {color}"
                    on:click={() => updateLabelBgColor(color)}
                    aria-label="Background color {color}"
                  ></button>
                {/each}
              </div>
            </div>

            <div class="control-group">
              <label class="control-label" for="label-bg-opacity">Background Opacity: {currentPin.label.bgOpacity}%</label>
              <input
                id="label-bg-opacity"
                type="range"
                min="0"
                max="100"
                step="10"
                value={currentPin.label.bgOpacity}
                on:input={(e) => updateLabelBgOpacity(parseInt(e.currentTarget.value))}
                class="slider"
              />
            </div>

            <!-- Nudge Buttons -->
            <div class="control-group">
              <label class="control-label">Position</label>
              <div class="nudge-controls">
                <button class="nudge-button up" on:click={() => nudgeLabel('up')} title="Up">↑</button>
                <div class="nudge-row">
                  <button class="nudge-button left" on:click={() => nudgeLabel('left')} title="Left">←</button>
                  <button class="nudge-button right" on:click={() => nudgeLabel('right')} title="Right">→</button>
                </div>
                <button class="nudge-button down" on:click={() => nudgeLabel('down')} title="Down">↓</button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="card-footer">
        <button class="delete-button" on:click={deletePin}>Delete</button>
        <button class="save-button" on:click={savePin}>Save Pin</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .pin-editor-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0);
    pointer-events: none;
    z-index: 20;
    max-width: 480px;
    margin: 0 auto;
  }

  .pin-editor-overlay.expanded {
    pointer-events: all;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .pin-editor-card {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-white);
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    animation: slideUp 250ms ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .card-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-dark);
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-primary);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    transition: all 200ms ease;
  }

  .close-button:hover {
    background-color: var(--color-brand-light);
    color: var(--color-brand);
  }

  .card-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
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

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .icon-button {
    aspect-ratio: 1;
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-panel);
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: all 200ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-button:hover {
    background-color: var(--color-brand-light);
  }

  .icon-button.active {
    border-color: var(--color-brand);
    background-color: var(--color-brand-light);
  }

  .icon-button img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg-panel);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-brand);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-brand);
    cursor: pointer;
    border: none;
  }

  .color-picker {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .color-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    background-color: var(--color);
    cursor: pointer;
    transition: all 200ms ease;
    flex-shrink: 0;
  }

  .color-button:hover {
    transform: scale(1.1);
  }

  .color-button.active {
    border-color: var(--color-text-dark);
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-text-dark);
  }

  .toggle-button {
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
    text-align: left;
  }

  .toggle-button:hover {
    background-color: var(--color-bg-panel);
  }

  .toggle-button.active {
    background-color: var(--color-brand-light);
    color: var(--color-brand);
    border-color: var(--color-brand);
  }

  .label-controls {
    padding: var(--spacing-md);
    background-color: var(--color-bg-panel);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .text-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    color: var(--color-text-primary);
  }

  .text-input:focus {
    outline: none;
    border-color: var(--color-brand);
    box-shadow: 0 0 0 2px rgba(84, 34, 176, 0.1);
  }

  .size-buttons {
    display: flex;
    gap: var(--spacing-sm);
  }

  .size-button {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .size-button:hover {
    border-color: var(--color-brand);
  }

  .size-button.active {
    background-color: var(--color-brand);
    color: var(--color-white);
    border-color: var(--color-brand);
  }

  .nudge-controls {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .nudge-row {
    display: flex;
    gap: 4px;
  }

  .nudge-button {
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 16px;
    transition: all 200ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nudge-button:hover {
    background-color: var(--color-brand-light);
    border-color: var(--color-brand);
  }

  .card-footer {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-white);
  }

  .delete-button {
    flex: 1;
    padding: var(--spacing-md);
    border: 1px solid #ab0000;
    border-radius: var(--radius-md);
    background-color: white;
    color: #ab0000;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .delete-button:hover {
    background-color: rgba(171, 0, 0, 0.1);
  }

  .save-button {
    flex: 1;
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

  .save-button:hover {
    background-color: #4318a3;
  }

  .save-button:active {
    transform: scale(0.98);
  }
</style>
