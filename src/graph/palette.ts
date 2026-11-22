export interface GraphPalette {
  background: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  /** The lifeline fades from `lineHigh` (top, +5) to `lineLow` (bottom, -5). */
  lineHigh: string;
  lineLow: string;
  /**
   * 'svg': a real SVG gradient (screen; works with CSS variables).
   * 'segments': short solid segments with interpolated hex colours, for exporters
   * (svg2pdf) that can't draw gradient strokes. Requires hex lineHigh/lineLow.
   */
  lineMode: 'svg' | 'segments';
  positive: string;
  negative: string;
  neutral: string;
  turningPoint: string;
}

/** Mixes two #rrggbb colours; t=0 gives `a`, t=1 gives `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const clamped = Math.min(1, Math.max(0, t));
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * clamped)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** On screen: follows the light/dark theme through CSS variables (see theme.css). */
export const SCREEN_PALETTE: GraphPalette = {
  background: 'transparent',
  text: 'var(--color-text)',
  muted: 'var(--color-muted)',
  grid: 'var(--graph-grid)',
  axis: 'var(--graph-axis)',
  lineHigh: 'var(--color-positive)',
  lineLow: 'var(--color-negative)',
  lineMode: 'svg',
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  neutral: 'var(--graph-neutral)',
  turningPoint: 'var(--graph-turning-point)',
};

/**
 * Exports (PNG/PDF): fixed colours from the light theme, since files can't read CSS
 * variables and white paper prints best. Keep in sync with theme.css.
 */
export const EXPORT_PALETTE: GraphPalette = {
  background: '#ffffff',
  text: '#1e2233',
  muted: '#5b6075',
  grid: '#e8e5f0',
  axis: '#a2a6b8',
  lineHigh: '#2f5fc4',
  lineLow: '#c8417a',
  lineMode: 'segments',
  positive: '#2f5fc4',
  negative: '#c8417a',
  neutral: '#8a8fa3',
  turningPoint: '#d99a00',
};
