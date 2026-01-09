<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';
  import { get } from 'svelte/store';
  import { markers, editingPinId, mapCenter, leafletMap, insetConfig } from '../stores';
  import { COLOR_PALETTE, ICON_FILES } from '../types';
  import type { Marker, IconType, PinSize, LabelSize } from '../types';
  import SearchBar from './SearchBar.svelte';

  let markerList: Marker[] = [];
  let currentEditingId: string | null = null;
  let showLabelControls: { [key: string]: boolean } = {};
  let isDraggingSize: { [key: string]: boolean } = {};
  let isDraggingOpacity: { [key: string]: boolean } = {};
  let isDraggingLabelSize: { [key: string]: boolean } = {};
  let isDraggingLabelOpacity: { [key: string]: boolean } = {};

  markers.subscribe((m) => {
    markerList = m;
  });

  editingPinId.subscribe((id) => {
    currentEditingId = id;
  });

  export function initPin(pin?: Marker) {
    let center = { lat: 6.5244, lng: 3.3792 };
    mapCenter.subscribe((c) => (center = c))();

    insetConfig.update((c) => ({ ...c, enabled: false }));

    if (pin) {
      editingPinId.set(pin.id);
      if (!showLabelControls[pin.id]) {
        showLabelControls[pin.id] = !!pin.label;
      }
    } else {
      // Create new pin
      const newPin: Marker = {
        id: uuidv4(),
        lat: center.lat,
        lng: center.lng,
        icon: 'pin1',
        size: 3,
        opacity: 100,
        color: COLOR_PALETTE[0],
        name: `Pin ${markerList.length + 1}`,
      };
      markers.update((list) => [...list, newPin]);
      editingPinId.set(newPin.id);
      showLabelControls[newPin.id] = false;
    }
  }

  function toggleExpand(pinId: string) {
    const pin = markerList.find((m) => m.id === pinId);
    if (pin) {
      if (currentEditingId === pinId) {
        editingPinId.set(null);
      } else {
        editingPinId.set(pinId);
        insetConfig.update((c) => ({ ...c, enabled: false }));
      }
    }
  }

  function centerMapOnPin(pinId: string) {
    const map = get(leafletMap);
    const pin = markerList.find((m) => m.id === pinId);
    if (pin && map) {
      map.setView([pin.lat, pin.lng], map.getZoom());
      mapCenter.set({ lat: pin.lat, lng: pin.lng });
    }
  }

  function handleSearch(
    pinId: string,
    e: CustomEvent<{ lat: number; lng: number; name: string }>
  ) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) {
        pin.lat = e.detail.lat;
        pin.lng = e.detail.lng;
        pin.name = e.detail.name.split(',')[0];
      }
      return list;
    });
    const map = get(leafletMap);
    if (map) {
      map.setView([e.detail.lat, e.detail.lng], map.getZoom());
      mapCenter.set({ lat: e.detail.lat, lng: e.detail.lng });
    }
  }

  function placeManualPin(pinId: string) {
    let center = { lat: 6.5244, lng: 3.3792 };
    mapCenter.subscribe((c) => (center = c))();
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) {
        pin.lat = center.lat;
        pin.lng = center.lng;
      }
      return list;
    });
  }

  function updateIcon(pinId: string, icon: IconType) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) pin.icon = icon;
      return list;
    });
  }

  function updateSize(pinId: string, size: PinSize) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) pin.size = size;
      return list;
    });
  }

  function updateOpacity(pinId: string, opacity: number) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) pin.opacity = opacity;
      return list;
    });
  }

  function updateColor(pinId: string, color: string) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) {
        pin.color = color;
        if (pin.label) {
          pin.label.bgColor = color;
        }
      }
      return list;
    });
  }

  function updateName(pinId: string, name: string) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) pin.name = name;
      return list;
    });
  }

  function toggleLabel(pinId: string) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin) {
        if (pin.label) {
          delete pin.label;
          showLabelControls[pinId] = false;
        } else {
          pin.label = {
            text: '',
            size: 'medium',
            bgColor: pin.color,
            bgOpacity: 100,
            offsetX: 0,
            offsetY: 0,
          };
          showLabelControls[pinId] = true;
        }
      }
      return list;
    });
  }

  function updateLabelText(pinId: string, text: string) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin?.label) {
        pin.label.text = text;
      }
      return list;
    });
  }

  function handleLabelKeydown(pinId: string, e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + '\n' + text.substring(end);
      updateLabelText(pinId, newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }

  function updateLabelSize(pinId: string, size: LabelSize) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin?.label) {
        pin.label.size = size;
      }
      return list;
    });
  }

  function updateLabelBgColor(pinId: string, color: string) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin?.label) {
        pin.label.bgColor = color;
      }
      return list;
    });
  }

  function updateLabelBgOpacity(pinId: string, opacity: number) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin?.label) {
        pin.label.bgOpacity = opacity;
      }
      return list;
    });
  }

  function nudgeLabel(
    pinId: string,
    direction: 'left' | 'right' | 'up' | 'down'
  ) {
    markers.update((list) => {
      const pin = list.find((m) => m.id === pinId);
      if (pin?.label) {
        const step = 4;
        switch (direction) {
          case 'left':
            pin.label.offsetX -= step;
            break;
          case 'right':
            pin.label.offsetX += step;
            break;
          case 'up':
            pin.label.offsetY -= step;
            break;
          case 'down':
            pin.label.offsetY += step;
            break;
        }
      }
      return list;
    });
  }

  function deletePin(pinId: string) {
    markers.update((list) => list.filter((m) => m.id !== pinId));
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

{#if markerList.length > 0}
  <div class="pin-editor">
    {#each markerList as pin (pin.id)}
      <div class="pin-container">
        <div class="pin-bar">
          <button
            class="toggle-btn"
            on:click={() => toggleExpand(pin.id)}
            aria-label={currentEditingId === pin.id ? 'Collapse' : 'Expand'}
          >
            <img
              src="/icons/{currentEditingId === pin.id
                ? 'icon-collapse.svg'
                : 'icon-expand.svg'}"
              alt=""
            />
          </button>
          <input
            type="text"
            class="pin-name-input"
            value={pin.name}
            on:input={(e) => updateName(pin.id, e.currentTarget.value)}
          />
          <button class="center-btn" on:click={() => centerMapOnPin(pin.id)} aria-label="Center map on this pin">
            <img src="/icons/icon-center.svg" alt="" />
          </button>
        </div>

        {#if currentEditingId === pin.id}
        <div class="pin-card">
          <div class="search-row">
            <div class="search-wrapper">
              <SearchBar on:select={(e) => handleSearch(pin.id, e)} />
            </div>
            <button class="pushpin-btn" on:click={() => placeManualPin(pin.id)} aria-label="Place pin manually">
              <img src="/icons/icon-pushpin-fill.svg" alt="" />
            </button>
          </div>

          <div class="icon-selector">
            {#each iconTypes as icon}
              <button
                class="icon-btn"
                class:active={pin.icon === icon}
                style="--active-color: {pin.color}"
                on:click={() => updateIcon(pin.id, icon)}
                aria-label="Select {icon}"
              >
                <img src="/icons/{ICON_FILES[icon]}" alt={icon} style="--icon-color: {pin.color}" />
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
                value={pin.size}
                on:input={(e) => updateSize(pin.id, parseInt(e.currentTarget.value) as PinSize)}
                on:mousedown={() => (isDraggingSize[pin.id] = true)}
                on:mouseup={() => (isDraggingSize[pin.id] = false)}
                on:touchstart={() => (isDraggingSize[pin.id] = true)}
                on:touchend={() => (isDraggingSize[pin.id] = false)}
                class="slider"
              />
              {#if isDraggingSize[pin.id]}
                <span class="slider-feedback">{pin.size}</span>
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
                value={pin.opacity}
                on:input={(e) => updateOpacity(pin.id, parseInt(e.currentTarget.value))}
                on:mousedown={() => (isDraggingOpacity[pin.id] = true)}
                on:mouseup={() => (isDraggingOpacity[pin.id] = false)}
                on:touchstart={() => (isDraggingOpacity[pin.id] = true)}
                on:touchend={() => (isDraggingOpacity[pin.id] = false)}
                class="slider"
              />
              {#if isDraggingOpacity[pin.id]}
                <span class="slider-feedback">{pin.opacity}%</span>
              {/if}
            </div>
          </div>

          <div class="color-row">
            {#each COLOR_PALETTE as color}
              <button
                class="color-btn"
                class:active={pin.color === color}
                class:white={color === '#FFFFFF'}
                style="background-color: {color}"
                on:click={() => updateColor(pin.id, color)}
                aria-label="Select {color} color"
              ></button>
            {/each}
          </div>

          <div class="toggle-row">
            <span class="toggle-label">Pin label</span>
            <button
              class="toggle-switch"
              class:active={showLabelControls[pin.id]}
              on:click={() => toggleLabel(pin.id)}
              aria-label="Toggle pin label"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>

          {#if showLabelControls[pin.id] && pin.label}
            <div class="label-section">
              <textarea
                class="label-input"
                placeholder="Add label text"
                value={pin.label.text}
                on:input={(e) => updateLabelText(pin.id, e.currentTarget.value)}
                on:keydown={(e) => handleLabelKeydown(pin.id, e)}
              />

              <div class="slider-group">
                <span class="slider-label">Label size</span>
                <div class="slider-wrapper">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={getLabelSizeValue(pin.label.size)}
                    on:input={(e) => updateLabelSize(pin.id, setLabelSizeFromValue(parseInt(e.currentTarget.value)))}
                    on:mousedown={() => (isDraggingLabelSize[pin.id] = true)}
                    on:mouseup={() => (isDraggingLabelSize[pin.id] = false)}
                    on:touchstart={() => (isDraggingLabelSize[pin.id] = true)}
                    on:touchend={() => (isDraggingLabelSize[pin.id] = false)}
                    class="slider"
                  />
                  {#if isDraggingLabelSize[pin.id]}
                    <span class="slider-feedback">{pin.label.size}</span>
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
                    value={pin.label.bgOpacity}
                    on:input={(e) => updateLabelBgOpacity(pin.id, parseInt(e.currentTarget.value))}
                    on:mousedown={() => (isDraggingLabelOpacity[pin.id] = true)}
                    on:mouseup={() => (isDraggingLabelOpacity[pin.id] = false)}
                    on:touchstart={() => (isDraggingLabelOpacity[pin.id] = true)}
                    on:touchend={() => (isDraggingLabelOpacity[pin.id] = false)}
                    class="slider"
                  />
                  {#if isDraggingLabelOpacity[pin.id]}
                    <span class="slider-feedback">{pin.label.bgOpacity}%</span>
                  {/if}
                </div>
              </div>

              <div class="sub-section">
                <span class="section-label">Label background</span>
                <div class="color-row">
                  {#each COLOR_PALETTE as color}
                    <button
                      class="color-btn small"
                      class:active={pin.label.bgColor === color}
                      class:white={color === '#FFFFFF'}
                      style="background-color: {color}"
                      on:click={() => updateLabelBgColor(pin.id, color)}
                      aria-label="Select {color} background"
                    ></button>
                  {/each}
                </div>
              </div>

              <div class="nudge-section">
                <span class="section-label">Nudge label</span>
                <div class="nudge-row">
                  <button class="nudge-btn" on:click={() => nudgeLabel(pin.id, 'left')} aria-label="Nudge left">
                    <img src="/icons/icon-left.svg" alt="" />
                  </button>
                  <button class="nudge-btn" on:click={() => nudgeLabel(pin.id, 'right')} aria-label="Nudge right">
                    <img src="/icons/icon-right.svg" alt="" />
                  </button>
                  <button class="nudge-btn" on:click={() => nudgeLabel(pin.id, 'up')} aria-label="Nudge up">
                    <img src="/icons/icon-up.svg" alt="" />
                  </button>
                  <button class="nudge-btn" on:click={() => nudgeLabel(pin.id, 'down')} aria-label="Nudge down">
                    <img src="/icons/icon-down.svg" alt="" />
                  </button>
                </div>
              </div>
            </div>
          {/if}

          <button class="delete-btn" on:click={() => deletePin(pin.id)}>Delete Pin</button>
        </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .pin-editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .pin-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
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
