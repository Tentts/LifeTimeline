import type { FuzzyDate } from '../model/fuzzyDate';
import { fuzzyDateSchema } from '../model/schema';

/** Form value: fields kept as strings so the user can type freely. */
export interface FuzzyDateFields {
  year: string;
  month: string;
  day: string;
  approx: boolean;
}

export const emptyDateFields: FuzzyDateFields = { year: '', month: '', day: '', approx: false };

export function toFields(date: FuzzyDate | null | undefined): FuzzyDateFields {
  if (!date) return emptyDateFields;
  return {
    year: String(date.year),
    month: date.month ? String(date.month) : '',
    day: date.day ? String(date.day) : '',
    approx: date.approx ?? false,
  };
}

export type DateError = 'date.errors.required' | 'date.errors.invalid';

export function validateDateFields(fields: FuzzyDateFields, required: boolean): DateError | null {
  if (fields.year.trim() === '') return required ? 'date.errors.required' : null;
  const date = fromFields(fields);
  return date && fuzzyDateSchema.safeParse(date).success ? null : 'date.errors.invalid';
}

/** Returns undefined when the year is empty. Range checks happen in the zod schema. */
export function fromFields(fields: FuzzyDateFields): FuzzyDate | undefined {
  if (fields.year.trim() === '') return undefined;
  const date: FuzzyDate = { year: Number(fields.year) };
  if (fields.month) date.month = Number(fields.month);
  if (fields.month && fields.day.trim() !== '') date.day = Number(fields.day);
  if (fields.approx) date.approx = true;
  return date;
}
