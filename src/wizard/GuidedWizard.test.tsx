import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { createTimeline } from '../model/factory';
import { deleteAllData, getTimeline, saveTimeline } from '../storage/db';
import { dateTriggers, enterYear } from '../test/dates';
import { loadProgress, saveProgress } from './stages';

async function openTimeline(user: ReturnType<typeof userEvent.setup>, title: string) {
  render(<App />);
  await user.click(await screen.findByRole('button', { name: title }));
}

describe('guided walkthrough', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it('is offered on an empty timeline and walks through life stages', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 1990 } });
    await saveTimeline(timeline);
    await openTimeline(user, 'Guided');

    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Guided walkthrough' })[0]);

    expect(
      screen.getByRole('heading', { name: 'Let’s walk through your life together' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Start →' }));
    expect(screen.getByRole('heading', { name: 'Early childhood' })).toBeInTheDocument();
    expect(screen.getByText('Ages 0–5 · 1990–1995')).toBeInTheDocument();
    expect(screen.getByText('What is your earliest memory?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByRole('heading', { name: 'Childhood' })).toBeInTheDocument();
  });

  it('adds an event pre-filled with the stage’s first year', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 1990 } });
    await saveTimeline(timeline);
    await openTimeline(user, 'Guided');
    await user.click(screen.getAllByRole('button', { name: 'Guided walkthrough' })[0]);
    await user.click(screen.getByRole('button', { name: 'Start →' }));
    await user.click(screen.getByRole('button', { name: 'Next →' })); // childhood

    await user.click(screen.getByRole('button', { name: '+ Add an event from this time' }));
    const dialog = screen.getByRole('dialog', { name: 'Add an event' });
    expect(dateTriggers(dialog)[0]).toHaveTextContent('1996');
    await user.type(within(dialog).getByLabelText(/What happened/), 'First day of school');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    const wizard = screen.getByRole('region', { name: 'Childhood' });
    expect(within(wizard).getByRole('button', { name: 'First day of school' })).toBeInTheDocument();
    await waitFor(async () => expect((await getTimeline(timeline.id))?.events).toHaveLength(1));
  });

  it('remembers where you took a break and continues there', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 1990 } });
    await saveTimeline(timeline);
    await openTimeline(user, 'Guided');
    await user.click(screen.getAllByRole('button', { name: 'Guided walkthrough' })[0]);
    await user.click(screen.getByRole('button', { name: 'Start →' }));
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    await user.click(screen.getByRole('button', { name: 'Take a break' }));

    expect(screen.queryByRole('heading', { name: 'Childhood' })).not.toBeInTheDocument();
    expect(loadProgress(timeline.id)).toBe('stage:childhood');

    await user.click(screen.getByRole('button', { name: 'Continue walkthrough' }));
    expect(screen.getByRole('heading', { name: 'Childhood' })).toBeInTheDocument();
  });

  it('survives a birth date change that removes steps', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 1950 } });
    await saveTimeline(timeline);
    saveProgress(timeline.id, 'finish');
    await openTimeline(user, 'Guided');
    await user.click(screen.getByRole('button', { name: 'Continue walkthrough' }));

    await user.click(screen.getByRole('button', { name: 'Details' }));
    const dialog = screen.getByRole('dialog', { name: 'Timeline details' });
    await enterYear(user, dialog, '2015');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'You’ve walked through your whole timeline' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(loadProgress(timeline.id)).toBeNull();
  });

  it('forgets the saved position when the timeline is deleted', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 1990 } });
    await saveTimeline(timeline);
    saveProgress(timeline.id, 'stage:childhood');
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Delete “Guided”' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this timeline?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(loadProgress(timeline.id)).toBeNull());
  });

  it('offers key moments and clears progress when finished', async () => {
    const user = userEvent.setup();
    const timeline = createTimeline({ title: 'Guided', birthDate: { year: 2015 } });
    await saveTimeline(timeline);
    await openTimeline(user, 'Guided');
    await user.click(screen.getAllByRole('button', { name: 'Guided walkthrough' })[0]);
    await user.click(screen.getByRole('button', { name: 'Start →' }));
    await user.click(screen.getByRole('button', { name: 'Next →' })); // early childhood → childhood
    await user.click(screen.getByRole('button', { name: 'Next →' })); // → key moments

    expect(screen.getByRole('heading', { name: 'Key moments' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Add a turning point' }));
    const dialog = screen.getByRole('dialog', { name: 'Add an event' });
    expect(within(dialog).getByLabelText('This was a turning point')).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByRole('heading', { name: 'You’ve walked through your whole timeline' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(loadProgress(timeline.id)).toBeNull();
    // Header button (and the invitation card, since this timeline is still empty)
    expect(screen.getAllByRole('button', { name: 'Guided walkthrough' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Continue walkthrough' })).not.toBeInTheDocument();
  });
});
