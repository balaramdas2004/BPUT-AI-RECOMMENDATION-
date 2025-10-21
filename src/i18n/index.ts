import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import or from './locales/or.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      or: { translation: or }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
