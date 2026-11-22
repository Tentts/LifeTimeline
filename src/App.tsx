import { useState } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TimelinesProvider, useTimelines } from './state/TimelinesContext';
import { SupportDialog } from './support/SupportDialog';
import { AboutView } from './views/AboutView';
import { HomeView } from './views/HomeView';
import { PrivacyView } from './views/PrivacyView';
import { TimelineView } from './views/TimelineView';

export default function App() {
  return (
    <TimelinesProvider>
      <Shell />
    </TimelinesProvider>
  );
}

function Shell() {
  const { current } = useTimelines();
  const [page, setPage] = useState<'privacy' | 'about' | null>(null);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="app">
      <Header />
      <DisclaimerBanner />
      <main className="app-main">
        {page === 'privacy' ? (
          <PrivacyView onBack={() => setPage(null)} />
        ) : page === 'about' ? (
          <AboutView onBack={() => setPage(null)} />
        ) : current ? (
          <TimelineView key={current.id} timeline={current} />
        ) : (
          <HomeView />
        )}
      </main>
      <Footer
        onShowPrivacy={() => setPage('privacy')}
        onShowAbout={() => setPage('about')}
        onShowSupport={() => setShowSupport(true)}
      />
      {showSupport && <SupportDialog onClose={() => setShowSupport(false)} />}
    </div>
  );
}
