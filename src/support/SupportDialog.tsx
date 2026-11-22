import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { checkInsEnabled, setCheckInsEnabled } from './checkIn';
import { CRISIS_LINES, FIND_A_HELPLINE_URL } from './resources';

/** Crisis lines and support. Opens over the current screen so nobody loses their place. */
export function SupportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [checkIns, setCheckIns] = useState(checkInsEnabled);

  return (
    <Modal
      title={t('support.title')}
      onClose={onClose}
      wide
      footer={
        <button type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <p>{t('support.lead')}</p>
      <p className="support-emergency" role="note">
        {t('support.emergency')}
      </p>

      <h3 className="support-heading">{t('support.linesHeading')}</h3>
      <ul className="crisis-lines">
        {CRISIS_LINES.map((line) => (
          <li key={line.id}>
            <span className="muted">{t(`support.regions.${line.id}`)}</span>
            <strong>{line.name}</strong>
            {line.id === 'us' && <span className="hint">{t('support.usSpanish')}</span>}
            <span className="crisis-actions">
              <a className="crisis-call" href={`tel:${line.tel}`}>
                {t('support.call', { number: line.phone })}
              </a>
              <a href={line.url} target="_blank" rel="noopener noreferrer">
                {t('support.website')}
              </a>
            </span>
            <span className="hint">{t('support.emergencyNumber', { number: line.emergency })}</span>
          </li>
        ))}
      </ul>

      <h3 className="support-heading">{t('support.otherHeading')}</h3>
      <p>
        {t('support.otherBody')}{' '}
        <a href={FIND_A_HELPLINE_URL} target="_blank" rel="noopener noreferrer">
          {t('support.otherLink')}
        </a>
      </p>
      <p className="hint">{t('support.privacy')}</p>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={checkIns}
          onChange={(e) => {
            setCheckInsEnabled(e.target.checked);
            setCheckIns(e.target.checked);
          }}
        />
        <span>{t('support.checkInsToggle')}</span>
      </label>
    </Modal>
  );
}
