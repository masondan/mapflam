<script lang="ts">
  import { searchQuery, searchResults, isSearching } from '../stores';
  import { searchLocations } from '../services/nominatim';
  import type { NominatimResult } from '../types';

  let debounceTimer: ReturnType<typeof setTimeout>;
  let showDropdown = false;
  let inputElement: HTMLInputElement;

  async function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const query = target.value.trim();

    searchQuery.set(query);
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      searchResults.set([]);
      showDropdown = false;
      return;
    }

    showDropdown = true;
    isSearching.set(true);

    debounceTimer = setTimeout(async () => {
      try {
        const results = await searchLocations(query);
        searchResults.set(results);
      } catch (error) {
        console.error('Search error:', error);
        searchResults.set([]);
      } finally {
        isSearching.set(false);
      }
    }, 300);
  }

  function selectResult(result: NominatimResult) {
    // Dispatch event for parent to handle selection
    const event = new CustomEvent('select', {
      detail: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      },
    });
    window.dispatchEvent(event);

    // Reset UI
    searchQuery.set('');
    searchResults.set([]);
    showDropdown = false;
    if (inputElement) inputElement.value = '';
  }

  function handleFocus() {
    showDropdown = true;
  }

  function handleBlur() {
    // Delay to allow click on results
    setTimeout(() => {
      showDropdown = false;
    }, 150);
  }
</script>

<div class="search-bar-wrapper">
  <div class="search-input-container">
    <input
      bind:this={inputElement}
      type="text"
      placeholder="Search location..."
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      class="search-input"
    />
    {#if $isSearching}
      <span class="search-loading">Searching...</span>
    {/if}
  </div>

  {#if showDropdown && $searchResults.length > 0}
    <ul class="search-results">
      {#each $searchResults as result (result.place_id)}
        <li>
          <button class="result-item" on:click={() => selectResult(result)}>
            <span class="result-name">{result.display_name}</span>
            <span class="result-coords">{parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if showDropdown && $searchQuery.length >= 2 && !$isSearching && $searchResults.length === 0}
    <div class="search-empty">No results found</div>
  {/if}
</div>

<style>
  .search-bar-wrapper {
    position: relative;
    width: 100%;
  }

  .search-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    background-color: var(--color-white);
    color: var(--color-text-primary);
    transition: border-color 200ms ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-brand);
    box-shadow: 0 0 0 2px rgba(84, 34, 176, 0.1);
  }

  .search-input::placeholder {
    color: var(--color-text-light);
  }

  .search-loading {
    position: absolute;
    right: var(--spacing-md);
    font-size: 12px;
    color: var(--color-text-light);
    pointer-events: none;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0 0;
    padding: 0;
    list-style: none;
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 240px;
    overflow-y: auto;
    z-index: 10;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: var(--spacing-md);
    border: none;
    background-color: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .result-item:hover {
    background-color: var(--color-brand-light);
  }

  .result-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-dark);
    margin-bottom: 2px;
  }

  .result-coords {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .search-empty {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    padding: var(--spacing-md);
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--color-text-light);
    text-align: center;
  }
</style>
