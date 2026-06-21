import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en'], // Let Google Translate handle all other languages
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
    
    // Empty resources so it always falls back to the default text provided in t()
    resources: {
      en: {
        translation: {}
      }
    }
  });

// Handle RTL text direction and Google Translate Widget dynamically
i18n.on('languageChanged', (lng) => {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(lng.split('-')[0]);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;

  // Trigger Google Translate Widget
  const triggerGoogleTranslate = (langCode) => {
    const select = document.querySelector('.goog-te-combo');
    if (!select) return false;
    
    select.value = langCode;
    
    // Force the event with proper bubbling
    const event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, true);
    select.dispatchEvent(event);
    
    // Explicitly set cookie so Google picks it up reliably without double-click
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    
    return true;
  };

  let googleCode = lng.split('-')[0];
  if (googleCode === 'zh') googleCode = 'zh-CN';
  
  if (!triggerGoogleTranslate(googleCode)) {
    // Retry in case widget hasn't fully loaded yet
    setTimeout(() => {
      triggerGoogleTranslate(googleCode);
    }, 500);
  }
});

export default i18n;
