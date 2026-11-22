import { sortEvents } from '../model/factory';
import { ageAt, toDecimalYear, todayAsFuzzyDate } from '../model/fuzzyDate';
import { chapterColor, periodRange, rangeEnd, sortPeriods } from '../model/periods';
import {
  MAX_VALENCE,
  MIN_VALENCE,
  type LifeEvent,
  type LifePeriod,
  type Timeline,
} from '../model/schema';

export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 440;
const DEFAULT_RIBBON_HEIGHT = 17;

export interface GraphMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_MARGINS: GraphMargins = { top: 40, right: 30, bottom: 44, left: 60 };

export interface PlacedEvent {
  event: LifeEvent;
  x: number;
  y: number;
  /** End of a time span, if the event has one. */
  xEnd?: number;
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

export interface ChapterBand {
  id: string;
  name: string;
  color: string;
  x: number;
  width: number;
  /** The tinted background always spans the full height: height on the graph means feeling. */
  y: number;
  height: number;
  /** The named ribbon above the graph. Overlapping chapters use separate rows. */
  ribbonY: number;
  ribbonHeight: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  plot: { left: number; right: number; top: number; bottom: number; zeroY: number };
  xTicks: { x: number; year: number; age: number }[];
  yTicks: { y: number; value: number }[];
  birth: { x: number; y: number };
  events: PlacedEvent[];
  /** SVG path through birth and every event, in chronological order. */
  path: string;
  bands: ChapterBand[];
  /** Where the chapter ribbons end (0 without chapters). */
  ribbonBottom: number;
}

const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50];
const MAX_LABEL_CHARS = 24;

export const truncate = (s: string, max = MAX_LABEL_CHARS) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

/** Clips chapters to the visible years and gives overlapping ones separate ribbon rows. */
function placeChapters(periods: LifePeriod[], domain: { start: number; end: number }, now?: Date) {
  const rowEnds: number[] = [];
  const placed = sortPeriods(periods).flatMap((period, index) => {
    const range = periodRange(period, now);
    const start = Math.max(range.start, domain.start);
    const end = Math.min(range.end, domain.end);
    if (end <= start) return [];
    const free = rowEnds.findIndex((rowEnd) => rowEnd <= start);
    const row = free >= 0 ? free : rowEnds.length;
    rowEnds[row] = end;
    return [{ period, color: chapterColor(period, index), start, end, row }];
  });
  return { placed, rows: rowEnds.length };
}

export function computeLayout(
  timeline: Timeline,
  options: {
    width?: number;
    height?: number;
    margins?: GraphMargins;
    now?: Date;
    /** Most year labels on the x axis. Default 12 (desktop); phones pass fewer. */
    maxTicks?: number;
    /** Height of one row of chapter names above the graph. */
    ribbonHeight?: number;
  } = {},
): GraphLayout {
  const width = options.width ?? GRAPH_WIDTH;
  const height = options.height ?? GRAPH_HEIGHT;
  const m = options.margins ?? DEFAULT_MARGINS;
  const birthDate = timeline.person.birthDate;
  const sorted = sortEvents(timeline.events);

  const start = toDecimalYear({ ...birthDate, approx: false }) - (birthDate.month ? 0 : 0.5);
  const latest = Math.max(
    toDecimalYear(todayAsFuzzyDate(options.now)),
    ...sorted.map((e) => toDecimalYear(e.end ?? e.start)),
    ...timeline.periods.flatMap((p) => (p.end ? [rangeEnd(p.end)] : [])),
  );
  const end = Math.max(latest + 0.5, start + 1);

  const chapters = placeChapters(timeline.periods, { start, end }, options.now);
  const ribbonHeight = options.ribbonHeight ?? DEFAULT_RIBBON_HEIGHT;
  const ribbonBottom = chapters.rows * ribbonHeight;

  const plot = {
    left: m.left,
    right: width - m.right,
    top: m.top + ribbonBottom,
    bottom: height - m.bottom,
    zeroY: 0,
  };
  const x = (year: number) =>
    plot.left + ((year - start) / (end - start)) * (plot.right - plot.left);
  const y = (valence: number) =>
    plot.bottom -
    ((valence - MIN_VALENCE) / (MAX_VALENCE - MIN_VALENCE)) * (plot.bottom - plot.top);
  plot.zeroY = y(0);

  const span = end - start;
  const maxTicks = options.maxTicks ?? 12;
  const step = TICK_STEPS.find((s) => span / s <= maxTicks) ?? 100;
  const xTicks: GraphLayout['xTicks'] = [];
  for (let year = Math.ceil(start / step) * step; year <= end; year += step) {
    xTicks.push({ x: x(year), year, age: ageAt(birthDate, { year }) });
  }

  const yTicks = [MIN_VALENCE, 0, MAX_VALENCE].map((value) => ({ y: y(value), value }));
  const birth = { x: x(start), y: plot.zeroY };

  const events: PlacedEvent[] = sorted.map((event, i) => {
    const px = x(toDecimalYear(event.start));
    const py = y(event.valence);
    // Labels go away from the zero line, staggered to reduce overlaps, but flip to the
    // other side when they would run into the axis labels.
    const offset = 14 + (i % 2) * 14;
    const fitsAbove = py - offset >= plot.top - 26;
    const fitsBelow = py + offset + 8 <= plot.bottom - 4;
    const above = event.valence >= 0 ? fitsAbove || !fitsBelow : !fitsBelow;
    const anchor = px < plot.left + 60 ? 'start' : px > plot.right - 60 ? 'end' : 'middle';
    return {
      event,
      x: px,
      y: py,
      xEnd: event.end ? x(toDecimalYear(event.end)) : undefined,
      label: {
        x: px,
        y: Math.min(
          Math.max(above ? py - offset : py + offset + 8, plot.top - 26),
          plot.bottom - 4,
        ),
        anchor,
      },
    };
  });

  const points = [birth, ...events];
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const bands: ChapterBand[] = chapters.placed.map((c) => ({
    id: c.period.id,
    name: c.period.name,
    color: c.color,
    x: x(c.start),
    width: x(c.end) - x(c.start),
    y: plot.top,
    height: plot.bottom - plot.top,
    ribbonY: c.row * ribbonHeight,
    ribbonHeight: ribbonHeight - 2,
  }));

  return { width, height, plot, xTicks, yTicks, birth, events, path, bands, ribbonBottom };
}
