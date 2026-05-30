import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'
import i18n from '@/i18n/config.js'
import { I18nextProvider } from 'react-i18next'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, refreshing...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  },
})

// Listen for Vite chunk loading errors (e.g. when Vercel deploys a new version and old chunks are missing)
// If this happens, force reload to fetch the new index.html and fresh bundles.
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (chunk missing). Forcing hard reload...');
  window.location.reload(true);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </ErrorBoundary>
)
