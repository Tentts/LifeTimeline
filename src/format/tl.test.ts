import { createTimeline } from '../model/factory';
import v1Fixture from './__fixtures__/v1.tl?raw';
import {
  baseFileName,
  parseTimelineFile,
  readTimelineFile,
  serializeTimeline,
  TL_MAX_BYTES,
  TL_VERSION,
} from './tl';

const sample = () => {
  const t = createTimeline({ title: 'My life', birthDate: { year: 1990, month: 4 } });
  t.events.push({
    id: 'e1',
    title: 'First day of school',
    start: { year: 1996, month: 9 },
    valence: 2,
    symbol: 'flower',
    tags: ['education'],
    people: ['Ms. Smith'],
  });
  return t;
};

describe('.tl format', () => {
  it('round-trips a timeline', () => {
    const timeline = sample();
    const result = parseTimelineFile(serializeTimeline(timeline));
    expect(result).toEqual({ ok: true, timeline });
  });

  it('writes the format header', () => {
    const file = JSON.parse(serializeTimeline(sample()));
    expect(file.format).toBe('lifetimeline');
    expect(file.version).toBe(TL_VERSION);
    expect(typeof file.app.version).toBe('string');
  });

  it('reads the v1 fixture', () => {
    const result = parseTimelineFile(v1Fixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.timeline.events).toHaveLength(2);
      expect(result.timeline.events[1].tags).toEqual(['family']);
    }
  });

  it.each([
    ['not JSON', 'hello', 'notJson'],
    ['an array', '[]', 'notTimelineFile'],
    ['another JSON file', '{"name":"package"}', 'notTimelineFile'],
    ['a newer version', '{"format":"lifetimeline","version":999}', 'newerVersion'],
    ['a broken timeline', '{"format":"lifetimeline","version":1,"timeline":{}}', 'invalid'],
  ])('rejects %s', (_, text, error) => {
    expect(parseTimelineFile(text)).toEqual({ ok: false, error });
  });

  it('rejects out-of-range values', () => {
    const file = JSON.parse(serializeTimeline(sample()));
    file.timeline.events[0].valence = 9;
    expect(parseTimelineFile(JSON.stringify(file))).toEqual({ ok: false, error: 'invalid' });
  });

  it('drops unknown fields', () => {
    const file = JSON.parse(serializeTimeline(sample()));
    file.timeline.events[0].script = '<img onerror=alert(1)>';
    const result = parseTimelineFile(JSON.stringify(file));
    expect(result.ok && 'script' in result.timeline.events[0]).toBe(false);
  });

  it('refuses files over the size limit without reading them', async () => {
    const big = new File(['x'], 'big.tl');
    Object.defineProperty(big, 'size', { value: TL_MAX_BYTES + 1 });
    await expect(readTimelineFile(big)).resolves.toEqual({ ok: false, error: 'tooLarge' });
  });

  it('builds safe file names', () => {
    const now = new Date('2026-11-22T12:00:00Z');
    expect(baseFileName('Mi vida: año 1!', now)).toBe('mi-vida-ano-1-2026-11-22');
    expect(baseFileName('???', now)).toBe('timeline-2026-11-22');
  });
});
