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
const LABEL_CHAR_WIDTH = 6.2;
const LABEL_ASCENT = 10;
const LABEL_DESCENT = 3;
/** Label baseline above its marker when it sits in its own reserved spot. */
const LABEL_OFFSET = 14;
const MARKER_RADIUS = 12;
const LANE_GAP = 6;
const DEFAULT_LANE_HEIGHT = 36;
/** Keeps levels far enough apart for one row of marker and label each. */
const MIN_LABELLED_PLOT_HEIGHT = 356;

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

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Horizontal extent of a label, estimated so that no text measuring is needed. */
function labelExtent(title: string, x: number, anchor: PlacedEvent['label']['anchor']) {
  const width = truncate(title).length * LABEL_CHAR_WIDTH;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  return { left, right: left + width };
}

const labelBox = (title: string, x: number, y: number, anchor: PlacedEvent['label']['anchor']) => ({
  ...labelExtent(title, x, anchor),
  top: y - LABEL_ASCENT,
  bottom: y + LABEL_DESCENT,
});

/** Splits each feeling level into rows so that items sharing a level never collide. */
function assignLanes(items: { id: string; valence: number; left: number; right: number }[]) {
  const rowEnds = new Map<number, number[]>();
  const lanes = new Map<string, number>();
  for (const item of [...items].sort((a, b) => a.left - b.left)) {
    const ends = rowEnds.get(item.valence) ?? [];
    const free = ends.findIndex((end) => end + LANE_GAP <= item.left);
    const lane = free >= 0 ? free : ends.length;
    ends[lane] = item.right;
    rowEnds.set(item.valence, ends);
    lanes.set(item.id, lane);
  }
  return { lanes, laneCount: (valence: number) => rowEnds.get(valence)?.length ?? 1 };
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
    /** False when titles are not drawn (phones), so only markers and spans need room. */
    labels?: boolean;
    /** Height of each extra row in a crowded level. */
    laneHeight?: number;
  } = {},
): GraphLayout {
  const width = options.width ?? GRAPH_WIDTH;
  const baseHeight = options.height ?? GRAPH_HEIGHT;
  const m = options.margins ?? DEFAULT_MARGINS;
  const showLabels = options.labels ?? true;
  const laneHeight = options.laneHeight ?? DEFAULT_LANE_HEIGHT;
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

  const plotLeft = m.left;
  const plotRight = width - m.right;
  const x = (year: number) => plotLeft + ((year - start) / (end - start)) * (plotRight - plotLeft);

  // Horizontal footprint of each item: its marker, its time span and its title.
  const horizontal = sorted.map((event) => {
    const px = x(toDecimalYear(event.start));
    const xEnd = event.end ? x(toDecimalYear(event.end)) : undefined;
    const anchor: PlacedEvent['label']['anchor'] =
      px < plotLeft + 60 ? 'start' : px > plotRight - 60 ? 'end' : 'middle';
    const label = showLabels ? labelExtent(event.title, px, anchor) : { left: px, right: px };
    return {
      event,
      px,
      xEnd,
      anchor,
      left: Math.min(px - MARKER_RADIUS, label.left),
      right: Math.max((xEnd ?? px) + MARKER_RADIUS, label.right),
    };
  });
  const { lanes, laneCount } = assignLanes(
    horizontal.map((h) => ({
      id: h.event.id,
      valence: h.event.valence,
      left: h.left,
      right: h.right,
    })),
  );

  // Crowded levels get extra height; the rest of the scale keeps its spacing.
  const levels = Array.from({ length: MAX_VALENCE - MIN_VALENCE + 1 }, (_, i) => MIN_VALENCE + i);
  const extraFor = (valence: number) => (laneCount(valence) - 1) * laneHeight;
  const totalExtra = levels.reduce((sum, level) => sum + extraFor(level), 0);
  const minPlotHeight = showLabels ? MIN_LABELLED_PLOT_HEIGHT : 0;
  const height = Math.max(baseHeight, m.top + ribbonBottom + minPlotHeight + m.bottom) + totalExtra;

  const plot = {
    left: plotLeft,
    right: plotRight,
    top: m.top + ribbonBottom,
    bottom: height - m.bottom,
    zeroY: 0,
  };
  const scaleHeight = plot.bottom - plot.top - totalExtra;
  /** Centre of a level, after the extra height of every level below it. */
  const y = (valence: number) => {
    const below = levels.reduce((sum, l) => (l < valence ? sum + extraFor(l) : sum), 0);
    return (
      plot.bottom -
      ((valence - MIN_VALENCE) / (MAX_VALENCE - MIN_VALENCE)) * scaleHeight -
      below -
      extraFor(valence) / 2
    );
  };
  plot.zeroY = y(0);

  const span = end - start;
  const maxTicks = options.maxTicks ?? 12;
  const step = TICK_STEPS.find((s) => span / s <= maxTicks) ?? 100;
  const xTicks: GraphLayout['xTicks'] = [];
  for (let year = Math.ceil(start / step) * step; year <= end; year += step) {
    xTicks.push({ x: x(year), year, age: ageAt(birthDate, { year }) });
  }

  // Expanded levels are labelled too, so their rows can still be read as one level.
  const yTicks = levels
    .filter(
      (level) =>
        level === MIN_VALENCE || level === 0 || level === MAX_VALENCE || extraFor(level) > 0,
    )
    .map((value) => ({ y: y(value), value }));
  const birth = { x: x(start), y: plot.zeroY };

  const positioned = horizontal.map((h) => {
    const lane = lanes.get(h.event.id) ?? 0;
    const py = y(h.event.valence) + (lane - (laneCount(h.event.valence) - 1) / 2) * laneHeight;
    return { ...h, py };
  });

  // Every item owns the spot right above its marker. A title may use its usual staggered
  // position only if that is clear of everything else; otherwise it falls back to its own spot.
  const ownSpots = positioned.map((p) =>
    labelBox(p.event.title, p.px, p.py - LABEL_OFFSET, p.anchor),
  );
  const obstacles = positioned.map((p) => [
    {
      left: p.px - MARKER_RADIUS,
      right: p.px + MARKER_RADIUS,
      top: p.py - MARKER_RADIUS,
      bottom: p.py + MARKER_RADIUS,
    },
    ...(p.xEnd === undefined
      ? []
      : [{ left: p.px, right: p.xEnd, top: p.py - 3, bottom: p.py + 3 }]),
  ]);
  const placedLabels: Box[] = [];

  const events: PlacedEvent[] = positioned.map(({ event, px, py, xEnd, anchor }, i) => {
    // Labels go away from the zero line, staggered to reduce overlaps, but flip to the
    // other side when they would run into the axis labels.
    const offset = 14 + (i % 2) * 14;
    const fitsAbove = py - offset >= plot.top - 26;
    const fitsBelow = py + offset + 8 <= plot.bottom - 4;
    const above = event.valence >= 0 ? fitsAbove || !fitsBelow : !fitsBelow;
    let labelY = Math.min(
      Math.max(above ? py - offset : py + offset + 8, plot.top - 26),
      plot.bottom - 4,
    );
    if (showLabels) {
      const preferred = labelBox(event.title, px, labelY, anchor);
      const blocked =
        obstacles.some((boxes, j) => j !== i && boxes.some((box) => overlaps(preferred, box))) ||
        ownSpots.some((box, j) => j !== i && overlaps(preferred, box)) ||
        placedLabels.some((box) => overlaps(preferred, box));
      if (blocked) labelY = py - LABEL_OFFSET;
      placedLabels.push(labelBox(event.title, px, labelY, anchor));
    }
    return { event, x: px, y: py, xEnd, label: { x: px, y: labelY, anchor } };
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
