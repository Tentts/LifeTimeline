import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { FuzzyDate } from '../model/fuzzyDate';
import { CHAPTER_COLORS, validatePeriod, type PeriodError } from '../model/periods';
import type { LifePeriod } from '../model/schema';
import { FuzzyDateInput } from './FuzzyDateInput';
import { fromFields, toFields, validateDateFields, type DateError } from './fuzzyDateFields';
import { Modal } from './Modal';

export type ChapterDraft = Omit<LifePeriod, 'id'>;

interface Props {
  mode: 'create' | 'edit';
  initial?: LifePeriod;
  defaultColor: string;
  birthDate: FuzzyDate;
  onSubmit: (draft: ChapterDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ChapterDialog({
  mode,
  initial,
  defaultColor,
  birthDate,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [start, setStart] = useState(toFields(initial?.start));
  const [ongoing, setOngoing] = useState(mode === 'edit' && !initial?.end);
  const [end, setEnd] = useState(toFields(initial?.end));
  const [color, setColor] = useState(initial?.color ?? defaultColor);
  const [errors, setErrors] = useState<{
    name?: boolean;
    start?: DateError | null;
    end?: DateError | null;
    range?: PeriodError | null;
  }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      name: name.trim() === '',
      start: validateDateFields(start, true),
      end: ongoing ? null : validateDateFields(end, true),
    };
    const startDate = next.start ? undefined : fromFields(start);
    const endDate = ongoing || next.end ? undefined : fromFields(end);
    if (startDate && (ongoing || endDate)) {
      next.range = validatePeriod(startDate, endDate, birthDate);
    }
    setErrors(next);
    if (next.name || next.start || next.end || next.range || !startDate) return;
    onSubmit({ name: name.trim(), start: startDate, end: endDate, color });
  };

  const rangeError = errors.range ? t(`chapters.errors.${errors.range}`) : undefined;

  return (
    <Modal
      title={t(mode === 'create' ? 'chapters.createTitle' : 'chapters.editTitle')}
      onClose={onCancel}
      wide
      footer={
        <>
          {onDelete && (
            <button type="button" className="danger push-left" onClick={onDelete}>
              {t('common.delete')}
            </button>
          )}
          <button type="button" className="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" form={formId}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="form">
        <p className="hint">{t('chapters.hint')}</p>
        <label className="field">
          <span>
            {t('chapters.name')}
            <span aria-hidden="true"> *</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('chapters.namePlaceholder')}
            maxLength={200}
            required
            aria-invalid={errors.name || undefined}
          />
          {errors.name && (
            <span className="field-error" role="alert">
              {t('chapters.nameRequired')}
            </span>
          )}
        </label>

        <FuzzyDateInput
          legend={t('chapters.start')}
          value={start}
          onChange={setStart}
          required
          error={errors.start ? t(errors.start) : undefined}
        />
        <label className="checkbox">
          <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} />
          <span>{t('chapters.ongoing')}</span>
        </label>
        {!ongoing && (
          <FuzzyDateInput
            legend={t('chapters.end')}
            value={end}
            onChange={setEnd}
            required
            error={errors.end ? t(errors.end) : rangeError}
          />
        )}
        {ongoing && rangeError && (
          <p className="field-error" role="alert">
            {rangeError}
          </p>
        )}

        <fieldset className="chapter-colors">
          <legend>{t('chapters.color')}</legend>
          <div className="chapter-swatches">
            {CHAPTER_COLORS.map((option) => (
              <label
                key={option.id}
                className="chapter-swatch"
                title={t(`chapters.colors.${option.id}`)}
              >
                <input
                  type="radio"
                  name={`${formId}-color`}
                  value={option.hex}
                  checked={color === option.hex}
                  onChange={() => setColor(option.hex)}
                />
                <span style={{ background: option.hex }} aria-hidden="true" />
                <span className="visually-hidden">{t(`chapters.colors.${option.id}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
