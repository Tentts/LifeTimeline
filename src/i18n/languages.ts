import type en from './locales/en.json';

/** Shape every locale file must follow — English is the source of truth. */
export type TranslationResource = typeof en;

export const DEFAULT_LANGUAGE = 'en';

/**
 * Every `locales/<code>.json` file is picked up automatically.
 * To add a language, drop a new JSON file in `locales/` — nothing else to register.
 */
const modules = import.meta.glob<TranslationResource>('./locales/*.json', {
  eager: true,
  import: 'default',
});

export const resources: Record<string, TranslationResource> = Object.fromEntries(
  Object.entries(modules).map(([path, resource]) => [
    path.replace(/^.*\/([^/]+)\.json$/, '$1'),
    resource,
  ]),
);

export interface LanguageOption {
  code: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = Object.entries(resources)
  .map(([code, resource]) => ({ code, nativeName: resource.meta.nativeName }))
  .sort((a, b) =>
    a.code === DEFAULT_LANGUAGE
      ? -1
      : b.code === DEFAULT_LANGUAGE
        ? 1
        : a.code.localeCompare(b.code),
  );
