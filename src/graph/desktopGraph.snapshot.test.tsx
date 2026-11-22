/**
 * Guards the desktop graph: its rendered SVG must not change when phone-only features are
 * added. If you change the desktop graph on purpose, update the snapshot with `vitest -u`.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../i18n';
import type { Timeline } from '../model/schema';
import { LifelineGraph } from './LifelineGraph';
import { EXPORT_PALETTE, SCREEN_PALETTE } from './palette';

const now = new Date('2026-11-22T12:00:00Z');
const ev = (id: string, title: string, year: number, valence: number, extra = {}) => ({
  id,
  title,
  start: { year },
  valence,
  tags: [],
  people: [],
  ...extra,
});

const timeline: Timeline = {
  id: 'snapshot',
  title: 'Snapshot',
  person: { birthDate: { year: 1990, month: 4 } },
  events: [
    ev('a', 'Little sister was born', 1993, 3, { symbol: 'flower' }),
    ev('b', 'Parents divorced', 1999, -4, { symbol: 'stone' }),
    ev('c', 'Moved to Madrid', 2008, 4, { isTurningPoint: true }),
    ev('d', 'First job', 2013, 2, { end: { year: 2017 } }),
    ev('e', 'Grandmother passed away', 2012, -5, { symbol: 'candle' }),
  ],
  periods: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('desktop lifeline graph', () => {
  beforeAll(() => i18n.changeLanguage('en'));

  it('renders exactly as before on screen', () => {
    const svg = renderToStaticMarkup(
      <LifelineGraph timeline={timeline} palette={SCREEN_PALETTE} now={now} />,
    );
    expect(svg).toMatchSnapshot();
  });

  it('renders exactly as before for exports', () => {
    const svg = renderToStaticMarkup(
      <LifelineGraph
        timeline={timeline}
        palette={EXPORT_PALETTE}
        fixedSize
        now={now}
        idPrefix="export"
      />,
    );
    expect(svg).toMatchSnapshot();
  });
});
