/**
 * Local persistence. Everything is stored in this browser only (IndexedDB + localStorage);
 * nothing is ever sent anywhere.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { timelineSchema, type Timeline } from '../model/schema';

export const DB_NAME = 'lifetimeline';
const DB_VERSION = 1;
const STORE = 'timelines';
export const LOCAL_STORAGE_PREFIX = 'lifetimeline.';

interface LifeTimelineDB extends DBSchema {
  timelines: { key: string; value: Timeline };
}

let dbPromise: Promise<IDBPDatabase<LifeTimelineDB>> | null = null;

function db() {
  dbPromise ??= openDB<LifeTimelineDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export interface TimelineSummary {
  id: string;
  title: string;
  eventCount: number;
  updatedAt: string;
}

export async function listTimelines(): Promise<TimelineSummary[]> {
  const all = await (await db()).getAll(STORE);
  return all
    .map(({ id, title, events, updatedAt }) => ({
      id,
      title,
      eventCount: events.length,
      updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTimeline(id: string): Promise<Timeline | undefined> {
  const stored = await (await db()).get(STORE, id);
  if (!stored) return undefined;
  const parsed = timelineSchema.safeParse(stored);
  return parsed.success ? parsed.data : undefined;
}

export async function saveTimeline(timeline: Timeline): Promise<void> {
  await (await db()).put(STORE, timeline);
}

export async function deleteTimeline(id: string): Promise<void> {
  await (await db()).delete(STORE, id);
}

/** Wipes every timeline and every app setting from this browser. */
export async function deleteAllData(): Promise<void> {
  await (await db()).clear(STORE);
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(LOCAL_STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable: nothing stored there.
  }
}

/** Asks the browser not to evict our storage under pressure. Best effort. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
