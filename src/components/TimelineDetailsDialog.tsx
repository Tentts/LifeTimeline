import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { FuzzyDate } from '../model/fuzzyDate';
import { FuzzyDateInput } from './FuzzyDateInput';
import { fromFields, toFields, validateDateFields, type DateError } from './fuzzyDateFields';
import { Modal } from './Modal';
import { PrivacyNotice } from './PrivacyNotice';

export interface TimelineDetails {
  title: string;
  name?: string;
  birthDate: FuzzyDate;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: TimelineDetails;
  onSubmit: (details: TimelineDetails) => void;
  onCancel: () => void;
}

/**
 * Create a timeline (includes the privacy notice, which must be acknowledged) or edit its details.
 */
export function TimelineDetailsDialog({ mode, initial, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [birth, setBirth] = useState(toFields(initial?.birthDate));
  const [acknowledged, setAcknowledged] = useState(mode === 'edit');
  const [errors, setErrors] = useState<{ title?: boolean; birth?: DateError | null }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const birthError = validateDateFields(birth, true);
    const titleMissing = title.trim() === '';
    setErrors({ title: titleMissing, birth: birthError });
    if (titleMissing || birthError || !acknowledged) return;
    onSubmit({
      title: title.trim(),
      name: name.trim() || undefined,
      birthDate: fromFields({ ...birth, approx: false })!,
    });
  };

  return (
    <Modal
      title={t(mode === 'create' ? 'timelineForm.createTitle' : 'timelineForm.editTitle')}
      onClose={onCancel}
      wide={mode === 'create'}
      footer={
        <>
          <button type="button" className="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" form={formId} disabled={!acknowledged}>
            {t(mode === 'create' ? 'timelineForm.create' : 'common.save')}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="form">
        <label className="field">
          <span>
            {t('timelineForm.title')}
            <span aria-hidden="true"> *</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('timelineForm.titlePlaceholder')}
            maxLength={200}
            required
            aria-invalid={errors.title || undefined}
          />
          {errors.title && (
            <span className="field-error" role="alert">
              {t('timelineForm.titleRequired')}
            </span>
          )}
        </label>
        <label className="field">
          <span>{t('timelineForm.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          <span className="hint">{t('timelineForm.nameHint')}</span>
        </label>
        <FuzzyDateInput
          legend={t('timelineForm.birthDate')}
          value={birth}
          onChange={setBirth}
          required
          allowApprox={false}
          error={errors.birth ? t(errors.birth) : undefined}
        />

        {mode === 'create' && (
          <section className="privacy-box" aria-labelledby={`${formId}-privacy`}>
            <h3 id={`${formId}-privacy`}>{t('privacy.title')}</h3>
            <PrivacyNotice />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>{t('privacy.acknowledge')}</span>
            </label>
          </section>
        )}
      </form>
    </Modal>
  );
}
