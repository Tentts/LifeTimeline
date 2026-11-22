import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CompactLifelineGraph } from '../graph/CompactLifelineGraph';
import type { Timeline } from '../model/schema';
import { useEventWhen } from './useEventDateLabel';
import { formatValence, valenceKey } from './valence';

interface Props {
  timeline: Timeline;
  width: number;
  /** Omit for a read-only graph. */
  onEdit?: (id: string) => void;
}

/** Phone only: compact graph plus a card for the tapped event. */
export function CompactGraphSection({ timeline, width, onEdit }: Props) {
  const { t } = useTranslation();
  const when = useEventWhen();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = timeline.events.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="compact-graph">
      <CompactLifelineGraph
        timeline={timeline}
        width={width}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
      />
      {selected ? (
        <div className="selected-event" aria-live="polite">
          <div className="event-head">
            <span>{when(timeline.person.birthDate, selected)}</span>
            <span className={`valence-badge valence-${Math.sign(selected.valence)}`}>
              {formatValence(selected.valence)} · {t(valenceKey(selected.valence))}
            </span>
            {selected.isTurningPoint && (
              <span className="turning-point-badge">{t('eventForm.turningPointBadge')}</span>
            )}
          </div>
          <p className="selected-event-title">{selected.title}</p>
          {selected.description && <p className="selected-event-text">{selected.description}</p>}
          <div className="actions">
            {onEdit && (
              <button type="button" onClick={() => onEdit(selected.id)}>
                {t('common.edit')}
              </button>
            )}
            <button type="button" className="secondary" onClick={() => setSelectedId(null)}>
              {t('common.close')}
            </button>
          </div>
        </div>
      ) : (
        timeline.events.length > 0 && <p className="hint">{t('graph.tapHint')}</p>
      )}
    </div>
  );
}
