import { z } from 'zod';
import { isValidFuzzyDate, type FuzzyDate } from './fuzzyDate';

export type { FuzzyDate };

export const MIN_YEAR = 1850;
export const MAX_YEAR = 2200;
export const MIN_VALENCE = -5;
export const MAX_VALENCE = 5;

export const SYMBOLS = ['flower', 'stone', 'candle', 'stick', 'star'] as const;

export const fuzzyDateSchema: z.ZodType<FuzzyDate> = z
  .object({
    year: z.number().int().min(MIN_YEAR).max(MAX_YEAR),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    approx: z.boolean().optional(),
  })
  .refine(isValidFuzzyDate, { message: 'Invalid day for this month' });

const text = (max: number) => z.string().max(max);

export const lifeEventSchema = z.object({
  id: z.string().min(1),
  title: text(200).trim().min(1),
  start: fuzzyDateSchema,
  end: fuzzyDateSchema.nullish(),
  valence: z.number().int().min(MIN_VALENCE).max(MAX_VALENCE),
  symbol: z.enum(SYMBOLS).nullish(),
  tags: z.array(text(60)).max(50).default([]),
  people: z.array(text(100)).max(100).default([]),
  description: text(20_000).optional(),
  reflection: text(20_000).optional(),
  isTurningPoint: z.boolean().optional(),
});

export const lifePeriodSchema = z.object({
  id: z.string().min(1),
  name: text(200).trim().min(1),
  start: fuzzyDateSchema,
  end: fuzzyDateSchema.nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

/** Guided questions on the reflection page (wording in the locale files). */
export const REFLECTION_QUESTIONS = [
  'themes',
  'strengths',
  'turningPoints',
  'patterns',
  'values',
  'nextChapter',
] as const;

const answer = () => text(20_000).optional();

export const reflectionAnswersSchema = z.object({
  themes: answer(),
  strengths: answer(),
  turningPoints: answer(),
  patterns: answer(),
  values: answer(),
  nextChapter: answer(),
});

export const timelineSchema = z.object({
  id: z.string().min(1),
  title: text(200).trim().min(1),
  person: z.object({
    name: text(200).optional(),
    birthDate: fuzzyDateSchema,
  }),
  events: z.array(lifeEventSchema).max(5000),
  periods: z.array(lifePeriodSchema).max(500).default([]),
  reflection: text(50_000).optional(),
  reflectionAnswers: reflectionAnswersSchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type LifeEvent = z.infer<typeof lifeEventSchema>;
export type LifePeriod = z.infer<typeof lifePeriodSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type EventSymbol = (typeof SYMBOLS)[number];
export type ReflectionQuestion = (typeof REFLECTION_QUESTIONS)[number];
