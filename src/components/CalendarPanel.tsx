import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { todayAsFuzzyDate } from '../model/fuzzyDate';
import { MAX_YEAR, MIN_YEAR } from '../model/schema';
import { daysInMonth, firstDayOfWeek, monthCells, weekdayNames } from './calendar';
import type { FuzzyDateFields } from './fuzzyDateFields';

type Precision = 'day' | 'month' | 'year';

const validYear = (text: string) => {
  const year = Number(text);
  return text.trim() !== '' && Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
};

interface Props {
  value: FuzzyDateFields;
  onChange: (value: FuzzyDateFields) => void;
  onClose: () => void;
}

/**
 * Calendar that opens on the chosen date, or on today. Memories aren't always exact, so it can
 * also record just a month or just a year.
 */
export function CalendarPanel({ value, onChange, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? 'en';
  const id = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const [today] = useState(() => todayAsFuzzyDate());
  const [precision, setPrecision] = useState<Precision>(
    value.day ? 'day' : value.month ? 'month' : value.year ? 'year' : 'day',
  );
  const [viewYear, setViewYear] = useState(validYear(value.year) ? Number(value.year) : today.year);
  const [viewMonth, setViewMonth] = useState(value.month ? Number(value.month) : today.month!);
  const [yearText, setYearText] = useState(String(viewYear));
  const [focusDay, setFocusDay] = useState(value.day ? Number(value.day) : today.day!);

  const firstDay = firstDayOfWeek(locale);
  const lastDay = daysInMonth(viewYear, viewMonth);
  const activeDay = Math.min(focusDay, lastDay);
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, m - 1, 1)),
    );

  const commit = (mode: Precision, year: string, month: number) => {
    if (mode === 'year') onChange({ ...value, year, month: '', day: '' });
    if (mode === 'month') onChange({ ...value, year, month: String(month), day: '' });
  };

  const changeYear = (text: string) => {
    setYearText(text);
    if (validYear(text)) setViewYear(Number(text));
    commit(precision, text, viewMonth);
  };

  const changeMonth = (month: number) => {
    setViewMonth(month);
    commit(precision, yearText, month);
  };

  const changePrecision = (mode: Precision) => {
    setPrecision(mode);
    commit(mode, String(viewYear), viewMonth);
  };

  const shiftMonth = (delta: number) => {
    const index = viewYear * 12 + (viewMonth - 1) + delta;
    const year = Math.floor(index / 12);
    if (year < MIN_YEAR || year > MAX_YEAR) return;
    setViewYear(year);
    setYearText(String(year));
    setViewMonth((index % 12) + 1);
  };

  const pickDay = (year: number, month: number, day: number) => {
    onChange({ ...value, year: String(year), month: String(month), day: String(day) });
    onClose();
  };

  const onGridKey = (e: KeyboardEvent, day: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = day + delta;
    if (next < 1 || next > lastDay) return;
    setFocusDay(next);
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus();
  };

  const isSelected = (day: number) =>
    value.year === String(viewYear) &&
    value.month === String(viewMonth) &&
    value.day === String(day);
  const isToday = (day: number) =>
    today.year === viewYear && today.month === viewMonth && today.day === day;

  return (
    <div
      className="calendar"
      role="group"
      aria-label={t('date.pickerLabel')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <fieldset className="calendar-precision">
        <legend className="visually-hidden">{t('date.precision')}</legend>
        {(['day', 'month', 'year'] as const).map((mode) => (
          <label key={mode} className={precision === mode ? 'active' : undefined}>
            <input
              type="radio"
              name={`${id}-precision`}
              checked={precision === mode}
              onChange={() => changePrecision(mode)}
            />
            <span>{t(`date.precisions.${mode}`)}</span>
          </label>
        ))}
      </fieldset>

      <div className="calendar-nav">
        {precision === 'day' && (
          <button
            type="button"
            className="calendar-arrow"
            onClick={() => shiftMonth(-1)}
            aria-label={t('date.prevMonth')}
          >
            ‹
          </button>
        )}
        {precision !== 'year' && (
          <label>
            <span className="visually-hidden">{t('date.month')}</span>
            <select value={viewMonth} onChange={(e) => changeMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {monthName(i + 1)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className="visually-hidden">{t('date.year')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={yearText}
            className="input-year"
            onChange={(e) => changeYear(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault(); // don't submit the surrounding form
            }}
          />
        </label>
        {precision === 'day' && (
          <button
            type="button"
            className="calendar-arrow"
            onClick={() => shiftMonth(1)}
            aria-label={t('date.nextMonth')}
          >
            ›
          </button>
        )}
      </div>

      {precision === 'day' ? (
        <>
          <div className="calendar-grid calendar-weekdays" aria-hidden="true">
            {weekdayNames(locale, firstDay).map((day) => (
              <span key={day.long} title={day.long}>
                {day.short}
              </span>
            ))}
          </div>
          <div className="calendar-grid" ref={gridRef}>
            {monthCells(viewYear, viewMonth, firstDay).map((day, i) =>
              day === null ? (
                <span key={`blank-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  data-day={day}
                  tabIndex={day === activeDay ? 0 : -1}
                  className={[
                    'calendar-day',
                    isToday(day) ? 'today' : '',
                    isSelected(day) ? 'selected' : '',
                  ]
                    .join(' ')
                    .trim()}
                  aria-label={new Intl.DateTimeFormat(locale, {
                    dateStyle: 'long',
                    timeZone: 'UTC',
                  }).format(new Date(Date.UTC(viewYear, viewMonth - 1, day)))}
                  aria-pressed={isSelected(day)}
                  aria-current={isToday(day) ? 'date' : undefined}
                  onClick={() => pickDay(viewYear, viewMonth, day)}
                  onKeyDown={(e) => onGridKey(e, day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </>
      ) : (
        <p className="hint">{t(`date.precisionHints.${precision}`)}</p>
      )}

      <div className="calendar-footer">
        {precision === 'day' && (
          <button
            type="button"
            className="secondary"
            onClick={() => pickDay(today.year, today.month!, today.day!)}
          >
            {t('date.today')}
          </button>
        )}
        <button type="button" className="secondary" onClick={onClose}>
          {t('date.done')}
        </button>
      </div>
    </div>
  );
}
