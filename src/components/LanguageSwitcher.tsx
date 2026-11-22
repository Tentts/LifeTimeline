import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const id = useId();

  return (
    <div className="language-switcher">
      <label htmlFor={id}>{t('language.label')}</label>
      <select
        id={id}
        value={i18n.resolvedLanguage}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
      >
        {SUPPORTED_LANGUAGES.map(({ code, nativeName }) => (
          <option key={code} value={code} lang={code}>
            {nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
