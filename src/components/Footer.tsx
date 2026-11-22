import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <p>{t('footer.privacy')}</p>
      <a href="https://github.com/Tentts/LifeTimeline" target="_blank" rel="noreferrer">
        {t('footer.source')}
      </a>
    </footer>
  );
}
