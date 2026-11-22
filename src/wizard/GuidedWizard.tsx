import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventWhen } from '../components/useEventDateLabel';
import { formatValence, valenceKey } from '../components/valence';
import { emptyEventDraft, sortEvents, type EventDraft } from '../model/factory';
import type { Timeline } from '../model/schema';
import {
  eventsInStage,
  loadProgress,
  saveProgress,
  stepKey,
  wizardSteps,
  type LifeStage,
} from './stages';

interface Props {
  timeline: Timeline;
  /** Opens the event editor pre-filled for the current step. */
  onAddEvent: (draft: EventDraft) => void;
  onEditEvent: (id: string) => void;
  onExport: () => void;
  onReflect: () => void;
  onClose: () => void;
}

/**
 * Guided walkthrough: intro → one step per life stage → key moments → finish.
 * Events are added to the timeline as you go, so the lifeline below grows step by step.
 * Progress is remembered in this browser so the user can take a break and continue later.
 */
export function GuidedWizard({
  timeline,
  onAddEvent,
  onEditEvent,
  onExport,
  onReflect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const steps = useMemo(() => wizardSteps(timeline.person.birthDate), [timeline.person.birthDate]);
  const [storedIndex, setIndex] = useState(() => {
    const saved = loadProgress(timeline.id);
    const found = steps.findIndex((s) => stepKey(s) === saved);
    return found >= 0 ? found : 0;
  });
  const [startCount] = useState(timeline.events.length);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Editing the birth date can change how many stages there are.
  const index = Math.min(storedIndex, steps.length - 1);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const goTo = (next: number) => {
    setIndex(next);
    saveProgress(timeline.id, stepKey(steps[next]));
  };
  const takeBreak = () => {
    saveProgress(timeline.id, stepKey(step));
    onClose();
  };
  const finish = () => {
    saveProgress(timeline.id, null);
    onClose();
  };

  const thisYear = new Date().getFullYear();

  return (
    <section className="card wizard" aria-labelledby="wizard-step-title">
      <div className="wizard-top">
        <span className="wizard-label">{t('wizard.title')}</span>
        <span className="muted">
          {t('wizard.progress', { current: index + 1, total: steps.length })}
        </span>
      </div>
      <div
        className="wizard-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-label={t('wizard.title')}
      >
        <div style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>

      {step.kind === 'intro' && (
        <>
          <h3 id="wizard-step-title" ref={headingRef} tabIndex={-1}>
            {t('wizard.intro.heading')}
          </h3>
          <p>{t('wizard.intro.body')}</p>
          <p>{t('wizard.intro.pace')}</p>
          <p className="notice">{t('wizard.gentle')}</p>
        </>
      )}

      {step.kind === 'stage' && (
        <StageStep
          stage={step.stage}
          timeline={timeline}
          headingRef={headingRef}
          onAdd={() => onAddEvent(emptyEventDraft({ year: step.stage.startYear }))}
          onEdit={onEditEvent}
        />
      )}

      {step.kind === 'keyMoments' && (
        <KeyMomentsStep
          timeline={timeline}
          headingRef={headingRef}
          onAdd={(patch) => onAddEvent({ ...emptyEventDraft({ year: thisYear }), ...patch })}
        />
      )}

      {step.kind === 'finish' && (
        <>
          <h3 id="wizard-step-title" ref={headingRef} tabIndex={-1}>
            {t('wizard.finish.heading')}
          </h3>
          <p>
            {t('wizard.finish.added', { count: Math.max(0, timeline.events.length - startCount) })}
          </p>
          <p>{t('wizard.finish.reflect')}</p>
          <p className="notice">{t('wizard.finish.backup')}</p>
          <div className="actions">
            <button type="button" className="secondary" onClick={onExport}>
              {t('wizard.finish.export')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                saveProgress(timeline.id, null);
                onReflect();
              }}
            >
              {t('reflection.button')}
            </button>
          </div>
        </>
      )}

      <div className="wizard-nav">
        {index > 0 && (
          <button type="button" className="secondary" onClick={() => goTo(index - 1)}>
            ← {t('wizard.back')}
          </button>
        )}
        <button type="button" className="secondary wizard-break" onClick={takeBreak}>
          {t(step.kind === 'intro' ? 'wizard.notNow' : 'wizard.takeBreak')}
        </button>
        {isLast ? (
          <button type="button" onClick={finish}>
            {t('wizard.done')}
          </button>
        ) : (
          <button type="button" onClick={() => goTo(index + 1)}>
            {t(step.kind === 'intro' ? 'wizard.start' : 'wizard.next')} →
          </button>
        )}
      </div>
    </section>
  );
}

function StageStep({
  stage,
  timeline,
  headingRef,
  onAdd,
  onEdit,
}: {
  stage: LifeStage;
  timeline: Timeline;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const { t } = useTranslation();
  const when = useEventWhen();
  const events = eventsInStage(timeline, stage);
  const range = stage.isCurrent
    ? t('wizard.stageRangeCurrent', { from: stage.fromAge, startYear: stage.startYear })
    : t('wizard.stageRange', {
        from: stage.fromAge,
        to: stage.toAge,
        startYear: stage.startYear,
        endYear: stage.endYear,
      });

  return (
    <>
      <h3 id="wizard-step-title" ref={headingRef} tabIndex={-1}>
        {t(`wizard.stages.${stage.id}.title`)}
      </h3>
      <p className="muted wizard-range">{range}</p>
      <p>{t('wizard.promptsIntro')}</p>
      <ul className="wizard-prompts">
        <li>{t(`wizard.stages.${stage.id}.p1`)}</li>
        <li>{t(`wizard.stages.${stage.id}.p2`)}</li>
        <li>{t(`wizard.stages.${stage.id}.p3`)}</li>
      </ul>
      <button type="button" onClick={onAdd}>
        + {t('wizard.addFromStage')}
      </button>

      <h4 className="wizard-subheading">{t('wizard.onTimeline')}</h4>
      {events.length === 0 ? (
        <p className="muted">{t('wizard.nothingYet')}</p>
      ) : (
        <ul className="wizard-events">
          {events.map((e) => (
            <li key={e.id}>
              <button type="button" className="link-button" onClick={() => onEdit(e.id)}>
                {e.title}
              </button>
              <span className="muted">{when(timeline.person.birthDate, e)}</span>
              <span className={`valence-badge valence-${Math.sign(e.valence)}`}>
                {formatValence(e.valence)} · {t(valenceKey(e.valence))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">{t('wizard.gentleShort')}</p>
    </>
  );
}

function KeyMomentsStep({
  timeline,
  headingRef,
  onAdd,
}: {
  timeline: Timeline;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onAdd: (patch: Partial<EventDraft>) => void;
}) {
  const { t } = useTranslation();
  const sorted = sortEvents(timeline.events);
  const highest = sorted.reduce<(typeof sorted)[number] | null>(
    (best, e) => (e.valence > 0 && (!best || e.valence > best.valence) ? e : best),
    null,
  );
  const lowest = sorted.reduce<(typeof sorted)[number] | null>(
    (worst, e) => (e.valence < 0 && (!worst || e.valence < worst.valence) ? e : worst),
    null,
  );
  const turningPoints = sorted.filter((e) => e.isTurningPoint);

  const moments = [
    {
      id: 'high',
      existing: highest ? [highest.title] : [],
      patch: { valence: 4 },
    },
    {
      id: 'low',
      existing: lowest ? [lowest.title] : [],
      patch: { valence: -4 },
    },
    {
      id: 'turning',
      existing: turningPoints.map((e) => e.title),
      patch: { isTurningPoint: true },
    },
  ] as const;

  return (
    <>
      <h3 id="wizard-step-title" ref={headingRef} tabIndex={-1}>
        {t('wizard.keyMoments.heading')}
      </h3>
      <p>{t('wizard.keyMoments.intro')}</p>
      <div className="key-moments">
        {moments.map((m) => (
          <div key={m.id} className={`key-moment key-moment-${m.id}`}>
            <h4>{t(`wizard.keyMoments.${m.id}.title`)}</h4>
            <p>{t(`wizard.keyMoments.${m.id}.prompt`)}</p>
            {m.existing.length > 0 && (
              <p className="muted">
                {t('wizard.keyMoments.existing', { titles: m.existing.join(', ') })}
              </p>
            )}
            <button type="button" className="secondary" onClick={() => onAdd(m.patch)}>
              + {t(`wizard.keyMoments.${m.id}.add`)}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
