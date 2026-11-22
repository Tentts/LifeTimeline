import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { deleteAllData } from '../storage/db';

describe('About page', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it('opens from the footer, links to GitHub and goes back', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'About' }));

    expect(screen.getByRole('heading', { name: 'About Life Timeline' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Tentts on GitHub' });
    expect(link).toHaveAttribute('href', 'https://github.com/Tentts');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.queryByRole('heading', { name: 'About Life Timeline' })).toBeNull();
  });

  it('can switch directly between Privacy and About', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Privacy' }));
    await user.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('heading', { name: 'About Life Timeline' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your privacy' })).toBeNull();
  });
});
