import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import LocizeBackend from 'i18next-locize-backend';

const isProduction = import.meta.env.PROD;

// Default local translations for fallback while offline
const fallbackTranslations = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "loading": "Loading...",
      "error": "An error occurred",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
    }
  }
};

i18n
  // Configure multiple backends: LocalStorage first, then Locize
  .use(ChainedBackend)
  // Detect user language automatically
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'ar', 'he', 'de', 'pt', 'zh', 'ja'], // Extend as needed
    debug: !isProduction,
    
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },

    backend: {
      backends: [
        LocalStorageBackend,  // Primary (local cache)
        LocizeBackend         // Fallback (fetch from locize)
      ],
      backendOptions: [{
        // LocalStorage backend options
        expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        prefix: 'i18next_res_',
      }, {
        // Locize backend options
        projectId: import.meta.env.VITE_LOCIZE_PROJECT_ID || 'demo-project-id',
        apiKey: import.meta.env.VITE_LOCIZE_API_KEY || '', 
        referenceLng: 'en',
      }]
    },
    
    // Add default translations to prevent UI breaking if both locize and cache fail
    resources: fallbackTranslations,
    partialBundledLanguages: true
  });

// Handle RTL text direction dynamically
i18n.on('languageChanged', (lng) => {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(lng.split('-')[0]);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
