import { mount } from 'svelte';
import App from './app.svelte';

mount(App, {
  target: document.getElementById('app')!,
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {
    // Silently fail if service worker registration fails
  });
}

// Suppress PWA install prompt
let deferredPrompt: Event | null = null;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Prevent the mini-infobar from showing on mobile
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});
