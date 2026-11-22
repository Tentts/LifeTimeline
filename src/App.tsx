import { useTranslation } from 'react-i18next';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Footer } from './components/Footer';
import { Header } from './components/Header';

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <Header />
      <DisclaimerBanner />
      <main className="app-main">
        <h2>{t('home.heading')}</h2>
        <p>{t('home.intro')}</p>
        <p className="muted">{t('home.comingSoon')}</p>
      </main>
      <Footer />
    </div>
  );
}
