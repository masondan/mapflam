<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';
  import { get } from 'svelte/store';
  import { markers, editingPinId, mapCenter, leafletMap } from '../stores';
  import { COLOR_PALETTE, ICON_FILES } from '../types';
  import type { Marker, IconType, PinSize, LabelSize } from '../types';
  import SearchBar from './SearchBar.svelte';

  let isExpanded = false;
  let currentPin: Marker | null = null;
  let markerList: Marker[] = [];
  let isDraggingSize = false;
  let isDraggingOpacity = false;
  let isDraggingLabelSize = false;
  let isDraggingLabelOpacity = false;
  let showLabelControls = false;

  markers.subscribe((m) => {
    markerList = m;
  });

  export function initPin(pin?: Marker) {
    let center = { lat: 6.5244, lng: 3.3792 };
    mapCenter.subscribe((c) => (center = c))();

    if (pin) {
      currentPin = { ...pin };
      editingPinId.set(pin.id);
      showLabelControls = !!pin.label;
    } else {
      currentPin = {
        id: uuidv4(),
        lat: center.lat,
        lng: center.lng,
        icon: 'pin1',
        size: 3,
        opacity: 100,
        color: COLOR_PALETTE[0],
        name: `Pin ${markerList.length + 1}`,
      };
      editingPinId.set(currentPin.id);
      showLabelControls = false;
      savePin();
    }
    isExpanded = true;
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function centerMapOnPin() {
    const map = get(leafletMap);
    if (currentPin && map) {
      map.setView([currentPin.lat, currentPin.lng], map.getZoom());
      mapCenter.set({ lat: currentPin.lat, lng: currentPin.lng });
    }
  }

  function savePin() {
    if (!currentPin) return;

    const pinToSave = { ...currentPin };
    markers.update((list) => {
      const existingIndex = list.findIndex((m) => m.id === pinToSave.id);
      if (existingIndex >= 0) {
        list[existingIndex] = pinToSave;
      } else {
        list.push(pinToSave);
      }
      return [...list];
    });
  }

  function handleSearch(e: CustomEvent<{ lat: number; lng: number; name: string }>) {
    if (currentPin) {
      currentPin = {
        ...currentPin,
        lat: e.detail.lat,
        lng: e.detail.lng,
        name: e.detail.name.split(',')[0],
      };
      savePin();
      const map = get(leafletMap);
      if (map) {
        map.setView([e.detail.lat, e.detail.lng], map.getZoom());
        mapCenter.set({ lat: e.detail.lat, lng: e.detail.lng });
      }
    }
  }

  function placeManualPin() {
    if (currentPin) {
      let center = { lat: 6.5244, lng: 3.3792 };
      mapCenter.subscribe((c) => (center = c))();
      currentPin = { ...currentPin, lat: center.lat, lng: center.lng };
      savePin();
    }
  }

  function updateIcon(icon: IconType) {
    if (currentPin) {
      currentPin = { ...currentPin, icon };
      savePin();
    }
  }

  function updateSize(size: PinSize) {
    if (currentPin) {
      currentPin = { ...currentPin, size };
      savePin();
    }
  }

  function updateOpacity(opacity: number) {
    if (currentPin) {
      currentPin = { ...currentPin, opacity };
      savePin();
    }
  }

  function updateColor(color: string) {
    if (currentPin) {
      currentPin = { ...currentPin, color };
      if (currentPin.label) {
        currentPin = { ...currentPin, label: { ...currentPin.label, bgColor: color } };
      }
      savePin();
    }
  }

  function updateName(name: string) {
    if (currentPin) {
      currentPin = { ...currentPin, name };
      savePin();
    }
  }

  function toggleLabel() {
    if (!currentPin) return;
    if (showLabelControls) {
      const { label, ...rest } = currentPin;
      currentPin = rest as Marker;
      showLabelControls = false;
    } else {
      currentPin = {
        ...currentPin,
        label: {
          text: '',
          size: 'medium',
          bgColor: currentPin.color,
          bgOpacity: 100,
          offsetX: 0,
          offsetY: 0,
        },
      };
      showLabelControls = true;
    }
    savePin();
  }

  function updateLabelText(text: string) {
    if (currentPin?.label) {
      currentPin = { ...currentPin, label: { ...currentPin.label, text } };
      savePin();
    }
  }

  function handleLabelKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + '\n' + text.substring(end);
      updateLabelText(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }

  function updateLabelSize(size: LabelSize) {
    if (currentPin?.label) {
      currentPin = { ...currentPin, label: { ...currentPin.label, size } };
      savePin();
    }
  }

  function updateLabelBgColor(color: string) {
    if (currentPin?.label) {
      currentPin = { ...currentPin, label: { ...currentPin.label, bgColor: color } };
      savePin();
    }
  }

  function updateLabelBgOpacity(opacity: number) {
    if (currentPin?.label) {
      currentPin = { ...currentPin, label: { ...currentPin.label, bgOpacity: opacity } };
      savePin();
    }
  }

  function nudgeLabel(direction: 'left' | 'right' | 'up' | 'down') {
    if (!currentPin?.label) return;
    const step = 4;
    let { offsetX, offsetY } = currentPin.label;
    switch (direction) {
      case 'left': offsetX -= step; break;
      case 'right': offsetX += step; break;
      case 'up': offsetY -= step; break;
      case 'down': offsetY += step; break;
    }
    currentPin = { ...currentPin, label: { ...currentPin.label, offsetX, offsetY } };
    savePin();
  }

  function deletePin() {
    if (!currentPin) return;
    const idToDelete = currentPin.id;
    markers.update((list) => list.filter((m) => m.id !== idToDelete));
    currentPin = null;
    editingPinId.set(null);
  }

  export function close() {
    currentPin = null;
    isExpanded = false;
    editingPinId.set(null);
  }

  const iconTypes: IconType[] = ['pin1', 'pin2', 'pin3', 'pin4', 'pin5', 'pin6'];

  function getLabelSizeValue(size: LabelSize): number {
    return size === 'small' ? 1 : size === 'medium' ? 2 : 3;
  }

  function setLabelSizeFromValue(val: number): LabelSize {
    return val === 1 ? 'small' : val === 2 ? 'medium' : 'large';
  }
</script>

{#if currentPin}
  <div class="pin-editor">
    <div class="pin-bar">
      <button class="toggle-btn" on:click={toggleExpand} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
        <img src="/icons/{isExpanded ? 'icon-collapse.svg' : 'icon-expand.svg'}" alt="" />
      </button>
      <input
        type="text"
        class="pin-name-input"
        value={currentPin.name}
        on:input={(e) => updateName(e.currentTarget.value)}
      />
      <button class="center-btn" on:click={centerMapOnPin} aria-label="Center map on this pin">
        <img src="/icons/icon-center.svg" alt="" />
      </button>
    </div>

    {#if isExpanded}
      <div class="pin-card">
        <div class="search-row">
          <div class="search-wrapper">
            <SearchBar on:select={handleSearch} />
          </div>
          <button class="pushpin-btn" on:click={placeManualPin} aria-label="Place pin manually">
            <img src="/icons/icon-pushpin-fill.svg" alt="" />
          </button>
        </div>

        <div class="icon-selector">
          {#each iconTypes as icon}
            <button
              class="icon-btn"
              class:active={currentPin.icon === icon}
              style="--active-color: {currentPin.color}"
              on:click={() => updateIcon(icon)}
              aria-label="Select {icon}"
            >
              <img src="/icons/{ICON_FILES[icon]}" alt={icon} class:colored={currentPin.icon === icon} style="--icon-color: {currentPin.color}" />
            </button>
          {/each}
        </div>

        <div class="slider-group">
          <span class="slider-label">Pin size</span>
          <div class="slider-wrapper">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={currentPin.size}
              on:input={(e) => updateSize(parseInt(e.currentTarget.value) as PinSize)}
              on:mousedown={() => (isDraggingSize = true)}
              on:mouseup={() => (isDraggingSize = false)}
              on:touchstart={() => (isDraggingSize = true)}
              on:touchend={() => (isDraggingSize = false)}
              class="slider"
            />
            {#if isDraggingSize}
              <span class="slider-feedback">{currentPin.size}</span>
            {/if}
          </div>
        </div>

        <div class="slider-group">
          <span class="slider-label">Opacity</span>
          <div class="slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={currentPin.opacity}
              on:input={(e) => updateOpacity(parseInt(e.currentTarget.value))}
              on:mousedown={() => (isDraggingOpacity = true)}
              on:mouseup={() => (isDraggingOpacity = false)}
              on:touchstart={() => (isDraggingOpacity = true)}
              on:touchend={() => (isDraggingOpacity = false)}
              class="slider"
            />
            {#if isDraggingOpacity}
              <span class="slider-feedback">{currentPin.opacity}%</span>
            {/if}
          </div>
        </div>

        <div class="color-row">
          {#each COLOR_PALETTE as color}
            <button
              class="color-btn"
              class:active={currentPin.color === color}
              class:white={color === '#FFFFFF'}
              style="background-color: {color}"
              on:click={() => updateColor(color)}
              aria-label="Select {color} color"
            ></button>
          {/each}
        </div>

        <div class="toggle-row">
          <span class="toggle-label">Pin label</span>
          <button
            class="toggle-switch"
            class:active={showLabelControls}
            on:click={toggleLabel}
            aria-label="Toggle pin label"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        {#if showLabelControls && currentPin.label}
           <div class="label-section">
             <textarea
               class="label-input"
               placeholder="Add label text"
               value={currentPin.label.text}
               on:input={(e) => updateLabelText(e.currentTarget.value)}
               on:keydown={handleLabelKeydown}
             />

            <div class="slider-group">
              <span class="slider-label">Label size</span>
              <div class="slider-wrapper">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={getLabelSizeValue(currentPin.label.size)}
                  on:input={(e) => updateLabelSize(setLabelSizeFromValue(parseInt(e.currentTarget.value)))}
                  on:mousedown={() => (isDraggingLabelSize = true)}
                  on:mouseup={() => (isDraggingLabelSize = false)}
                  on:touchstart={() => (isDraggingLabelSize = true)}
                  on:touchend={() => (isDraggingLabelSize = false)}
                  class="slider"
                />
                {#if isDraggingLabelSize}
                  <span class="slider-feedback">{currentPin.label.size}</span>
                {/if}
              </div>
            </div>

            <div class="slider-group">
              <span class="slider-label">Opacity</span>
              <div class="slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={currentPin.label.bgOpacity}
                  on:input={(e) => updateLabelBgOpacity(parseInt(e.currentTarget.value))}
                  on:mousedown={() => (isDraggingLabelOpacity = true)}
                  on:mouseup={() => (isDraggingLabelOpacity = false)}
                  on:touchstart={() => (isDraggingLabelOpacity = true)}
                  on:touchend={() => (isDraggingLabelOpacity = false)}
                  class="slider"
                />
                {#if isDraggingLabelOpacity}
                  <span class="slider-feedback">{currentPin.label.bgOpacity}%</span>
                {/if}
              </div>
            </div>

            <div class="sub-section">
              <span class="section-label">Label background</span>
              <div class="color-row">
                {#each COLOR_PALETTE as color}
                  <button
                    class="color-btn small"
                    class:active={currentPin.label.bgColor === color}
                    class:white={color === '#FFFFFF'}
                    style="background-color: {color}"
                    on:click={() => updateLabelBgColor(color)}
                    aria-label="Select {color} background"
                  ></button>
                {/each}
              </div>
            </div>

            <div class="nudge-section">
              <span class="section-label">Nudge label</span>
              <div class="nudge-row">
                <button class="nudge-btn" on:click={() => nudgeLabel('left')} aria-label="Nudge left">
                  <img src="/icons/icon-left.svg" alt="" />
                </button>
                <button class="nudge-btn" on:click={() => nudgeLabel('right')} aria-label="Nudge right">
                  <img src="/icons/icon-right.svg" alt="" />
                </button>
                <button class="nudge-btn" on:click={() => nudgeLabel('up')} aria-label="Nudge up">
                  <img src="/icons/icon-up.svg" alt="" />
                </button>
                <button class="nudge-btn" on:click={() => nudgeLabel('down')} aria-label="Nudge down">
                  <img src="/icons/icon-down.svg" alt="" />
                </button>
              </div>
            </div>
          </div>
        {/if}

        <button class="delete-btn" on:click={deletePin}>Delete Pin</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .pin-editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .pin-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .toggle-btn {
    width: 44px;
    height: 44px;
    border: none;
    background-color: var(--color-text-primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-btn img {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }

  .pin-name-input {
    flex: 1;
    padding: 12px var(--spacing-md);
    background-color: var(--color-bg-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    color: var(--color-text-dark);
  }

  .pin-name-input:focus {
    outline: none;
    border-color: var(--color-brand);
  }

  .center-btn {
    width: 44px;
    height: 44px;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .center-btn img {
    width: 28px;
    height: 28px;
  }

  .pin-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .search-wrapper {
    flex: 1;
  }

  .pushpin-btn {
    width: 44px;
    height: 44px;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .pushpin-btn img {
    width: 24px;
    height: 24px;
    filter: brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(89%);
  }

  .icon-selector {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 56px;
    height: 56px;
    border: 1px solid var(--color-text-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms ease;
  }

  .icon-btn.active {
    border-color: var(--active-color);
    border-width: 2px;
  }

  .icon-btn:not(.active) img {
    filter: brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(89%);
  }

  .icon-btn img {
    width: 32px;
    height: 32px;
  }

  .slider-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .slider-label {
    font-size: 14px;
    color: var(--color-text-primary);
    min-width: 70px;
  }

  .slider-wrapper {
    flex: 1;
    position: relative;
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
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-text-primary);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-text-primary);
    cursor: pointer;
    border: none;
  }

  .slider-feedback {
    position: absolute;
    right: 0;
    top: -24px;
    font-size: 12px;
    color: var(--color-text-dark);
    background-color: var(--color-bg-panel);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .color-row {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }

  .color-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .color-btn.small {
    width: 40px;
    height: 40px;
  }

  .color-btn.white {
    border-color: var(--color-text-light);
  }

  .color-btn.active {
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-text-light);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-text-primary);
  }

  .toggle-label {
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

  .label-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg) 0;
    background-color: transparent;
    border-radius: 0;
  }

  .label-input {
    width: 100%;
    padding: 10px var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    background-color: var(--color-white);
    resize: both;
    height: 40px;
    min-height: 40px;
    line-height: 20px;
    box-sizing: border-box;
  }

  .label-input::placeholder {
    color: var(--color-text-light);
  }

  .label-input:focus {
    outline: none;
    border-color: var(--color-brand);
  }

  .sub-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-label {
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .nudge-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-text-primary);
  }

  .nudge-row {
    display: flex;
    gap: 8px;
  }

  .nudge-btn {
    width: 32px;
    height: 32px;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: filter 200ms ease;
  }

  .nudge-btn img {
    width: 32px;
    height: 32px;
    filter: brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%);
  }

  .nudge-btn:hover img,
  .nudge-btn:active img {
    filter: brightness(0) saturate(100%) invert(22%) sepia(51%) saturate(1886%) hue-rotate(247deg) brightness(102%) contrast(102%);
  }

  .delete-btn {
    width: 100%;
    padding: var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: transparent;
    color: var(--color-text-dark);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
  }

  .delete-btn:hover {
    color: #ab0000;
  }
</style>
