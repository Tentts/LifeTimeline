import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { useTimelines } from '../state/TimelinesContext';

export function PrivacyView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { removeAll, summaries } = useTimelines();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="card">
      <button type="button" className="link-button back" onClick={onBack}>
        ← {t('timeline.back')}
      </button>
      <h2>{t('privacy.title')}</h2>
      <PrivacyNotice />
      <h3>{t('privacy.howHeading')}</h3>
      <ul>
        <li>{t('privacy.how.noServer')}</li>
        <li>{t('privacy.how.blocked')}</li>
        <li>{t('privacy.how.exports')}</li>
      </ul>

      <h3>{t('privacy.deleteHeading')}</h3>
      <p>{t('privacy.deleteBody')}</p>
      <button type="button" className="danger" onClick={() => setConfirming(true)}>
        {t('privacy.deleteButton')}
      </button>
      {done && (
        <p role="status" className="notice">
          {t('privacy.deleted')}
        </p>
      )}

      {confirming && (
        <ConfirmDialog
          title={t('privacy.deleteConfirmTitle')}
          confirmLabel={t('privacy.deleteButton')}
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            void removeAll().then(() => setDone(true));
          }}
        >
          <p>{t('privacy.deleteConfirmBody', { count: summaries.length })}</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
