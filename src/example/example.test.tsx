import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { createTimeline } from '../model/factory';
import { timelineSchema } from '../model/schema';
import { deleteAllData, listTimelines, saveTimeline } from '../storage/db';
import { buildExampleTimeline, EXAMPLE_ID } from './exampleTimeline';

describe('example timeline', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it.each(['en', 'es'])('is a valid timeline in %s', async (language) => {
    await i18n.changeLanguage(language);
    const parsed = timelineSchema.safeParse(buildExampleTimeline(i18n.t));
    expect(parsed.success).toBe(true);
    expect(parsed.data?.events.every((e) => !e.title.startsWith('example.'))).toBe(true);
  });

  it('is shown on a first visit without saving anything', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'What a Life Timeline looks like' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Alex’s life/ })).toBeInTheDocument();
    expect(await listTimelines()).toEqual([]);
  });

  it('steps aside for returning users but stays reachable', async () => {
    const user = userEvent.setup();
    await saveTimeline(createTimeline({ title: 'Mine', birthDate: { year: 1990 } }));
    render(<App />);
    await screen.findByRole('button', { name: 'Mine' });
    expect(screen.queryByRole('heading', { name: 'What a Life Timeline looks like' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'See an example' }));
    expect(screen.getByRole('heading', { name: 'Alex’s life (example)' })).toBeInTheDocument();
  });

  it('is read-only until copied, and the copy is independent', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Explore the example' }));
    expect(screen.getByRole('heading', { name: 'Changed careers' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Changed careers' })).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add event' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Make an editable copy' }));
    expect(await screen.findByRole('button', { name: '+ Add event' })).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await listTimelines();
      expect(saved).toHaveLength(1);
      expect(saved[0].id).not.toBe(EXAMPLE_ID);
      expect(saved[0].eventCount).toBe(10);
    });
  });

  it('leads to creating your own timeline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Explore the example' }));
    await user.click(screen.getByRole('button', { name: 'Create my own timeline' }));
    expect(screen.getByRole('dialog', { name: 'New timeline' })).toBeInTheDocument();
  });
});
