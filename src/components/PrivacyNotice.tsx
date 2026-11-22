import { useTranslation } from 'react-i18next';

/** The "we never store your data" explanation, shown when creating a timeline and on the Privacy page. */
export function PrivacyNotice() {
  const { t } = useTranslation();
  return (
    <div className="privacy-notice">
      <p className="privacy-lead">{t('privacy.lead')}</p>
      <ul>
        <li>{t('privacy.points.localOnly')}</li>
        <li>{t('privacy.points.canBeLost')}</li>
        <li>{t('privacy.points.backup')}</li>
        <li>{t('privacy.points.filesAreSensitive')}</li>
      </ul>
    </div>
  );
}
