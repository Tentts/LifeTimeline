/** A date that may be known only to the year or month, e.g. "around 1998". */
export interface FuzzyDate {
  year: number;
  month?: number;
  day?: number;
  approx?: boolean;
}

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Position of a (possibly partial) date on a continuous year axis.
 * Unknown month → middle of the year; unknown day → middle of the month.
 */
export function toDecimalYear(date: FuzzyDate): number {
  if (date.month === undefined) return date.year + 0.5;
  const dayFraction =
    date.day === undefined ? 0.5 : (date.day - 0.5) / daysInMonth(date.year, date.month);
  return date.year + (date.month - 1 + dayFraction) / 12;
}

export function compareFuzzyDates(a: FuzzyDate, b: FuzzyDate): number {
  return toDecimalYear(a) - toDecimalYear(b);
}

/** Whole years between birth and the given date (never negative). */
export function ageAt(birth: FuzzyDate, date: FuzzyDate): number {
  let age = date.year - birth.year;
  if (birth.month !== undefined && date.month !== undefined) {
    const beforeBirthday =
      date.month < birth.month ||
      (date.month === birth.month &&
        birth.day !== undefined &&
        date.day !== undefined &&
        date.day < birth.day);
    if (beforeBirthday) age -= 1;
  }
  return Math.max(0, age);
}

export function todayAsFuzzyDate(now = new Date()): FuzzyDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Locale-aware label, e.g. "March 2008", "2008", "14 Mar 2008". `approx` is handled by the caller. */
export function formatFuzzyDate(date: FuzzyDate, locale: string): string {
  if (date.month === undefined) return String(date.year);
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day ?? 1));
  const options: Intl.DateTimeFormatOptions =
    date.day === undefined
      ? { year: 'numeric', month: 'long', timeZone: 'UTC' }
      : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(locale, options).format(value);
}

export function isValidFuzzyDate(date: FuzzyDate): boolean {
  if (date.day === undefined) return true;
  if (date.month === undefined) return false;
  return date.day <= daysInMonth(date.year, date.month);
}
