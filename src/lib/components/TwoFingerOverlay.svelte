<script lang="ts">
  export let visible = false;
</script>

{#if visible}
  <div class="overlay">
    <div class="gesture-hint">
      <svg class="hands" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="hand left-hand">
          <circle cx="25" cy="30" r="8" fill="currentColor"/>
          <rect x="22" y="30" width="6" height="20" rx="3" fill="currentColor"/>
        </g>
        <g class="hand right-hand">
          <circle cx="75" cy="30" r="8" fill="currentColor"/>
          <rect x="72" y="30" width="6" height="20" rx="3" fill="currentColor"/>
        </g>
      </svg>
      <span class="hint-text">Use two fingers to move the map</span>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    pointer-events: none;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .gesture-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: white;
  }

  .hands {
    width: 80px;
    height: 48px;
    color: white;
  }

  .hand {
    animation: pinch 1.5s ease-in-out infinite;
  }

  .left-hand {
    transform-origin: 25px 30px;
  }

  .right-hand {
    transform-origin: 75px 30px;
  }

  @keyframes pinch {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(10px);
    }
  }

  .left-hand {
    animation: pinchLeft 1.5s ease-in-out infinite;
  }

  .right-hand {
    animation: pinchRight 1.5s ease-in-out infinite;
  }

  @keyframes pinchLeft {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(10px);
    }
  }

  @keyframes pinchRight {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-10px);
    }
  }

  .hint-text {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    font-family: 'Inter', sans-serif;
  }
</style>
