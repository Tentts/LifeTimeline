import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import i18n from './i18n';
import { DISCLAIMER_STORAGE_KEY } from './components/DisclaimerBanner';
import { serializeTimeline } from './format/tl';
import { createTimeline } from './model/factory';
import { deleteAllData, listTimelines, saveTimeline } from './storage/db';

async function createTimelineThroughUi(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'New timeline' }));
  const dialog = screen.getByRole('dialog', { name: 'New timeline' });
  await user.type(within(dialog).getByLabelText(/Title/), 'My life');
  await user.type(within(dialog).getByLabelText('Year'), '1990');
  return dialog;
}

describe('App', () => {
  beforeEach(async () => {
    await deleteAllData();
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

  it('requires acknowledging the privacy notice before creating a timeline', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await createTimelineThroughUi(user);

    expect(within(dialog).getByText(/We never receive or store your timeline/)).toBeInTheDocument();
    const create = screen.getByRole('button', { name: 'Create timeline' });
    expect(create).toBeDisabled();

    await user.click(within(dialog).getByLabelText(/I understand that my timeline is stored only/));
    expect(create).toBeEnabled();
    await user.click(create);

    expect(await screen.findByRole('heading', { level: 2, name: 'My life' })).toBeInTheDocument();
    await waitFor(async () => expect(await listTimelines()).toHaveLength(1));
  });

  it('adds an event, shows it in the list and saves it in the browser', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await createTimelineThroughUi(user);
    await user.click(within(dialog).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create timeline' }));

    await user.click(await screen.findByRole('button', { name: '+ Add event' }));
    const eventDialog = screen.getByRole('dialog', { name: 'Add an event' });
    await user.type(within(eventDialog).getByLabelText(/What happened/), 'Started school');
    const year = within(eventDialog).getByLabelText('Year');
    await user.clear(year);
    await user.type(year, '1996');
    await user.click(within(eventDialog).getByLabelText('This was a turning point'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const list = screen.getByRole('list');
    expect(within(list).getByRole('button', { name: 'Started school' })).toBeInTheDocument();
    expect(within(list).getByText('Turning point')).toBeInTheDocument();
    await waitFor(async () => expect((await listTimelines())[0].eventCount).toBe(1));
  });

  it('opens a .tl file', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Imported life', birthDate: { year: 1980 } });
    render(<App />);

    const file = new File([serializeTimeline(timeline)], 'imported.tl');
    await user.upload(screen.getByTestId('open-tl-input'), file);

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Imported life' }),
    ).toBeInTheDocument();
  });

  it('explains why an invalid file cannot be opened', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.upload(screen.getByTestId('open-tl-input'), new File(['nope'], 'bad.tl'));
    expect(
      await screen.findByRole('dialog', { name: 'This file couldn’t be opened' }),
    ).toBeInTheDocument();
  });

  it('asks before replacing a timeline that already exists', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Twin', birthDate: { year: 1980 } });
    await saveTimeline(timeline);
    render(<App />);

    await user.upload(
      screen.getByTestId('open-tl-input'),
      new File([serializeTimeline(timeline)], 'twin.tl'),
    );
    await user.click(await screen.findByRole('button', { name: 'Keep both' }));

    await waitFor(async () => expect(await listTimelines()).toHaveLength(2));
  });

  it('deletes all data from the Privacy page', async () => {
    const user = userEvent.setup();
    await saveTimeline(createTimeline({ title: 'To delete', birthDate: { year: 1980 } }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Privacy' }));
    await user.click(screen.getByRole('button', { name: 'Delete all my data from this browser' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete all your data?' });
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete all my data from this browser' }),
    );

    expect(
      await screen.findByText('All data has been deleted from this browser.'),
    ).toBeInTheDocument();
    expect(await listTimelines()).toEqual([]);
  });
});
