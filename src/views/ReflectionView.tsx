import { useTranslation } from 'react-i18next';
import { useEventWhen } from '../components/useEventDateLabel';
import { formatValence } from '../components/valence';
import { sortEvents } from '../model/factory';
import { REFLECTION_QUESTIONS, type ReflectionQuestion, type Timeline } from '../model/schema';
import { useTimelines } from '../state/TimelinesContext';

interface Props {
  timeline: Timeline;
  onBack: () => void;
  onEditEvent: (id: string) => void;
}

/** Looks back over the whole timeline, with optional guided questions. Saved in this browser. */
export function ReflectionView({ timeline, onBack, onEditEvent }: Props) {
  const { t } = useTranslation();
  const { update } = useTimelines();
  const when = useEventWhen();
  const events = sortEvents(timeline.events);
  const turningPoints = events.filter((e) => e.isTurningPoint);
  const positive = events.filter((e) => e.valence > 0);
  const negative = events.filter((e) => e.valence < 0);
  const high = positive.reduce<(typeof events)[number] | null>(
    (best, e) => (!best || e.valence > best.valence ? e : best),
    null,
  );
  const low = negative.reduce<(typeof events)[number] | null>(
    (worst, e) => (!worst || e.valence < worst.valence ? e : worst),
    null,
  );

  const setAnswer = (id: ReflectionQuestion, value: string) => {
    update((tl) => {
      const answers = { ...tl.reflectionAnswers };
      if (value) answers[id] = value;
      else delete answers[id];
      return {
        ...tl,
        reflectionAnswers: Object.keys(answers).length > 0 ? answers : undefined,
      };
    });
  };

  const moment = (label: string, event: typeof high) => (
    <div className="glance-item">
      <span className="muted">{label}</span>
      {event ? (
        <button type="button" className="link-button" onClick={() => onEditEvent(event.id)}>
          {event.title} ({formatValence(event.valence)})
        </button>
      ) : (
        <span>{t('reflection.none')}</span>
      )}
    </div>
  );

  return (
    <div className="reflection">
      <section className="card" aria-labelledby="reflection-heading">
        <button type="button" className="link-button back" onClick={onBack}>
          ← {t('reflection.back')}
        </button>
        <h3 id="reflection-heading">{t('reflection.heading')}</h3>
        <p>{t('reflection.intro')}</p>

        <h4>{t('reflection.glanceHeading')}</h4>
        <div className="glance">
          <div className="glance-item">
            <span className="muted">{t('reflection.events')}</span>
            <strong>{timeline.events.length}</strong>
          </div>
          <div className="glance-item">
            <span className="muted">{t('reflection.chapters')}</span>
            <strong>{timeline.periods.length}</strong>
          </div>
          {moment(t('reflection.highPoint'), high)}
          {moment(t('reflection.lowPoint'), low)}
        </div>

        <h4>{t('reflection.turningPointsHeading')}</h4>
        {turningPoints.length === 0 ? (
          <p className="muted">{t('reflection.noTurningPoints')}</p>
        ) : (
          <ol className="turning-points">
            {turningPoints.map((event) => (
              <li key={event.id}>
                <button type="button" className="link-button" onClick={() => onEditEvent(event.id)}>
                  {event.title}
                </button>
                <span className="muted">{when(timeline.person.birthDate, event)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card" aria-labelledby="reflection-questions">
        <h3 id="reflection-questions">{t('reflection.questionsHeading')}</h3>
        <p className="hint">{t('reflection.questionsHint')}</p>
        <div className="form">
          {REFLECTION_QUESTIONS.map((id) => (
            <label key={id} className="field">
              <span>{t(`reflection.questions.${id}`)}</span>
              <textarea
                rows={3}
                maxLength={20000}
                value={timeline.reflectionAnswers?.[id] ?? ''}
                onChange={(e) => setAnswer(id, e.target.value)}
              />
            </label>
          ))}
          <label className="field">
            <span>{t('reflection.notes')}</span>
            <textarea
              rows={4}
              maxLength={50000}
              value={timeline.reflection ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                update((tl) => ({ ...tl, reflection: value || undefined }));
              }}
            />
          </label>
        </div>
        <p className="hint">{t('reflection.saved')}</p>
      </section>
    </div>
  );
}
