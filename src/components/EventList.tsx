import { useTranslation } from 'react-i18next';
import { sortEvents } from '../model/factory';
import type { Timeline } from '../model/schema';
import { useEventWhen } from './useEventDateLabel';
import { formatValence, valenceKey } from './valence';

const SYMBOL_EMOJI = {
  flower: '🌸',
  stone: '🪨',
  candle: '🕯️',
  stick: '🪵',
  star: '⭐',
} as const;

interface Props {
  timeline: Timeline;
  onEdit: (id: string) => void;
}

/** Chronological list: the accessible, text-only view of the timeline. */
export function EventList({ timeline, onEdit }: Props) {
  const { t } = useTranslation();
  const when = useEventWhen();
  const events = sortEvents(timeline.events);

  if (events.length === 0) return <p className="muted">{t('timeline.noEvents')}</p>;

  return (
    <ol className="event-list">
      {events.map((event) => (
        <li key={event.id} className={`event-item valence-border-${Math.sign(event.valence)}`}>
          <div className="event-head">
            <span className="event-when">{when(timeline.person.birthDate, event)}</span>
            <span className={`valence-badge valence-${Math.sign(event.valence)}`}>
              {formatValence(event.valence)} · {t(valenceKey(event.valence))}
            </span>
            {event.symbol && (
              <span className="event-symbol" title={t(`symbols.${event.symbol}`)}>
                <span aria-hidden="true">{SYMBOL_EMOJI[event.symbol]}</span>{' '}
                {t(`symbols.${event.symbol}`)}
              </span>
            )}
            {event.isTurningPoint && (
              <span className="turning-point-badge">{t('eventForm.turningPointBadge')}</span>
            )}
          </div>
          <h3 className="event-title">
            <button type="button" className="link-button" onClick={() => onEdit(event.id)}>
              {event.title}
            </button>
          </h3>
          {event.description && <p className="event-text">{event.description}</p>}
          {event.reflection && (
            <p className="event-text event-reflection">
              <strong>{t('eventForm.reflection')}:</strong> {event.reflection}
            </p>
          )}
          {(event.tags.length > 0 || event.people.length > 0) && (
            <p className="event-meta muted">
              {[...event.tags.map((tag) => `#${tag}`), ...event.people].join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
