import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventDraft } from '../model/factory';
import { MAX_VALENCE, MIN_VALENCE, SYMBOLS, type EventSymbol } from '../model/schema';
import { FuzzyDateInput } from './FuzzyDateInput';
import { fromFields, toFields, validateDateFields, type DateError } from './fuzzyDateFields';
import { Modal } from './Modal';
import { valenceKey } from './valence';

interface Props {
  mode: 'create' | 'edit';
  initial: EventDraft;
  onSubmit: (draft: EventDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function EventDialog({ mode, initial, onSubmit, onCancel, onDelete }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const [title, setTitle] = useState(initial.title);
  const [start, setStart] = useState(toFields(initial.start));
  const [hasEnd, setHasEnd] = useState(Boolean(initial.end));
  const [end, setEnd] = useState(toFields(initial.end));
  const [valence, setValence] = useState(initial.valence);
  const [symbol, setSymbol] = useState<EventSymbol | ''>(initial.symbol ?? '');
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [people, setPeople] = useState(initial.people.join(', '));
  const [description, setDescription] = useState(initial.description ?? '');
  const [reflection, setReflection] = useState(initial.reflection ?? '');
  const [turningPoint, setTurningPoint] = useState(initial.isTurningPoint ?? false);
  const [errors, setErrors] = useState<{
    title?: boolean;
    start?: DateError | null;
    end?: DateError | null;
  }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      title: title.trim() === '',
      start: validateDateFields(start, true),
      end: hasEnd ? validateDateFields(end, true) : null,
    };
    setErrors(next);
    if (next.title || next.start || next.end) return;
    onSubmit({
      title: title.trim(),
      start: fromFields(start)!,
      end: hasEnd ? fromFields(end) : undefined,
      valence,
      symbol: symbol || undefined,
      tags: splitList(tags),
      people: splitList(people),
      description: description.trim() || undefined,
      reflection: reflection.trim() || undefined,
      isTurningPoint: turningPoint || undefined,
    });
  };

  return (
    <Modal
      title={t(mode === 'create' ? 'eventForm.createTitle' : 'eventForm.editTitle')}
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
        <p className="hint">{t('eventForm.gentleHint')}</p>
        <label className="field">
          <span>
            {t('eventForm.title')}
            <span aria-hidden="true"> *</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('eventForm.titlePlaceholder')}
            maxLength={200}
            required
            aria-invalid={errors.title || undefined}
          />
          {errors.title && (
            <span className="field-error" role="alert">
              {t('eventForm.titleRequired')}
            </span>
          )}
        </label>

        <FuzzyDateInput
          legend={t('eventForm.start')}
          value={start}
          onChange={setStart}
          required
          error={errors.start ? t(errors.start) : undefined}
        />
        <label className="checkbox">
          <input type="checkbox" checked={hasEnd} onChange={(e) => setHasEnd(e.target.checked)} />
          <span>{t('eventForm.hasEnd')}</span>
        </label>
        {hasEnd && (
          <FuzzyDateInput
            legend={t('eventForm.end')}
            value={end}
            onChange={setEnd}
            required
            error={errors.end ? t(errors.end) : undefined}
          />
        )}

        <label className="field">
          <span>{t('eventForm.valence')}</span>
          <div className="valence-input">
            <span className="muted">{MIN_VALENCE}</span>
            <input
              type="range"
              min={MIN_VALENCE}
              max={MAX_VALENCE}
              step={1}
              value={valence}
              onChange={(e) => setValence(Number(e.target.value))}
              aria-valuetext={`${valence > 0 ? '+' : ''}${valence}: ${t(valenceKey(valence))}`}
            />
            <span className="muted">+{MAX_VALENCE}</span>
            <output className={`valence-badge valence-${Math.sign(valence)}`}>
              {valence > 0 ? `+${valence}` : valence} · {t(valenceKey(valence))}
            </output>
          </div>
        </label>

        <label className="field">
          <span>{t('eventForm.symbol')}</span>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value as EventSymbol | '')}>
            <option value="">{t('symbols.none')}</option>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {t(`symbols.${s}`)}
              </option>
            ))}
          </select>
          <span className="hint">{t('eventForm.symbolHint')}</span>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={turningPoint}
            onChange={(e) => setTurningPoint(e.target.checked)}
          />
          <span>{t('eventForm.turningPoint')}</span>
        </label>

        <div className="field-row">
          <label className="field">
            <span>{t('eventForm.tags')}</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('eventForm.tagsPlaceholder')}
            />
          </label>
          <label className="field">
            <span>{t('eventForm.people')}</span>
            <input value={people} onChange={(e) => setPeople(e.target.value)} />
          </label>
        </div>
        <span className="hint">{t('eventForm.listHint')}</span>

        <label className="field">
          <span>{t('eventForm.description')}</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('eventForm.descriptionPlaceholder')}
          />
        </label>
        <label className="field">
          <span>{t('eventForm.reflection')}</span>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={t('eventForm.reflectionPlaceholder')}
          />
        </label>
      </form>
    </Modal>
  );
}
