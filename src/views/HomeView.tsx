import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { OpenTlButton } from '../components/OpenTlButton';
import { TimelineDetailsDialog } from '../components/TimelineDetailsDialog';
import { ExampleGraph } from '../example/ExampleGraph';
import { buildExampleTimeline } from '../example/exampleTimeline';
import { ExampleView } from '../example/ExampleView';
import { useTimelines } from '../state/TimelinesContext';
import type { TimelineSummary } from '../storage/db';

export function HomeView() {
  const { t, i18n } = useTranslation();
  const { summaries, loading, create, open, remove } = useTimelines();
  const [creating, setCreating] = useState(false);
  const [viewingExample, setViewingExample] = useState(false);
  const [deleting, setDeleting] = useState<TimelineSummary | null>(null);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  if (viewingExample) {
    return (
      <ExampleView
        onBack={() => setViewingExample(false)}
        onCreateOwn={() => {
          setViewingExample(false);
          setCreating(true);
        }}
      />
    );
  }

  const isFirstVisit = !loading && summaries.length === 0;

  return (
    <div className="home">
      <section className="card">
        <h2>{t('home.heading')}</h2>
        <p>{t('home.intro')}</p>
        <div className="actions">
          <button type="button" onClick={() => setCreating(true)}>
            {t('home.new')}
          </button>
          <OpenTlButton className="secondary" />
          {!loading && !isFirstVisit && (
            <button type="button" className="secondary" onClick={() => setViewingExample(true)}>
              {t('example.see')}
            </button>
          )}
        </div>
      </section>

      {isFirstVisit && (
        <section className="card example-preview" aria-labelledby="example-preview-heading">
          <span className="example-badge">{t('example.badge')}</span>
          <h2 id="example-preview-heading">{t('example.previewHeading')}</h2>
          <p>{t('example.previewBody')}</p>
          <ExampleGraph timeline={buildExampleTimeline(t)} />
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setViewingExample(true)}>
              {t('example.explore')}
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{t('home.savedHeading')}</h2>
        <p className="muted">{t('home.savedHint')}</p>
        {!loading && summaries.length === 0 && <p>{t('home.empty')}</p>}
        {summaries.length > 0 && (
          <ul className="timeline-list">
            {summaries.map((s) => (
              <li key={s.id}>
                <button type="button" className="link-button" onClick={() => void open(s.id)}>
                  {s.title}
                </button>
                <span className="muted">
                  {t('home.summary', { count: s.eventCount, date: formatDate(s.updatedAt) })}
                </span>
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => setDeleting(s)}
                  aria-label={t('home.deleteLabel', { title: s.title })}
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating && (
        <TimelineDetailsDialog
          mode="create"
          onCancel={() => setCreating(false)}
          onSubmit={(details) => {
            setCreating(false);
            void create(details);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('home.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void remove(deleting.id);
            setDeleting(null);
          }}
        >
          <p>{t('home.deleteBody', { title: deleting.title })}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
