/**
 * The `.tl` file format: see docs/FILE_FORMAT.md.
 * Everything here runs locally; files are read with the File API and never uploaded.
 */
import { timelineSchema, type Timeline } from '../model/schema';

export const TL_FORMAT = 'lifetimeline';
export const TL_VERSION = 1;
export const TL_EXTENSION = '.tl';
export const TL_MAX_BYTES = 10 * 1024 * 1024;

export type TlErrorCode = 'tooLarge' | 'notJson' | 'notTimelineFile' | 'newerVersion' | 'invalid';

export type TlParseResult = { ok: true; timeline: Timeline } | { ok: false; error: TlErrorCode };

type RawFile = { format: unknown; version: unknown; timeline?: unknown; [key: string]: unknown };

/**
 * Upgrades a file from version N to N+1. Add one entry per breaking format change,
 * plus a fixture in __fixtures__/ and a test.
 */
const migrations: Record<number, (file: RawFile) => RawFile> = {};

export function serializeTimeline(timeline: Timeline, now = new Date()): string {
  const file = {
    format: TL_FORMAT,
    version: TL_VERSION,
    exportedAt: now.toISOString(),
    app: { version: __APP_VERSION__ },
    timeline,
  };
  return JSON.stringify(file, null, 2) + '\n';
}

export function parseTimelineFile(text: string): TlParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'notTimelineFile' };
  }
  let file = data as RawFile;
  if (
    file.format !== TL_FORMAT ||
    typeof file.version !== 'number' ||
    !Number.isInteger(file.version) ||
    file.version < 1
  ) {
    return { ok: false, error: 'notTimelineFile' };
  }
  if (file.version > TL_VERSION) return { ok: false, error: 'newerVersion' };

  for (let v = file.version; v < TL_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) return { ok: false, error: 'invalid' };
    file = migrate(file);
  }

  const parsed = timelineSchema.safeParse(file.timeline);
  return parsed.success ? { ok: true, timeline: parsed.data } : { ok: false, error: 'invalid' };
}

export async function readTimelineFile(file: File): Promise<TlParseResult> {
  if (file.size > TL_MAX_BYTES) return { ok: false, error: 'tooLarge' };
  return parseTimelineFile(await file.text());
}

/** "My life!" exported on 2026-11-22 → "my-life-2026-11-22" (extension added by caller). */
export function baseFileName(title: string, now = new Date()): string {
  const slug =
    title
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'timeline';
  return `${slug}-${now.toISOString().slice(0, 10)}`;
}
