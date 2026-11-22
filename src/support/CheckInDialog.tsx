import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { setCheckInsEnabled } from './checkIn';

interface Props {
  onClose: () => void;
  onFindSupport: () => void;
}

/** A gentle pause after difficult moments or long sessions, with a short grounding exercise. */
export function CheckInDialog({ onClose, onFindSupport }: Props) {
  const { t } = useTranslation();
  const [resting, setResting] = useState(false);

  if (resting) {
    return (
      <Modal
        title={t('checkIn.breakTitle')}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="secondary" onClick={onFindSupport}>
              {t('checkIn.findSupport')}
            </button>
            <button type="button" onClick={onClose}>
              {t('checkIn.ready')}
            </button>
          </>
        }
      >
        <p>{t('checkIn.breakIntro')}</p>
        <ol className="grounding">
          <li>{t('checkIn.steps.see')}</li>
          <li>{t('checkIn.steps.touch')}</li>
          <li>{t('checkIn.steps.hear')}</li>
          <li>{t('checkIn.steps.smell')}</li>
          <li>{t('checkIn.steps.taste')}</li>
        </ol>
        <p>{t('checkIn.breathe')}</p>
        <p className="hint">{t('checkIn.saved')}</p>
      </Modal>
    );
  }

  return (
    <Modal
      title={t('checkIn.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary" onClick={onFindSupport}>
            {t('checkIn.findSupport')}
          </button>
          <button type="button" className="secondary" onClick={() => setResting(true)}>
            {t('checkIn.takeBreak')}
          </button>
          <button type="button" onClick={onClose}>
            {t('checkIn.keepGoing')}
          </button>
        </>
      }
    >
      <p>{t('checkIn.body')}</p>
      <button
        type="button"
        className="link-button"
        onClick={() => {
          setCheckInsEnabled(false);
          onClose();
        }}
      >
        {t('checkIn.stop')}
      </button>
    </Modal>
  );
}
