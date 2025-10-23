import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationIT from './locales/it/translation.json';
import translationEN from './locales/en/translation.json';
import translationDE from './locales/de/translation.json';
import translationFR from './locales/fr/translation.json'; // Import French translations

const resources = {
  it: { translation: translationIT },
  en: { translation: translationEN },
  de: { translation: translationDE },
  fr: { translation: translationFR },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'it',
    fallbackLng: 'it',
    interpolation: { escapeValue: false },
  });

// ✅ Funzione semplificata per proteggere le traduzioni
export function getSafeTranslation(
  t: (key: string) => string,
  key: string,
  fallback?: string
): string {
  const translated = t(key);
  return translated === key ? fallback || key : translated;
}

export default i18n;