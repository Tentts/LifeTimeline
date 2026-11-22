import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DISCLAIMER_STORAGE_KEY = 'lifetimeline.disclaimerAccepted';

function readAccepted(): boolean {
  try {
    return localStorage.getItem(DISCLAIMER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function DisclaimerBanner() {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(readAccepted);

  if (accepted) return null;

  const accept = () => {
    try {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    } catch {
      // Storage unavailable (e.g. private mode): just hide for this visit.
    }
    setAccepted(true);
  };

  return (
    <section className="disclaimer" role="note" aria-labelledby="disclaimer-title">
      <h2 id="disclaimer-title">{t('disclaimer.title')}</h2>
      <p>{t('disclaimer.body')}</p>
      <button type="button" onClick={accept}>
        {t('disclaimer.dismiss')}
      </button>
    </section>
  );
}
