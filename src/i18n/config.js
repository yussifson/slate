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
  const selectElement = document.querySelector('.goog-te-combo');
  if (selectElement) {
    let googleCode = lng.split('-')[0];
    if (googleCode === 'zh') googleCode = 'zh-CN';
    selectElement.value = googleCode;
    selectElement.dispatchEvent(new Event('change'));
  } else {
    // Retry in case widget hasn't fully loaded yet
    setTimeout(() => {
      const retrySelect = document.querySelector('.goog-te-combo');
      if (retrySelect) {
        let googleCode = lng.split('-')[0];
        if (googleCode === 'zh') googleCode = 'zh-CN';
        retrySelect.value = googleCode;
        retrySelect.dispatchEvent(new Event('change'));
      }
    }, 500);
  }
});

export default i18n;
