import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '@/src/i18n/resources/en';
import { hi, ta, te, kn, ml, bn, mr } from '@/src/i18n/resources/regional';

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te },
    kn: { translation: kn },
    ml: { translation: ml },
    bn: { translation: bn },
    mr: { translation: mr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18next;
