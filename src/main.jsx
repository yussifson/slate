import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'
import i18n from '@/i18n/config.js'
import { I18nextProvider } from 'react-i18next'
import { CapacitorUpdater } from '@capgo/capacitor-updater';


CapacitorUpdater.notifyAppReady();

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, refreshing...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  }})

// Listen for Vite chunk loading errors (e.g. when Vercel deploys a new version and old chunks are missing)
// If this happens, force reload to fetch the new index.html and fresh bundles.
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (chunk missing). Forcing hard reload...');
  window.location.reload(true);
});

window.addEventListener('unhandledrejection', async (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('importScripts') && event.reason.message.includes('workbox')) {
    console.warn('Workbox importScripts failed.');
    // CAUTION: Do not unregister the service worker if offline, as reloading will show the Dinosaur error.
    if (!navigator.onLine) {
      console.log('Currently offline, ignoring Workbox update failure.');
      return;
    }
    console.warn('Forcing service worker unregistration and reload.');
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      window.location.reload(true);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
        <App />
    </I18nextProvider>
  </ErrorBoundary>
)
