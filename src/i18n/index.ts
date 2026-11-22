import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, resources } from './languages';

export const LANGUAGE_STORAGE_KEY = 'lifetimeline.language';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(resources).map(([code, translation]) => [code, { translation }]),
    ),
    supportedLngs: Object.keys(resources),
    nonExplicitSupportedLngs: true, // "es-MX" -> "es"
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      // Saved choice first, then the browser's language. Never sent anywhere.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = lng;
};
syncHtmlLang(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', () => syncHtmlLang(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE));

export default i18n;
