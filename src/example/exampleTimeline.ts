import type { TFunction } from 'i18next';
import { newId } from '../model/factory';
import type { EventSymbol, FuzzyDate, LifeEvent, Timeline } from '../model/schema';

/**
 * A fictional life, shipped with the app so first-time visitors can see what a finished
 * timeline looks like. It lives in the code and is only saved if the user makes a copy.
 * Wording is in the locale files under example.*
 */
const EVENTS = [
  { id: 'sister', start: { year: 1991, month: 6 }, valence: 3, symbol: 'flower' },
  { id: 'school', start: { year: 1994, month: 9 }, valence: 2 },
  { id: 'move', start: { year: 1999, approx: true }, valence: -3, symbol: 'stone' },
  { id: 'band', start: { year: 2002, month: 10 }, valence: 4, symbol: 'star' },
  { id: 'grandfather', start: { year: 2006, month: 2 }, valence: -4, symbol: 'candle' },
  { id: 'university', start: { year: 2007, month: 9 }, valence: 4, turning: true },
  { id: 'job', start: { year: 2012, month: 3 }, valence: 2 },
  { id: 'burnout', start: { year: 2017, month: 3 }, valence: -4, symbol: 'stone', turning: true },
  { id: 'career', start: { year: 2019, month: 5 }, valence: 3 },
  { id: 'home', start: { year: 2022, month: 8 }, valence: 5, symbol: 'star' },
] as const satisfies readonly {
  id: string;
  start: FuzzyDate;
  valence: number;
  symbol?: EventSymbol;
  turning?: boolean;
}[];

export const EXAMPLE_ID = 'example';

export function buildExampleTimeline(t: TFunction): Timeline {
  const events: LifeEvent[] = EVENTS.map((event) => ({
    id: event.id,
    title: t(`example.events.${event.id}.title`),
    description: t(`example.events.${event.id}.description`),
    start: event.start,
    valence: event.valence,
    symbol: 'symbol' in event ? event.symbol : undefined,
    isTurningPoint: 'turning' in event ? event.turning : undefined,
    tags: [],
    people: [],
  }));

  return {
    id: EXAMPLE_ID,
    title: t('example.title'),
    person: { name: t('example.name'), birthDate: { year: 1988, month: 3 } },
    events,
    periods: [
      {
        id: 'growing',
        name: t('example.chapters.growing'),
        start: { year: 1988, month: 3 },
        end: { year: 2007, month: 8 },
        color: '#4f7fe0',
      },
      {
        id: 'university',
        name: t('example.chapters.university'),
        start: { year: 2007, month: 9 },
        end: { year: 2012, month: 2 },
        color: '#e0619a',
      },
      {
        id: 'career',
        name: t('example.chapters.career'),
        start: { year: 2012, month: 3 },
        end: { year: 2019, month: 4 },
        color: '#2fa8a0',
      },
      {
        id: 'over',
        name: t('example.chapters.over'),
        start: { year: 2019, month: 5 },
        color: '#8b6fe0',
      },
    ],
    reflectionAnswers: {
      themes: t('example.answers.themes'),
      strengths: t('example.answers.strengths'),
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** An independent copy the user can edit, saved in their browser. */
export function copyOfExample(example: Timeline, now = new Date()): Timeline {
  const at = now.toISOString();
  return { ...example, id: newId(), createdAt: at, updatedAt: at };
}
