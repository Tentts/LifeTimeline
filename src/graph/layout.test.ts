import { createTimeline } from '../model/factory';
import { computeLayout } from './layout';

const now = new Date('2026-11-22T12:00:00Z');

describe('lifeline layout', () => {
  const timeline = createTimeline({ title: 'T', birthDate: { year: 1990, month: 1 } });
  timeline.events = [
    { id: 'b', title: 'Later', start: { year: 2010 }, valence: -3, tags: [], people: [] },
    { id: 'a', title: 'Earlier', start: { year: 2000 }, valence: 4, tags: [], people: [] },
  ];

  it('orders points chronologically from birth', () => {
    const layout = computeLayout(timeline, { now });
    expect(layout.events.map((e) => e.event.id)).toEqual(['a', 'b']);
    expect(layout.birth.x).toBe(layout.plot.left);
    expect(layout.events[0].x).toBeLessThan(layout.events[1].x);
    expect(layout.path.startsWith('M')).toBe(true);
    expect(layout.path.split('L')).toHaveLength(3);
  });

  it('puts positive events above the zero line and negative ones below', () => {
    const layout = computeLayout(timeline, { now });
    expect(layout.events[0].y).toBeLessThan(layout.plot.zeroY);
    expect(layout.events[1].y).toBeGreaterThan(layout.plot.zeroY);
  });

  it('labels the x axis with years and ages', () => {
    const layout = computeLayout(timeline, { now });
    expect(layout.xTicks.length).toBeGreaterThan(2);
    expect(layout.xTicks.length).toBeLessThanOrEqual(13);
    const tick2000 = layout.xTicks.find((t) => t.year === 2000);
    expect(tick2000?.age).toBe(10);
  });

  describe('chapter bands', () => {
    const withPeriods = (
      periods: { id: string; from: number; to?: number }[],
    ): typeof timeline => ({
      ...timeline,
      periods: periods.map(({ id, from, to }) => ({
        id,
        name: id,
        start: { year: from },
        end: to === undefined ? undefined : { year: to },
      })),
    });

    it('draws nothing and keeps the plot unchanged without chapters', () => {
      const layout = computeLayout(timeline, { now });
      expect(layout.bands).toEqual([]);
      expect(layout.ribbonBottom).toBe(0);
      expect(layout.plot.top).toBe(40);
    });

    it('puts chapters that do not overlap in one ribbon row', () => {
      const layout = computeLayout(
        withPeriods([
          { id: 'school', from: 1996, to: 2007 },
          { id: 'uni', from: 2008, to: 2012 },
        ]),
        { now },
      );
      expect(layout.bands.map((b) => b.ribbonY)).toEqual([0, 0]);
      expect(layout.ribbonBottom).toBe(17);
      expect(layout.plot.top).toBe(57);
      expect(layout.bands[0].x + layout.bands[0].width).toBeCloseTo(layout.bands[1].x);
    });

    it('gives overlapping chapters separate rows, always at full graph height', () => {
      const layout = computeLayout(
        withPeriods([
          { id: 'uni', from: 2008, to: 2012 },
          { id: 'job', from: 2011, to: 2015 },
          { id: 'later', from: 2020, to: 2021 },
        ]),
        { now },
      );
      const fullHeight = layout.plot.bottom - layout.plot.top;
      const [uni, job, later] = layout.bands;
      expect([uni.ribbonY, job.ribbonY, later.ribbonY]).toEqual([0, 17, 0]);
      expect(layout.ribbonBottom).toBe(34);
      for (const band of layout.bands) {
        expect(band.y).toBe(layout.plot.top);
        expect(band.height).toBe(fullHeight);
      }
    });

    it('keeps event labels clear of the ribbons', () => {
      const layout = computeLayout(
        {
          ...withPeriods([{ id: 'uni', from: 1995, to: 2012 }]),
          events: [
            { id: 'top', title: 'Top', start: { year: 2000 }, valence: 5, tags: [], people: [] },
          ],
        },
        { now },
      );
      expect(layout.events[0].label.y).toBeGreaterThan(layout.ribbonBottom);
    });

    it('clips chapters to the visible years and runs ongoing ones to today', () => {
      const layout = computeLayout(
        withPeriods([
          { id: 'early', from: 1980, to: 1995 },
          { id: 'now', from: 2020 },
        ]),
        { now },
      );
      expect(layout.bands[0].x).toBe(layout.plot.left);
      const ongoing = layout.bands[1];
      expect(ongoing.x + ongoing.width).toBeLessThan(layout.plot.right);
    });

    it('leaves out chapters entirely before birth', () => {
      const layout = computeLayout(withPeriods([{ id: 'old', from: 1950, to: 1960 }]), { now });
      expect(layout.bands).toEqual([]);
    });
  });

  describe('crowded levels', () => {
    const item = (id: string, from: number, to?: number, valence = 3) => ({
      id,
      title: `Long event title ${id}`,
      start: { year: from },
      end: to === undefined ? undefined : { year: to },
      valence,
      tags: [],
      people: [],
    });
    const crowded = {
      ...timeline,
      events: [
        item('long', 2000, 2012),
        item('during', 2004),
        item('also', 2008, 2011),
        item('after', 2020),
      ],
    };

    it('keeps the default height when nothing collides', () => {
      expect(computeLayout(timeline, { now }).height).toBe(440);
    });

    it('stacks items whose time spans overlap and grows the graph', () => {
      const layout = computeLayout(crowded, { now });
      const byId = new Map(layout.events.map((e) => [e.event.id, e]));
      expect(new Set(['long', 'during', 'also'].map((id) => byId.get(id)?.y)).size).toBe(3);
      expect(layout.height).toBeGreaterThan(440);
      expect(layout.yTicks.map((tick) => tick.value)).toContain(3);
    });

    it('never overlaps two titles', () => {
      const layout = computeLayout(crowded, { now });
      const boxes = layout.events.map((e) => {
        const width = e.event.title.length * 6.2;
        return { left: e.label.x - width / 2, right: e.label.x + width / 2, y: e.label.y };
      });
      boxes.forEach((a, i) =>
        boxes.slice(i + 1).forEach((b) => {
          const sameLine = Math.abs(a.y - b.y) < 13;
          const sideBySide = a.left < b.right && b.left < a.right;
          expect(sameLine && sideBySide).toBe(false);
        }),
      );
    });

    it('keeps a stacked level between its neighbours', () => {
      const layout = computeLayout(
        {
          ...crowded,
          events: [
            ...crowded.events,
            item('up', 2005, undefined, 4),
            item('down', 2005, undefined, 2),
          ],
        },
        { now },
      );
      const ys = (valence: number) =>
        layout.events.filter((e) => e.event.valence === valence).map((e) => e.y);
      expect(Math.max(...ys(4))).toBeLessThan(Math.min(...ys(3)));
      expect(Math.max(...ys(3))).toBeLessThan(Math.min(...ys(2)));
    });

    it('needs less room on phones, where titles are hidden', () => {
      const options = { now, width: 360, height: 300, labels: false, laneHeight: 28 };
      const layout = computeLayout(crowded, options);
      const placed = layout.events.filter((e) => ['long', 'during'].includes(e.event.id));
      expect(placed[0].y).not.toBe(placed[1].y);
      expect(layout.height).toBeLessThan(computeLayout(crowded, { now }).height);
    });
  });

  it('keeps everything inside the drawing area', () => {
    const layout = computeLayout(timeline, { now });
    for (const e of layout.events) {
      expect(e.x).toBeGreaterThanOrEqual(layout.plot.left);
      expect(e.x).toBeLessThanOrEqual(layout.plot.right);
    }
  });
});
