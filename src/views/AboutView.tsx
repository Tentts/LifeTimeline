import { useTranslation } from 'react-i18next';

const GITHUB_PROFILE_URL = 'https://github.com/Tentts';

export function AboutView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="card about" aria-labelledby="about-heading">
      <button type="button" className="link-button back" onClick={onBack}>
        ← {t('about.back')}
      </button>
      <h2 id="about-heading">{t('about.heading')}</h2>
      <p>{t('about.app')}</p>

      <h3>{t('about.creatorHeading')}</h3>
      <p>{t('about.creator')}</p>
      <p>{t('about.projects')}</p>
      <a className="about-link" href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">
        {/* Served from this site: the privacy policy blocks images from other hosts. */}
        <img src={`${import.meta.env.BASE_URL}tentts-avatar.png`} alt="" width={32} height={32} />
        <span>{t('about.github')}</span>
      </a>
    </section>
  );
}
