/** Pure helpers for the calendar date picker. */

/** First weekday for a locale (0 = Sunday … 6 = Saturday). */
export function firstDayOfWeek(locale: string): number {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const firstDay = (intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo)?.firstDay;
    if (firstDay) return firstDay % 7;
  } catch {
    // Fall through to the language default.
  }
  return locale.toLowerCase().startsWith('en') ? 0 : 1;
}

export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Calendar cells for a month: leading nulls align day 1 under its weekday. */
export function monthCells(year: number, month: number, firstDay: number): (number | null)[] {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const blanks = (weekday - firstDay + 7) % 7;
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];
}

/** Short weekday names, starting on the locale's first day. */
export function weekdayNames(locale: string, firstDay: number): { short: string; long: string }[] {
  const format = (style: 'narrow' | 'long', day: number) =>
    new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(
      // 2023-01-01 was a Sunday.
      new Date(Date.UTC(2023, 0, 1 + day)),
    );
  return Array.from({ length: 7 }, (_, i) => {
    const day = (firstDay + i) % 7;
    return { short: format('narrow', day), long: format('long', day) };
  });
}
