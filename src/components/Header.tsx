import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitch } from './ThemeSwitch';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">{t('app.title')}</h1>
        <p className="app-tagline">{t('app.tagline')}</p>
      </div>
      <div className="header-controls">
        <ThemeSwitch />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
