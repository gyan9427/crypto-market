import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { buildI18nextResources } from '@/src/i18n/localeResources';

void i18next.use(initReactI18next).init({
  resources: buildI18nextResources(),
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18next;
