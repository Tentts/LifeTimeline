/**
 * Light/dark theme. Until the user flips the switch we follow the device setting;
 * after that, their choice is remembered in this browser (localStorage only).
 * public/theme-init.js applies the same logic before first paint.
 */
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'lifetimeline.theme';

const systemQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export function getSavedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return systemQuery()?.matches ? 'dark' : 'light';
}

export function getActiveTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' || attr === 'dark' ? attr : (getSavedTheme() ?? getSystemTheme());
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function saveTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable: the switch still works for this visit.
  }
}

/** Follows device changes while the user hasn't chosen a theme. Returns an unsubscribe function. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = systemQuery();
  if (!query) return () => {};
  const listener = () => {
    if (getSavedTheme() === null) {
      const theme = getSystemTheme();
      applyTheme(theme);
      onChange(theme);
    }
  };
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
