import { sortEvents } from '../model/factory';
import { ageAt, toDecimalYear, todayAsFuzzyDate } from '../model/fuzzyDate';
import { MAX_VALENCE, MIN_VALENCE, type LifeEvent, type Timeline } from '../model/schema';

export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 440;

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
}

const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50];
const MAX_LABEL_CHARS = 24;

export const truncate = (s: string, max = MAX_LABEL_CHARS) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

export function computeLayout(
  timeline: Timeline,
  options: {
    width?: number;
    height?: number;
    margins?: GraphMargins;
    now?: Date;
    /** Most year labels on the x axis. Default 12 (desktop); phones pass fewer. */
    maxTicks?: number;
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
  );
  const end = Math.max(latest + 0.5, start + 1);

  const plot = {
    left: m.left,
    right: width - m.right,
    top: m.top,
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

  return { width, height, plot, xTicks, yTicks, birth, events, path };
}
