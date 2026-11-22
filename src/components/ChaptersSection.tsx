import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newId } from '../model/factory';
import { chapterColor, eventsInPeriod, nextChapterColor, sortPeriods } from '../model/periods';
import type { LifePeriod, Timeline } from '../model/schema';
import { useTimelines } from '../state/TimelinesContext';
import { ChapterDialog, type ChapterDraft } from './ChapterDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { formatPeriodRange } from './useEventDateLabel';

type Editing = { mode: 'create' } | { mode: 'edit'; period: LifePeriod };

/** The chapters of a life: named periods shown as coloured bands on the graph. */
export function ChaptersSection({ timeline }: { timeline: Timeline }) {
  const { t, i18n } = useTranslation();
  const { update } = useTimelines();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<LifePeriod | null>(null);
  const locale = i18n.resolvedLanguage ?? 'en';
  const periods = sortPeriods(timeline.periods);

  const save = (draft: ChapterDraft) => {
    if (!editing) return;
    if (editing.mode === 'create') {
      update((tl) => ({ ...tl, periods: [...tl.periods, { ...draft, id: newId() }] }));
    } else {
      const id = editing.period.id;
      update((tl) => ({
        ...tl,
        periods: tl.periods.map((p) => (p.id === id ? { ...draft, id } : p)),
      }));
    }
    setEditing(null);
  };

  return (
    <section className="card" aria-labelledby="chapters-heading">
      <div className="section-head">
        <h3 id="chapters-heading">{t('chapters.heading')}</h3>
        <button type="button" className="secondary" onClick={() => setEditing({ mode: 'create' })}>
          + {t('chapters.add')}
        </button>
      </div>

      {periods.length === 0 ? (
        <p className="muted">{t('chapters.empty')}</p>
      ) : (
        <ul className="chapter-list">
          {periods.map((period, index) => (
            <li key={period.id}>
              <span
                className="chapter-dot"
                style={{ background: chapterColor(period, index) }}
                aria-hidden="true"
              />
              <button
                type="button"
                className="link-button"
                onClick={() => setEditing({ mode: 'edit', period })}
              >
                {period.name}
              </button>
              <span className="muted">
                {formatPeriodRange(t, locale, period)} ·{' '}
                {t('timeline.eventCount', {
                  count: eventsInPeriod(timeline.events, period).length,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ChapterDialog
          mode={editing.mode}
          initial={editing.mode === 'edit' ? editing.period : undefined}
          defaultColor={nextChapterColor(timeline.periods)}
          birthDate={timeline.person.birthDate}
          onCancel={() => setEditing(null)}
          onSubmit={save}
          onDelete={
            editing.mode === 'edit'
              ? () => {
                  setDeleting(editing.period);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('chapters.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const id = deleting.id;
            update((tl) => ({ ...tl, periods: tl.periods.filter((p) => p.id !== id) }));
            setDeleting(null);
          }}
        >
          <p>{t('chapters.deleteBody', { title: deleting.name })}</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
