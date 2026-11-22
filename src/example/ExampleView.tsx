import { useTranslation } from 'react-i18next';
import { EventList } from '../components/EventList';
import { formatPeriodRange } from '../components/useEventDateLabel';
import { chapterColor, sortPeriods } from '../model/periods';
import { useTimelines } from '../state/TimelinesContext';
import { buildExampleTimeline, copyOfExample } from './exampleTimeline';
import { ExampleGraph } from './ExampleGraph';

interface Props {
  onBack: () => void;
  onCreateOwn: () => void;
}

/** The fictional example, read-only. Nothing is saved unless the user makes a copy. */
export function ExampleView({ onBack, onCreateOwn }: Props) {
  const { t, i18n } = useTranslation();
  const { importTimeline } = useTimelines();
  const example = buildExampleTimeline(t);
  const locale = i18n.resolvedLanguage ?? 'en';

  return (
    <div className="example-view">
      <section className="card">
        <button type="button" className="link-button back" onClick={onBack}>
          ← {t('example.back')}
        </button>
        <span className="example-badge">{t('example.badge')}</span>
        <h2>{example.title}</h2>
        <p className="muted">{t('example.notice')}</p>
        <div className="actions">
          <button type="button" onClick={onCreateOwn}>
            {t('example.createOwn')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void importTimeline(copyOfExample(example))}
          >
            {t('example.copy')}
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="visually-hidden">{t('timeline.graphHeading')}</h3>
        <ExampleGraph timeline={example} />
      </section>

      <section className="card">
        <h3>{t('chapters.heading')}</h3>
        <ul className="chapter-list">
          {sortPeriods(example.periods).map((period, index) => (
            <li key={period.id}>
              <span
                className="chapter-dot"
                style={{ background: chapterColor(period, index) }}
                aria-hidden="true"
              />
              <strong>{period.name}</strong>
              <span className="muted">{formatPeriodRange(t, locale, period)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>{t('timeline.eventsHeading')}</h3>
        <EventList timeline={example} />
      </section>
    </div>
  );
}
