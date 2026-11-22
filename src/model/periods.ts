/**
 * Chapters of a life ("University years"). Unlike a single event, a chapter covers its whole
 * date range: "2008 – 2012" runs from the start of 2008 to the end of 2012.
 */
import { toDecimalYear, todayAsFuzzyDate, type FuzzyDate } from './fuzzyDate';
import type { LifeEvent, LifePeriod } from './schema';

export const CHAPTER_COLORS = [
  { id: 'pink', hex: '#e0619a' },
  { id: 'blue', hex: '#4f7fe0' },
  { id: 'violet', hex: '#8b6fe0' },
  { id: 'teal', hex: '#2fa8a0' },
  { id: 'amber', hex: '#e0a030' },
  { id: 'slate', hex: '#7b8499' },
] as const;

/** First moment covered by a (possibly partial) date. */
export function rangeStart(date: FuzzyDate): number {
  if (date.month === undefined) return date.year;
  if (date.day === undefined) return date.year + (date.month - 1) / 12;
  return toDecimalYear(date);
}

/** Last moment covered by a (possibly partial) date. */
export function rangeEnd(date: FuzzyDate): number {
  if (date.month === undefined) return date.year + 1;
  if (date.day === undefined) return date.year + date.month / 12;
  return toDecimalYear(date);
}

/** A chapter with no end date is still going on, so it runs until today. */
export function periodRange(
  period: Pick<LifePeriod, 'start' | 'end'>,
  now = new Date(),
): { start: number; end: number } {
  const start = rangeStart(period.start);
  const end = period.end
    ? rangeEnd(period.end)
    : Math.max(toDecimalYear(todayAsFuzzyDate(now)), rangeEnd(period.start));
  return { start, end };
}

export function sortPeriods(periods: LifePeriod[]): LifePeriod[] {
  return [...periods].sort(
    (a, b) =>
      rangeStart(a.start) - rangeStart(b.start) ||
      periodRange(a).end - periodRange(b).end ||
      a.name.localeCompare(b.name),
  );
}

/** The chapter's own colour, or a stable one from the palette for its position. */
export function chapterColor(period: LifePeriod, sortedIndex: number): string {
  return period.color ?? CHAPTER_COLORS[sortedIndex % CHAPTER_COLORS.length].hex;
}

/** Suggests a colour not used yet, so neighbouring chapters look different. */
export function nextChapterColor(periods: LifePeriod[]): string {
  const used = new Set(periods.map((p) => p.color));
  const free = CHAPTER_COLORS.find((c) => !used.has(c.hex));
  return (free ?? CHAPTER_COLORS[periods.length % CHAPTER_COLORS.length]).hex;
}

export function eventsInPeriod(
  events: LifeEvent[],
  period: LifePeriod,
  now = new Date(),
): LifeEvent[] {
  const { start, end } = periodRange(period, now);
  return events.filter((e) => {
    const at = toDecimalYear(e.start);
    return at >= start && at < end;
  });
}

export type PeriodError = 'endBeforeStart' | 'beforeBirth';

export function validatePeriod(
  start: FuzzyDate,
  end: FuzzyDate | undefined,
  birth: FuzzyDate,
  now = new Date(),
): PeriodError | null {
  if (end && rangeEnd(end) <= rangeStart(start)) return 'endBeforeStart';
  if (periodRange({ start, end }, now).end <= rangeStart(birth)) return 'beforeBirth';
  return null;
}
