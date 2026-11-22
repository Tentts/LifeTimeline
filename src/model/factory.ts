import { compareFuzzyDates } from './fuzzyDate';
import type { FuzzyDate, LifeEvent, Timeline } from './schema';

export const newId = (): string => crypto.randomUUID();

export function createTimeline(input: {
  title: string;
  birthDate: FuzzyDate;
  name?: string;
  now?: Date;
}): Timeline {
  const at = (input.now ?? new Date()).toISOString();
  return {
    id: newId(),
    title: input.title.trim(),
    person: { name: input.name?.trim() || undefined, birthDate: input.birthDate },
    events: [],
    periods: [],
    createdAt: at,
    updatedAt: at,
  };
}

export type EventDraft = Omit<LifeEvent, 'id'>;

export function emptyEventDraft(start: FuzzyDate): EventDraft {
  return { title: '', start, valence: 0, tags: [], people: [] };
}

export function sortEvents(events: LifeEvent[]): LifeEvent[] {
  return [...events].sort(
    (a, b) => compareFuzzyDates(a.start, b.start) || a.title.localeCompare(b.title),
  );
}

export function touch(timeline: Timeline, now = new Date()): Timeline {
  return { ...timeline, updatedAt: now.toISOString() };
}
