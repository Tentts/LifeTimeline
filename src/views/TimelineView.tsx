import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EventDialog } from '../components/EventDialog';
import { EventList } from '../components/EventList';
import { ExportDialog } from '../components/ExportDialog';
import { TimelineDetailsDialog } from '../components/TimelineDetailsDialog';
import { formatDateLabel } from '../components/useEventDateLabel';
import { LifelineGraph } from '../graph/LifelineGraph';
import { SCREEN_PALETTE } from '../graph/palette';
import { emptyEventDraft, newId, type EventDraft } from '../model/factory';
import type { LifeEvent, Timeline } from '../model/schema';
import { useTimelines } from '../state/TimelinesContext';

type Editing = { mode: 'create' } | { mode: 'edit'; event: LifeEvent };

const withoutId = ({ id: _id, ...draft }: LifeEvent): EventDraft => draft;

export function TimelineView({ timeline }: { timeline: Timeline }) {
  const { t, i18n } = useTranslation();
  const { update, close } = useTimelines();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<LifeEvent | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  const locale = i18n.resolvedLanguage ?? 'en';

  const editEvent = (id: string) => {
    const event = timeline.events.find((e) => e.id === id);
    if (event) setEditing({ mode: 'edit', event });
  };

  const saveEvent = (draft: EventDraft) => {
    if (!editing) return;
    if (editing.mode === 'create') {
      update((tl) => ({ ...tl, events: [...tl.events, { ...draft, id: newId() }] }));
    } else {
      const id = editing.event.id;
      update((tl) => ({
        ...tl,
        events: tl.events.map((e) => (e.id === id ? { ...draft, id } : e)),
      }));
    }
    setEditing(null);
  };

  return (
    <div className="timeline-view">
      <section className="card timeline-header">
        <div>
          <button type="button" className="link-button back" onClick={close}>
            ← {t('timeline.back')}
          </button>
          <h2>{timeline.title}</h2>
          <p className="muted">
            {[
              timeline.person.name,
              t('pdf.born', { date: formatDateLabel(t, locale, timeline.person.birthDate) }),
              t('timeline.eventCount', { count: timeline.events.length }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="actions">
          <button type="button" onClick={() => setEditing({ mode: 'create' })}>
            + {t('timeline.addEvent')}
          </button>
          <button type="button" className="secondary" onClick={() => setExporting(true)}>
            {t('timeline.export')}
          </button>
          <button type="button" className="secondary" onClick={() => setEditingDetails(true)}>
            {t('timeline.editDetails')}
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="visually-hidden">{t('timeline.graphHeading')}</h3>
        <div className="graph-container">
          <LifelineGraph timeline={timeline} palette={SCREEN_PALETTE} onSelectEvent={editEvent} />
        </div>
        <p className="hint">{t('timeline.savedLocally')}</p>
      </section>

      <section className="card">
        <h3>{t('timeline.eventsHeading')}</h3>
        <EventList timeline={timeline} onEdit={editEvent} />
      </section>

      {editing && (
        <EventDialog
          mode={editing.mode}
          initial={
            editing.mode === 'edit'
              ? withoutId(editing.event)
              : emptyEventDraft({ year: new Date().getFullYear() })
          }
          onCancel={() => setEditing(null)}
          onSubmit={saveEvent}
          onDelete={
            editing.mode === 'edit'
              ? () => {
                  setDeleting(editing.event);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('timeline.deleteEventTitle')}
          confirmLabel={t('common.delete')}
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const id = deleting.id;
            update((tl) => ({ ...tl, events: tl.events.filter((e) => e.id !== id) }));
            setDeleting(null);
          }}
        >
          <p>{t('timeline.deleteEventBody', { title: deleting.title })}</p>
        </ConfirmDialog>
      )}

      {editingDetails && (
        <TimelineDetailsDialog
          mode="edit"
          initial={{
            title: timeline.title,
            name: timeline.person.name,
            birthDate: timeline.person.birthDate,
          }}
          onCancel={() => setEditingDetails(false)}
          onSubmit={(details) => {
            update((tl) => ({
              ...tl,
              title: details.title,
              person: { name: details.name, birthDate: details.birthDate },
            }));
            setEditingDetails(false);
          }}
        />
      )}

      {exporting && <ExportDialog timeline={timeline} onClose={() => setExporting(false)} />}
    </div>
  );
}
