import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { OpenTlButton } from '../components/OpenTlButton';
import { TimelineDetailsDialog } from '../components/TimelineDetailsDialog';
import { useTimelines } from '../state/TimelinesContext';
import type { TimelineSummary } from '../storage/db';

export function HomeView() {
  const { t, i18n } = useTranslation();
  const { summaries, loading, create, open, remove } = useTimelines();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TimelineSummary | null>(null);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

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
        </div>
      </section>

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
