import 'i18next';
import type { TranslationResource } from './languages';

// Makes t('some.key') type-checked against en.json: typos fail the build.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResource };
  }
}
