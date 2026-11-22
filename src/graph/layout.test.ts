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

  it('keeps everything inside the drawing area', () => {
    const layout = computeLayout(timeline, { now });
    for (const e of layout.events) {
      expect(e.x).toBeGreaterThanOrEqual(layout.plot.left);
      expect(e.x).toBeLessThanOrEqual(layout.plot.right);
    }
  });
});
