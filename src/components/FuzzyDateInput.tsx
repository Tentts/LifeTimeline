import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { FuzzyDateFields } from './fuzzyDateFields';

interface Props {
  legend: string;
  value: FuzzyDateFields;
  onChange: (value: FuzzyDateFields) => void;
  required?: boolean;
  allowApprox?: boolean;
  error?: string;
}

export function FuzzyDateInput({
  legend,
  value,
  onChange,
  required,
  allowApprox = true,
  error,
}: Props) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, m - 1, 1)),
    );
  const set = (patch: Partial<FuzzyDateFields>) => onChange({ ...value, ...patch });

  return (
    <fieldset className="fuzzy-date" aria-describedby={error ? `${id}-error` : undefined}>
      <legend>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="fuzzy-date-fields">
        <label>
          <span>{t('date.year')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1850}
            max={2200}
            required={required}
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
            className="input-year"
          />
        </label>
        <label>
          <span>{t('date.month')}</span>
          <select
            value={value.month}
            onChange={(e) => set({ month: e.target.value, day: e.target.value ? value.day : '' })}
          >
            <option value="">{t('date.unknown')}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {monthName(i + 1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('date.day')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            disabled={!value.month}
            value={value.day}
            onChange={(e) => set({ day: e.target.value })}
            className="input-day"
          />
        </label>
        {allowApprox && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={value.approx}
              onChange={(e) => set({ approx: e.target.checked })}
            />
            <span>{t('date.approx')}</span>
          </label>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
