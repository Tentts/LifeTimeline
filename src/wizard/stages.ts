/**
 * Life stages for the guided walkthrough, from birth to today.
 * Prompts for each stage live in the locale files under wizard.stages.<id>
 * (inspired by the lifeline exercise and McAdams' Life Story Interview; see docs/RESEARCH.md).
 */
import { sortEvents } from '../model/factory';
import { ageAt, todayAsFuzzyDate, type FuzzyDate } from '../model/fuzzyDate';
import type { LifeEvent, Timeline } from '../model/schema';

export const STAGE_DEFINITIONS = [
  { id: 'earlyChildhood', fromAge: 0, toAge: 5 },
  { id: 'childhood', fromAge: 6, toAge: 12 },
  { id: 'adolescence', fromAge: 13, toAge: 19 },
  { id: 'youngAdulthood', fromAge: 20, toAge: 29 },
  { id: 'adulthood', fromAge: 30, toAge: 44 },
  { id: 'midlife', fromAge: 45, toAge: 64 },
  { id: 'laterLife', fromAge: 65, toAge: Infinity },
] as const;

export type StageId = (typeof STAGE_DEFINITIONS)[number]['id'];

export interface LifeStage {
  id: StageId;
  fromAge: number;
  /** Last age in this stage, capped at the person's current age. */
  toAge: number;
  startYear: number;
  endYear: number;
  /** True for the stage the person is living now. */
  isCurrent: boolean;
}

/** Stages the person has already reached, the last one ending today. */
export function stagesFor(birthDate: FuzzyDate, now = new Date()): LifeStage[] {
  const currentAge = ageAt(birthDate, todayAsFuzzyDate(now));
  return STAGE_DEFINITIONS.filter((s) => s.fromAge <= currentAge).map((s) => {
    const toAge = Math.min(s.toAge, currentAge);
    return {
      id: s.id,
      fromAge: s.fromAge,
      toAge,
      startYear: birthDate.year + s.fromAge,
      endYear: birthDate.year + toAge,
      isCurrent: currentAge <= s.toAge,
    };
  });
}

/** Events that started during the stage, in chronological order. */
export function eventsInStage(timeline: Timeline, stage: LifeStage): LifeEvent[] {
  const birth = timeline.person.birthDate;
  return sortEvents(timeline.events).filter((e) => {
    const age = ageAt(birth, e.start);
    return age >= stage.fromAge && (stage.isCurrent || age <= stage.toAge);
  });
}

export type WizardStep =
  | { kind: 'intro' }
  | { kind: 'stage'; stage: LifeStage }
  | { kind: 'keyMoments' }
  | { kind: 'finish' };

export function wizardSteps(birthDate: FuzzyDate, now = new Date()): WizardStep[] {
  return [
    { kind: 'intro' },
    ...stagesFor(birthDate, now).map((stage) => ({ kind: 'stage' as const, stage })),
    { kind: 'keyMoments' },
    { kind: 'finish' },
  ];
}

export const stepKey = (step: WizardStep): string =>
  step.kind === 'stage' ? `stage:${step.stage.id}` : step.kind;

/** Where the walkthrough was left, per timeline, in this browser only. */
const progressKey = (timelineId: string) => `lifetimeline.wizard.${timelineId}`;

export function loadProgress(timelineId: string): string | null {
  try {
    return localStorage.getItem(progressKey(timelineId));
  } catch {
    return null;
  }
}

export function saveProgress(timelineId: string, key: string | null): void {
  try {
    if (key === null) localStorage.removeItem(progressKey(timelineId));
    else localStorage.setItem(progressKey(timelineId), key);
  } catch {
    // Storage unavailable: the walkthrough just won't resume.
  }
}
