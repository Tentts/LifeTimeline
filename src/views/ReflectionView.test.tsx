import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { parseTimelineFile, serializeTimeline } from '../format/tl';
import i18n from '../i18n';
import { createTimeline } from '../model/factory';
import type { LifeEvent } from '../model/schema';
import { deleteAllData, getTimeline, saveTimeline } from '../storage/db';

const event = (id: string, year: number, valence: number, isTurningPoint = false): LifeEvent => ({
  id,
  title: id,
  start: { year },
  valence,
  tags: [],
  people: [],
  isTurningPoint: isTurningPoint || undefined,
});

async function openReflection() {
  const user = userEvent.setup();
  const timeline = createTimeline({ title: 'Reflective', birthDate: { year: 1990 } });
  timeline.events = [event('Joy', 2000, 5), event('Loss', 2005, -4), event('Moved', 2010, 2, true)];
  await saveTimeline(timeline);
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Reflective' }));
  await user.click(screen.getByRole('button', { name: 'Reflect' }));
  return { user, timeline };
}

describe('reflection page', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it('summarises high point, low point and turning points', async () => {
    await openReflection();
    const section = screen.getByRole('region', { name: 'Reflect on your story' });
    expect(within(section).getByRole('button', { name: 'Joy (+5)' })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Loss (-4)' })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Moved' })).toBeInTheDocument();
  });

  it('saves answers, and removes them when cleared', async () => {
    const { user, timeline } = await openReflection();
    const field = screen.getByLabelText('What matters most to you now?');
    await user.type(field, 'Family');
    await waitFor(async () =>
      expect((await getTimeline(timeline.id))?.reflectionAnswers?.values).toBe('Family'),
    );
    await user.clear(field);
    await waitFor(async () =>
      expect((await getTimeline(timeline.id))?.reflectionAnswers).toBeUndefined(),
    );
  });

  it('returns to the timeline', async () => {
    const { user } = await openReflection();
    await user.click(screen.getByRole('button', { name: '← Back to timeline' }));
    expect(screen.getByRole('region', { name: 'Chapters' })).toBeInTheDocument();
  });

  it('keeps answers in .tl files', () => {
    const timeline = createTimeline({ title: 'T', birthDate: { year: 1990 } });
    timeline.reflectionAnswers = { themes: 'Resilience' };
    timeline.reflection = 'A note';
    const result = parseTimelineFile(serializeTimeline(timeline));
    expect(result.ok && result.timeline.reflectionAnswers).toEqual({ themes: 'Resilience' });
    expect(result.ok && result.timeline.reflection).toBe('A note');
  });
});
