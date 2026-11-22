import {
  CHAPTER_COLORS,
  chapterColor,
  eventsInPeriod,
  nextChapterColor,
  periodRange,
  rangeEnd,
  rangeStart,
  sortPeriods,
  validatePeriod,
} from './periods';
import type { LifeEvent, LifePeriod } from './schema';

const now = new Date('2026-11-22T12:00:00Z');
const period = (id: string, start: number, end?: number, color?: string): LifePeriod => ({
  id,
  name: id,
  start: { year: start },
  end: end === undefined ? undefined : { year: end },
  color,
});
const event = (id: string, year: number): LifeEvent => ({
  id,
  title: id,
  start: { year },
  valence: 0,
  tags: [],
  people: [],
});

describe('chapters', () => {
  it('covers whole years and months', () => {
    expect(rangeStart({ year: 2008 })).toBe(2008);
    expect(rangeEnd({ year: 2012 })).toBe(2013);
    expect(rangeStart({ year: 2008, month: 7 })).toBe(2008.5);
    expect(rangeEnd({ year: 2008, month: 6 })).toBe(2008.5);
  });

  it('runs until today when it has no end date', () => {
    const { start, end } = periodRange(period('now', 2020), now);
    expect(start).toBe(2020);
    expect(end).toBeGreaterThan(2026.8);
    expect(end).toBeLessThan(2027);
  });

  it('sorts by start, then by end', () => {
    const sorted = sortPeriods([
      period('c', 2010, 2011),
      period('b', 2000, 2020),
      period('a', 2000, 2005),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('finds the events inside a chapter, including its last year', () => {
    const events = [
      event('before', 2007),
      event('first', 2008),
      event('last', 2012),
      event('after', 2013),
    ];
    const inside = eventsInPeriod(events, period('uni', 2008, 2012), now);
    expect(inside.map((e) => e.id)).toEqual(['first', 'last']);
  });

  it('rejects chapters that end before they start or before birth', () => {
    const birth = { year: 1990 };
    expect(validatePeriod({ year: 2010 }, { year: 2005 }, birth, now)).toBe('endBeforeStart');
    expect(validatePeriod({ year: 1980 }, { year: 1985 }, birth, now)).toBe('beforeBirth');
    expect(validatePeriod({ year: 2010 }, { year: 2010 }, birth, now)).toBeNull();
    expect(validatePeriod({ year: 2010 }, undefined, birth, now)).toBeNull();
  });

  it('picks colours that are not in use yet', () => {
    const first = CHAPTER_COLORS[0].hex;
    expect(nextChapterColor([])).toBe(first);
    expect(nextChapterColor([period('a', 2000, 2001, first)])).toBe(CHAPTER_COLORS[1].hex);
    expect(chapterColor(period('a', 2000), 1)).toBe(CHAPTER_COLORS[1].hex);
    expect(chapterColor(period('a', 2000, 2001, '#123456'), 1)).toBe('#123456');
  });
});
