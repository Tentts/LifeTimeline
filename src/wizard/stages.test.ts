import { createTimeline } from '../model/factory';
import {
  eventsInStage,
  loadProgress,
  saveProgress,
  stagesFor,
  stepKey,
  wizardSteps,
} from './stages';

const now = new Date('2026-11-22T12:00:00Z');

describe('life stages', () => {
  it('includes only the stages already reached, ending today', () => {
    const stages = stagesFor({ year: 1990, month: 4 }, now); // age 36
    expect(stages.map((s) => s.id)).toEqual([
      'earlyChildhood',
      'childhood',
      'adolescence',
      'youngAdulthood',
      'adulthood',
    ]);
    const current = stages.at(-1)!;
    expect(current).toMatchObject({ fromAge: 30, toAge: 36, startYear: 2020, endYear: 2026 });
    expect(current.isCurrent).toBe(true);
    expect(stages[1]).toMatchObject({ startYear: 1996, endYear: 2002, isCurrent: false });
  });

  it('works for a child and for an older person', () => {
    expect(stagesFor({ year: 2020 }, now).map((s) => s.id)).toEqual([
      'earlyChildhood',
      'childhood',
    ]);
    expect(stagesFor({ year: 1940 }, now).at(-1)).toMatchObject({ id: 'laterLife', toAge: 86 });
  });

  it('groups events by the age when they started', () => {
    const timeline = createTimeline({ title: 'T', birthDate: { year: 1990 } });
    const ev = (id: string, year: number) => ({
      id,
      title: id,
      start: { year },
      valence: 0,
      tags: [],
      people: [],
    });
    timeline.events = [ev('school', 1996), ev('toddler', 1992), ev('teen', 2004), ev('now', 2026)];
    const stages = stagesFor(timeline.person.birthDate, now);
    expect(eventsInStage(timeline, stages[0]).map((e) => e.id)).toEqual(['toddler']);
    expect(eventsInStage(timeline, stages[1]).map((e) => e.id)).toEqual(['school']);
    expect(eventsInStage(timeline, stages[2]).map((e) => e.id)).toEqual(['teen']);
    expect(eventsInStage(timeline, stages.at(-1)!).map((e) => e.id)).toEqual(['now']);
  });

  it('builds the steps: intro, one per stage, key moments, finish', () => {
    const steps = wizardSteps({ year: 2010 }, now); // age 16
    expect(steps.map(stepKey)).toEqual([
      'intro',
      'stage:earlyChildhood',
      'stage:childhood',
      'stage:adolescence',
      'keyMoments',
      'finish',
    ]);
  });

  it('remembers progress per timeline', () => {
    saveProgress('a', 'stage:childhood');
    expect(loadProgress('a')).toBe('stage:childhood');
    expect(loadProgress('b')).toBeNull();
    saveProgress('a', null);
    expect(loadProgress('a')).toBeNull();
  });
});
