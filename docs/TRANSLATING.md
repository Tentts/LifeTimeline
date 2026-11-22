# Translating Life Timeline

All user-facing text lives in one JSON file per language in
[`src/i18n/locales/`](../src/i18n/locales/). **English (`en.json`) is the source of truth.**

## Add a new language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json`, using an
   [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) such as `fr`, `pt`, `de`.
2. Set `meta.nativeName` to the language's own name (e.g. `"Français"`). This is what the
   language selector shows.
3. Translate every value. **Do not** change the keys, and keep any `{{placeholders}}` unchanged.
4. Run `npm test`. The locale tests fail if a key is missing, extra, empty, or a placeholder differs.

That's all. New files are picked up automatically; there's no list to update.

## Add or change text in the app

1. Add the key to `en.json` first. Keys are grouped by screen or feature (`home.*`, `disclaimer.*`…).
2. Use it in a component with `const { t } = useTranslation();` and `t('home.heading')`.
   Keys are type-checked against `en.json`, so a typo fails the build.
3. Add the same key to every other locale file. `npm test` will tell you which ones are missing.

## Guidelines

- This app touches sensitive, personal topics. Prefer a warm, non-clinical, non-judgemental tone.
- Use inclusive / gender-neutral wording where the language allows it.
- Never hard-code user-visible strings in components.
