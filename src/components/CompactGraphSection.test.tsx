import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../i18n';
import type { Timeline } from '../model/schema';
import { TimelinesProvider } from '../state/TimelinesContext';
import { TimelineView } from '../views/TimelineView';
import { CompactGraphSection } from './CompactGraphSection';

const timeline: Timeline = {
  id: 't',
  title: 'Phone test',
  person: { birthDate: { year: 1990 } },
  events: [
    { id: 'a', title: 'Started school', start: { year: 1996 }, valence: 3, tags: [], people: [] },
    {
      id: 'b',
      title: 'Moved house',
      start: { year: 2001 },
      valence: -2,
      tags: [],
      people: [],
      description: 'New city, new friends.',
    },
  ],
  periods: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** jsdom has no ResizeObserver: report a fixed width for every observed element. */
function mockScreenWidth(width: number) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        this.callback(
          [{ contentRect: { width } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
      unobserve() {}
    },
  );
}

describe('phone graph', () => {
  beforeEach(() => i18n.changeLanguage('en'));
  afterEach(() => vi.unstubAllGlobals());

  it('hides event titles until an event is tapped, then shows its details', async () => {
    const onEdit = vi.fn();
    render(<CompactGraphSection timeline={timeline} width={360} onEdit={onEdit} />);
    const graph = screen.getByRole('group');

    expect(within(graph).queryByText('Started school')).not.toBeInTheDocument();
    expect(screen.getByText('Tap a point on the line to see that event.')).toBeInTheDocument();

    await userEvent.click(within(graph).getByRole('button', { name: 'Moved house' }));
    expect(within(graph).getByText('Moved house')).toBeInTheDocument();
    expect(screen.getByText('New city, new friends.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('b');
  });

  it('deselects when the same event is tapped again', async () => {
    render(<CompactGraphSection timeline={timeline} width={360} onEdit={vi.fn()} />);
    const point = screen.getByRole('button', { name: 'Started school' });
    await userEvent.click(point);
    expect(point).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(point);
    expect(point).toHaveAttribute('aria-pressed', 'false');
  });

  it('fits the screen width and keeps year labels apart', () => {
    render(<CompactGraphSection timeline={timeline} width={320} onEdit={vi.fn()} />);
    const svg = screen.getByRole('group');
    expect(svg).toHaveAttribute('width', '320');
    const years = [...svg.querySelectorAll('text')].filter((t) =>
      /^\d{4}$/.test(t.textContent ?? ''),
    );
    expect(years.length).toBeLessThanOrEqual(Math.floor((320 - 54) / 60));
  });

  it('is used on narrow screens only; wide screens keep the desktop graph', () => {
    mockScreenWidth(375);
    const { unmount } = render(
      <TimelinesProvider>
        <TimelineView timeline={timeline} />
      </TimelinesProvider>,
    );
    expect(screen.getByRole('group', { name: /Lifeline graph/ })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Lifeline graph/ })).not.toBeInTheDocument();
    unmount();

    mockScreenWidth(900);
    render(
      <TimelinesProvider>
        <TimelineView timeline={timeline} />
      </TimelinesProvider>,
    );
    expect(screen.getByRole('img', { name: /Lifeline graph/ })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Lifeline graph/ })).not.toBeInTheDocument();
  });
});
