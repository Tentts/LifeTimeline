import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../i18n';
import { deleteAllData } from '../storage/db';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { ThemeSwitch } from './ThemeSwitch';

function mockSystemTheme(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('ThemeSwitch', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    document.documentElement.removeAttribute('data-theme');
  });

  it('follows the device setting until the user chooses', () => {
    mockSystemTheme(true);
    render(<ThemeSwitch />);
    expect(screen.getByRole('switch', { name: /Dark mode/ })).toBeChecked();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('switches theme, applies it to the page and remembers it', async () => {
    mockSystemTheme(false);
    render(<ThemeSwitch />);
    const toggle = screen.getByRole('switch', { name: /Dark mode/ });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await userEvent.click(toggle);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('is cleared by "delete all my data"', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    await deleteAllData();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
