import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createTimeline, newId, touch } from '../model/factory';
import type { FuzzyDate, Timeline } from '../model/schema';
import * as db from '../storage/db';

export type ImportConflict = { incoming: Timeline };

interface TimelinesState {
  summaries: db.TimelineSummary[];
  current: Timeline | null;
  loading: boolean;
  create(input: { title: string; birthDate: FuzzyDate; name?: string }): Promise<void>;
  open(id: string): Promise<void>;
  close(): void;
  update(change: (timeline: Timeline) => Timeline): void;
  remove(id: string): Promise<void>;
  removeAll(): Promise<void>;
  /** Returns a conflict when a timeline with the same id already exists in this browser. */
  importTimeline(timeline: Timeline): Promise<ImportConflict | null>;
  resolveImport(incoming: Timeline, mode: 'replace' | 'keepBoth'): Promise<void>;
}

const TimelinesContext = createContext<TimelinesState | null>(null);

export function TimelinesProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummaries] = useState<db.TimelineSummary[]>([]);
  const [current, setCurrent] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSummaries(await db.listTimelines());
  }, []);

  useEffect(() => {
    let active = true;
    db.listTimelines()
      .then((list) => active && setSummaries(list))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(
    async (timeline: Timeline) => {
      await db.saveTimeline(timeline);
      await refresh();
    },
    [refresh],
  );

  const show = useCallback(
    async (timeline: Timeline) => {
      await persist(timeline);
      setCurrent(timeline);
      void db.requestPersistentStorage();
    },
    [persist],
  );

  const value = useMemo<TimelinesState>(
    () => ({
      summaries,
      current,
      loading,
      create: (input) => show(createTimeline(input)),
      async open(id) {
        const timeline = await db.getTimeline(id);
        if (timeline) setCurrent(timeline);
      },
      close: () => setCurrent(null),
      update(change) {
        setCurrent((previous) => {
          if (!previous) return previous;
          const next = touch(change(previous));
          void persist(next); // autosave to this browser only
          return next;
        });
      },
      async remove(id) {
        await db.deleteTimeline(id);
        setCurrent((c) => (c?.id === id ? null : c));
        await refresh();
      },
      async removeAll() {
        await db.deleteAllData();
        setCurrent(null);
        await refresh();
      },
      async importTimeline(timeline) {
        if (await db.getTimeline(timeline.id)) return { incoming: timeline };
        await show(timeline);
        return null;
      },
      resolveImport: (incoming, mode) =>
        show(mode === 'replace' ? incoming : { ...incoming, id: newId() }),
    }),
    [summaries, current, loading, show, persist, refresh],
  );

  return <TimelinesContext.Provider value={value}>{children}</TimelinesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useTimelines(): TimelinesState {
  const state = useContext(TimelinesContext);
  if (!state) throw new Error('useTimelines must be used inside <TimelinesProvider>');
  return state;
}
