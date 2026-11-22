export interface GraphPalette {
  background: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  line: string;
  positive: string;
  negative: string;
  neutral: string;
  turningPoint: string;
}

/** On screen: follows the light/dark theme through CSS variables (see index.css). */
export const SCREEN_PALETTE: GraphPalette = {
  background: 'transparent',
  text: 'var(--color-text)',
  muted: 'var(--color-muted)',
  grid: 'var(--graph-grid)',
  axis: 'var(--graph-axis)',
  line: 'var(--color-primary)',
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  neutral: 'var(--graph-neutral)',
  turningPoint: 'var(--graph-turning-point)',
};

/** Exports (PNG/PDF): fixed, print-friendly colours, since files can't read CSS variables. */
export const EXPORT_PALETTE: GraphPalette = {
  background: '#ffffff',
  text: '#2b2b2b',
  muted: '#6b6b6b',
  grid: '#e6e1d8',
  axis: '#9a948a',
  line: '#2f5d62',
  positive: '#4f8a53',
  negative: '#a0524a',
  neutral: '#8a8a8a',
  turningPoint: '#d19a2a',
};
