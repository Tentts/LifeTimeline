import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { parseTimelineFile, serializeTimeline } from '../format/tl';
import i18n from '../i18n';
import { createTimeline } from '../model/factory';
import { deleteAllData, getTimeline, saveTimeline } from '../storage/db';

async function openWithChapters(periods: Parameters<typeof withPeriods>[0] = []) {
  const user = userEvent.setup();
  const timeline = withPeriods(periods);
  await saveTimeline(timeline);
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Chaptered' }));
  return { user, timeline };
}

function withPeriods(periods: { id: string; name: string; from: number; to?: number }[]) {
  const timeline = createTimeline({ title: 'Chaptered', birthDate: { year: 1990 } });
  timeline.periods = periods.map(({ id, name, from, to }) => ({
    id,
    name,
    start: { year: from },
    end: to === undefined ? undefined : { year: to },
  }));
  return timeline;
}

describe('chapters', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it('adds a chapter, lists it, draws it and saves it', async () => {
    const { user, timeline } = await openWithChapters();
    await user.click(screen.getByRole('button', { name: '+ Add chapter' }));
    const dialog = screen.getByRole('dialog', { name: 'Add a chapter' });
    await user.type(within(dialog).getByLabelText(/Chapter name/), 'University');
    const [from, until] = within(dialog).getAllByLabelText('Year');
    await user.type(from, '2008');
    await user.type(until, '2012');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    const section = screen.getByRole('region', { name: 'Chapters' });
    expect(within(section).getByRole('button', { name: 'University' })).toBeInTheDocument();
    expect(within(section).getByText(/2008 – 2012/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Lifeline graph/ })).toHaveTextContent('University');
    await waitFor(async () => {
      expect((await getTimeline(timeline.id))?.periods[0]).toMatchObject({
        name: 'University',
        start: { year: 2008 },
        end: { year: 2012 },
      });
    });
  });

  it('supports a chapter that is still going on', async () => {
    const { user } = await openWithChapters();
    await user.click(screen.getByRole('button', { name: '+ Add chapter' }));
    const dialog = screen.getByRole('dialog', { name: 'Add a chapter' });
    await user.type(within(dialog).getByLabelText(/Chapter name/), 'Living abroad');
    await user.type(within(dialog).getAllByLabelText('Year')[0], '2020');
    await user.click(within(dialog).getByLabelText('This chapter is still going on'));
    expect(within(dialog).getAllByLabelText('Year')).toHaveLength(1);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/2020 – today/)).toBeInTheDocument();
  });

  it('explains invalid date ranges and does not save them', async () => {
    const { user, timeline } = await openWithChapters();
    await user.click(screen.getByRole('button', { name: '+ Add chapter' }));
    const dialog = screen.getByRole('dialog', { name: 'Add a chapter' });
    await user.type(within(dialog).getByLabelText(/Chapter name/), 'Backwards');
    const [from, until] = within(dialog).getAllByLabelText('Year');
    await user.type(from, '2012');
    await user.type(until, '2008');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'A chapter can’t end before it starts.',
    );
    expect((await getTimeline(timeline.id))?.periods).toEqual([]);
  });

  it('edits and deletes a chapter, keeping its events', async () => {
    const { user, timeline } = await openWithChapters([
      { id: 'p', name: 'School', from: 1996, to: 2007 },
    ]);
    const section = screen.getByRole('region', { name: 'Chapters' });
    await user.click(within(section).getByRole('button', { name: 'School' }));
    let dialog = screen.getByRole('dialog', { name: 'Edit chapter' });
    const name = within(dialog).getByLabelText(/Chapter name/);
    await user.clear(name);
    await user.type(name, 'School years');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await user.click(within(section).getByRole('button', { name: 'School years' }));

    dialog = screen.getByRole('dialog', { name: 'Edit chapter' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    const confirm = screen.getByRole('dialog', { name: 'Delete this chapter?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

    expect(within(section).queryByRole('button', { name: 'School years' })).toBeNull();
    await waitFor(async () => expect((await getTimeline(timeline.id))?.periods).toEqual([]));
  });

  it('survives a .tl export and import', () => {
    const timeline = withPeriods([{ id: 'p', name: 'University', from: 2008, to: 2012 }]);
    timeline.periods[0].color = '#2fa8a0';
    const result = parseTimelineFile(serializeTimeline(timeline));
    expect(result.ok && result.timeline.periods).toEqual(timeline.periods);
  });
});
