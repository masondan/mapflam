<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { searchQuery, searchResults, isSearching } from '../stores';
  import { searchLocations } from '../services/nominatim';
  import type { NominatimResult } from '../types';

  const dispatch = createEventDispatcher<{ select: { lat: number; lng: number; name: string } }>();

  let debounceTimer: ReturnType<typeof setTimeout>;
  let showDropdown = false;
  let inputElement: HTMLInputElement;
  let query = '';

  async function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    query = target.value.trim();

    searchQuery.set(query);
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      searchResults.set([]);
      showDropdown = false;
      return;
    }

    showDropdown = true;
  }

  async function triggerSearch() {
    if (query.length < 2) return;
    
    isSearching.set(true);
    try {
      const results = await searchLocations(query);
      searchResults.set(results);
      showDropdown = true;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.set([]);
    } finally {
      isSearching.set(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  }

  function selectResult(result: NominatimResult) {
    dispatch('select', {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name,
    });

    query = '';
    searchQuery.set('');
    searchResults.set([]);
    showDropdown = false;
    if (inputElement) inputElement.value = '';
  }

  function handleFocus() {
    if ($searchResults.length > 0) {
      showDropdown = true;
    }
  }

  function handleBlur() {
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }

  $: if (query.length >= 2) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerSearch, 300);
  }
</script>

<div class="search-bar">
  <div class="input-wrapper">
    <input
      bind:this={inputElement}
      type="text"
      placeholder="Search or tap pin to add"
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
      class="search-input"
    />
    <button class="search-btn" on:click={triggerSearch} aria-label="Search">
      <img src="/icons/icon-go.svg" alt="" />
    </button>
  </div>

  {#if showDropdown && $searchResults.length > 0}
    <ul class="results-dropdown">
      {#each $searchResults as result (result.place_id)}
        <li>
          <button class="result-item" on:click={() => selectResult(result)}>
            <span class="result-name">{result.display_name.split(',').slice(0, 2).join(', ')}</span>
            <span class="result-full">{result.display_name}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if showDropdown && query.length >= 2 && !$isSearching && $searchResults.length === 0}
    <div class="no-results">No results found</div>
  {:else if showDropdown && $isSearching}
    <div class="searching">Searching...</div>
  {/if}
</div>

<style>
  .search-bar {
    position: relative;
    width: 100%;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    overflow: hidden;
  }

  .search-input {
    flex: 1;
    padding: 10px var(--spacing-md);
    border: none;
    font-size: 14px;
    font-family: inherit;
    background-color: transparent;
    color: var(--color-text-dark);
  }

  .search-input:focus {
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-light);
  }

  .search-btn {
    width: 40px;
    height: 40px;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .search-btn img {
    width: 20px;
    height: 20px;
    filter: brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(89%);
  }

  .results-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 50;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    background-color: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 150ms ease;
    border-bottom: 1px solid #eee;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover {
    background-color: var(--color-brand-light);
  }

  .result-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-dark);
  }

  .result-full {
    font-size: 12px;
    color: var(--color-text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .no-results,
  .searching {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    padding: var(--spacing-md);
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--color-text-light);
    text-align: center;
    z-index: 50;
  }
</style>
