import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import HttpBackend from 'i18next-http-backend';

const isProduction = import.meta.env.PROD;

i18n
  // Configure multiple backends: LocalStorage first, then HttpBackend
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
        HttpBackend           // Fallback (fetch from local static json)
      ],
      backendOptions: [{
        // LocalStorage backend options
        expirationTime: 24 * 60 * 60 * 1000, // 24 hours
        prefix: 'i18next_res_'}, {
        // Http backend options
        loadPath: '/locales/{{lng}}/translation.json'
      }]
    }
  });

// Handle RTL text direction dynamically
i18n.on('languageChanged', (lng) => {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(lng.split('-')[0]);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
