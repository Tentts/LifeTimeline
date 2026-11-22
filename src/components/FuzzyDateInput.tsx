import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatFuzzyDate } from '../model/fuzzyDate';
import { CalendarPanel } from './CalendarPanel';
import { fromFields, validateDateFields, type FuzzyDateFields } from './fuzzyDateFields';

interface Props {
  legend: string;
  value: FuzzyDateFields;
  onChange: (value: FuzzyDateFields) => void;
  required?: boolean;
  allowApprox?: boolean;
  error?: string;
}

/** Date field: a button showing the date, which opens a calendar below it. */
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const date = validateDateFields(value, false) === null ? fromFields(value) : undefined;
  const text = date ? formatFuzzyDate(date, i18n.resolvedLanguage ?? 'en') : value.year;

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <fieldset className="fuzzy-date" aria-describedby={error ? `${id}-error` : undefined}>
      <legend>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="fuzzy-date-fields">
        <button
          ref={triggerRef}
          type="button"
          data-date-trigger
          className={text ? 'date-trigger' : 'date-trigger empty'}
          aria-expanded={open}
          aria-label={`${legend}: ${text || t('date.select')}`}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">📅</span>
          <span>{text || t('date.select')}</span>
        </button>
        {allowApprox && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={value.approx}
              onChange={(e) => onChange({ ...value, approx: e.target.checked })}
            />
            <span>{t('date.approx')}</span>
          </label>
        )}
      </div>
      {open && <CalendarPanel value={value} onChange={onChange} onClose={close} />}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
