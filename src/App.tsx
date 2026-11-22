import { useState } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TimelinesProvider, useTimelines } from './state/TimelinesContext';
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
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="app">
      <Header />
      <DisclaimerBanner />
      <main className="app-main">
        {showPrivacy ? (
          <PrivacyView onBack={() => setShowPrivacy(false)} />
        ) : current ? (
          <TimelineView key={current.id} timeline={current} />
        ) : (
          <HomeView />
        )}
      </main>
      <Footer onShowPrivacy={() => setShowPrivacy(true)} />
    </div>
  );
}
