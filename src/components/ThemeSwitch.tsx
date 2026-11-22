import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getActiveTheme, saveTheme, watchSystemTheme, type Theme } from '../theme/theme';

/** Sun/moon switch between the light and dark themes. */
export function ThemeSwitch() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(getActiveTheme);

  useEffect(() => watchSystemTheme(setTheme), []);

  const isDark = theme === 'dark';
  const toggle = () => {
    const next: Theme = isDark ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className="theme-switch"
      onClick={toggle}
      title={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
    >
      <span className="theme-switch-label">{t('theme.dark')}</span>
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-thumb">{isDark ? '🌙' : '☀️'}</span>
      </span>
    </button>
  );
}
