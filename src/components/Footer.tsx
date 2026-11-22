import { useTranslation } from 'react-i18next';

export function Footer({
  onShowPrivacy,
  onShowAbout,
  onShowSupport,
}: {
  onShowPrivacy: () => void;
  onShowAbout: () => void;
  onShowSupport: () => void;
}) {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <p>{t('footer.privacy')}</p>
      <nav className="footer-links">
        <button type="button" className="link-button footer-support" onClick={onShowSupport}>
          {t('support.footerLink')}
        </button>
        <button type="button" className="link-button" onClick={onShowPrivacy}>
          {t('footer.privacyLink')}
        </button>
        <button type="button" className="link-button" onClick={onShowAbout}>
          {t('footer.aboutLink')}
        </button>
        <a href="https://github.com/Tentts/LifeTimeline" target="_blank" rel="noreferrer">
          {t('footer.source')}
        </a>
        <span>v{__APP_VERSION__}</span>
      </nav>
    </footer>
  );
}
