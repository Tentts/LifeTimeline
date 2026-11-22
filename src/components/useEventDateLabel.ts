import { useTranslation } from 'react-i18next';
import { ageAt, formatFuzzyDate, type FuzzyDate } from '../model/fuzzyDate';
import type { LifeEvent, LifePeriod } from '../model/schema';
import type { TFunction } from 'i18next';

export function formatDateLabel(t: TFunction, locale: string, date: FuzzyDate): string {
  const text = formatFuzzyDate(date, locale);
  return date.approx ? t('date.approxLabel', { date: text }) : text;
}

/** "March 2008 – 2012 · age 17" */
export function formatEventWhen(
  t: TFunction,
  locale: string,
  birth: FuzzyDate,
  event: Pick<LifeEvent, 'start' | 'end'>,
): string {
  const start = formatDateLabel(t, locale, event.start);
  const range = event.end ? `${start} – ${formatDateLabel(t, locale, event.end)}` : start;
  return `${range} · ${t('graph.age', { age: ageAt(birth, event.start) })}`;
}

/** "2008 – 2012", or "2020 – today" for a chapter that is still going on. */
export function formatPeriodRange(
  t: TFunction,
  locale: string,
  period: Pick<LifePeriod, 'start' | 'end'>,
): string {
  const start = formatDateLabel(t, locale, period.start);
  const end = period.end ? formatDateLabel(t, locale, period.end) : t('chapters.today');
  return `${start} – ${end}`;
}

export function useEventWhen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? 'en';
  return (birth: FuzzyDate, event: Pick<LifeEvent, 'start' | 'end'>) =>
    formatEventWhen(t, locale, birth, event);
}
