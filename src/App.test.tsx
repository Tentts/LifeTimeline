import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import i18n from './i18n';
import { DISCLAIMER_STORAGE_KEY } from './components/DisclaimerBanner';

describe('App', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders in English by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Life Timeline' })).toBeInTheDocument();
  });

  it('switches to Spanish from the language selector', async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'es');
    expect(screen.getByRole('heading', { level: 1, name: 'Línea de Vida' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
  });

  it('hides the disclaimer once accepted and remembers it', async () => {
    const { unmount } = render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'I understand' }));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBe('true');

    unmount();
    render(<App />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
