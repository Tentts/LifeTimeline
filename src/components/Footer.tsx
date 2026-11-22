import { useTranslation } from 'react-i18next';

export function Footer({ onShowPrivacy }: { onShowPrivacy: () => void }) {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <p>{t('footer.privacy')}</p>
      <nav className="footer-links">
        <button type="button" className="link-button" onClick={onShowPrivacy}>
          {t('footer.privacyLink')}
        </button>
        <a href="https://github.com/Tentts/LifeTimeline" target="_blank" rel="noreferrer">
          {t('footer.source')}
        </a>
        <span>v{__APP_VERSION__}</span>
      </nav>
    </footer>
  );
}
