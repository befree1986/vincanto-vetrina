import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationIT from './locales/it/translation_it.json';
import translationEN from './locales/en/translation_en.json';
import translationDE from './locales/de/translation_de.json';
import translationFR from './locales/fr/translation_fr.json';

const resources = {
  it: { translation: translationIT },
  en: { translation: translationEN },
  de: { translation: translationDE },
  fr: { translation: translationFR },
};

export const SUPPORTED_LANGS = ['it', 'en', 'de', 'fr'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

// Rileva la lingua dal prefisso URL (/en/, /de/, /fr/)
// IT è il default e non ha prefisso (vincantomaiori.it/)
export function detectLangFromPath(pathname: string): SupportedLang {
  const first = pathname.split('/').filter(Boolean)[0];
  if (first && SUPPORTED_LANGS.includes(first as SupportedLang) && first !== 'it') {
    return first as SupportedLang;
  }
  return 'it';
}

// Rimuove il prefisso lingua dal path (/en/privacy-policy → /privacy-policy)
export function stripLangPrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] && SUPPORTED_LANGS.includes(segments[0] as SupportedLang) && segments[0] !== 'it') {
    const rest = segments.slice(1).join('/');
    return '/' + rest;
  }
  return pathname || '/';
}

// Aggiunge prefisso lingua a un path (/privacy-policy → /en/privacy-policy)
export function addLangPrefix(pathname: string, lang: SupportedLang): string {
  if (lang === 'it') return stripLangPrefix(pathname);
  const clean = stripLangPrefix(pathname);
  return '/' + lang + (clean === '/' ? '' : clean);
}

const detectedLang = detectLangFromPath(window.location.pathname);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectedLang,
    fallbackLng: 'it',
    interpolation: { escapeValue: false },
  });

export function getSafeTranslation(
  t: (key: string) => string,
  key: string,
  fallback?: string
): string {
  const translated = t(key);
  return translated === key ? fallback || key : translated;
}

export default i18n;