import { useTranslation } from 'react-i18next';
import type { EventSymbol, Timeline } from '../model/schema';
import { computeLayout, truncate, type PlacedEvent } from './layout';
import type { GraphPalette } from './palette';

const FONT = 'Helvetica, Arial, sans-serif';

interface Props {
  timeline: Timeline;
  palette: GraphPalette;
  /** Fixed pixel size for exports; on screen the SVG scales to its container. */
  fixedSize?: boolean;
  now?: Date;
  onSelectEvent?: (id: string) => void;
}

/**
 * The lifeline: time on the x axis, how good or bad it felt (-5…+5) on the y axis.
 * Uses only inline colours so it can be serialised for PNG/PDF export.
 */
export function LifelineGraph({ timeline, palette: p, fixedSize, now, onSelectEvent }: Props) {
  const { t } = useTranslation();
  const layout = computeLayout(timeline, { now });
  const { width, height, plot } = layout;

  const colorFor = (valence: number) =>
    valence > 0 ? p.positive : valence < 0 ? p.negative : p.neutral;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={fixedSize ? width : '100%'}
      height={fixedSize ? height : undefined}
      role="img"
      aria-label={t('graph.ariaLabel', { title: timeline.title, count: timeline.events.length })}
      fontFamily={FONT}
      className="lifeline-graph"
    >
      <rect x={0} y={0} width={width} height={height} style={{ fill: p.background }} />

      {/* Grid and axes */}
      {layout.xTicks.map((tick) => (
        <g key={tick.year}>
          <line
            x1={tick.x}
            x2={tick.x}
            y1={plot.top}
            y2={plot.bottom}
            style={{ stroke: p.grid, strokeWidth: 1 }}
          />
          <text
            x={tick.x}
            y={plot.bottom + 18}
            textAnchor="middle"
            fontSize={12}
            style={{ fill: p.text }}
          >
            {tick.year}
          </text>
          <text
            x={tick.x}
            y={plot.bottom + 33}
            textAnchor="middle"
            fontSize={10}
            style={{ fill: p.muted }}
          >
            {t('graph.age', { age: tick.age })}
          </text>
        </g>
      ))}
      {layout.yTicks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={plot.left}
            x2={plot.right}
            y1={tick.y}
            y2={tick.y}
            style={{
              stroke: tick.value === 0 ? p.axis : p.grid,
              strokeWidth: tick.value === 0 ? 1.5 : 1,
            }}
          />
          <text
            x={plot.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={12}
            style={{ fill: p.muted }}
          >
            {tick.value > 0 ? `+${tick.value}` : tick.value}
          </text>
        </g>
      ))}
      {/* Rotated axis captions in the left margin */}
      <text
        x={0}
        y={0}
        transform={`translate(16 ${(plot.top + plot.zeroY) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={11}
        style={{ fill: p.muted }}
      >
        {t('graph.highs')}
      </text>
      <text
        x={0}
        y={0}
        transform={`translate(16 ${(plot.zeroY + plot.bottom) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={11}
        style={{ fill: p.muted }}
      >
        {t('graph.lows')}
      </text>

      {/* Spans for events with an end date */}
      {layout.events
        .filter((e) => e.xEnd !== undefined)
        .map((e) => (
          <line
            key={`span-${e.event.id}`}
            x1={e.x}
            x2={e.xEnd}
            y1={e.y}
            y2={e.y}
            style={{
              stroke: colorFor(e.event.valence),
              strokeWidth: 6,
              strokeLinecap: 'round',
              opacity: 0.35,
            }}
          />
        ))}

      {/* The lifeline itself */}
      <path
        d={layout.path}
        style={{ fill: 'none', stroke: p.line, strokeWidth: 2.5, strokeLinejoin: 'round' }}
      />
      <circle
        cx={layout.birth.x}
        cy={layout.birth.y}
        r={4}
        style={{ fill: p.background, stroke: p.line, strokeWidth: 2 }}
      />

      {layout.events.map((placed) => (
        <EventMarker
          key={placed.event.id}
          placed={placed}
          color={colorFor(placed.event.valence)}
          palette={p}
          onSelect={onSelectEvent}
        />
      ))}

      {timeline.events.length === 0 && (
        <text
          x={(plot.left + plot.right) / 2}
          y={plot.top + 40}
          textAnchor="middle"
          fontSize={14}
          style={{ fill: p.muted }}
        >
          {t('graph.empty')}
        </text>
      )}
    </svg>
  );
}

function EventMarker({
  placed,
  color,
  palette,
  onSelect,
}: {
  placed: PlacedEvent;
  color: string;
  palette: GraphPalette;
  onSelect?: (id: string) => void;
}) {
  const { event, x, y, label } = placed;
  const interactive = Boolean(onSelect);
  return (
    <g
      className={interactive ? 'graph-event interactive' : 'graph-event'}
      onClick={interactive ? () => onSelect?.(event.id) : undefined}
    >
      <title>{event.title}</title>
      {event.isTurningPoint && (
        <circle
          cx={x}
          cy={y}
          r={11}
          style={{ fill: 'none', stroke: palette.turningPoint, strokeWidth: 2.5 }}
        />
      )}
      <SymbolShape
        symbol={event.symbol ?? null}
        x={x}
        y={y}
        color={color}
        stroke={palette.background}
      />
      <text
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        fontSize={11}
        style={{ fill: palette.text }}
      >
        {truncate(event.title)}
      </text>
    </g>
  );
}

function SymbolShape({
  symbol,
  x,
  y,
  color,
  stroke,
}: {
  symbol: EventSymbol | null;
  x: number;
  y: number;
  color: string;
  stroke: string;
}) {
  const style = { fill: color, stroke, strokeWidth: 1.5 };
  switch (symbol) {
    case 'flower': {
      const petals = [0, 72, 144, 216, 288].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={x + Math.cos(r) * 4.5}
            cy={y + Math.sin(r) * 4.5}
            r={3.5}
            style={style}
          />
        );
      });
      return (
        <g>
          {petals}
          <circle cx={x} cy={y} r={2.5} style={{ fill: stroke }} />
        </g>
      );
    }
    case 'stone':
      return (
        <path
          d={`M${x - 7},${y + 3} L${x - 4},${y - 5} L${x + 4},${y - 6} L${x + 7},${y + 1} L${x + 3},${y + 6} L${x - 4},${y + 6} Z`}
          style={style}
        />
      );
    case 'candle':
      return (
        <g>
          <rect x={x - 3} y={y - 3} width={6} height={10} style={style} />
          <path
            d={`M${x},${y - 11} Q${x + 3},${y - 6} ${x},${y - 4} Q${x - 3},${y - 6} ${x},${y - 11} Z`}
            style={style}
          />
        </g>
      );
    case 'stick':
      return (
        <rect
          x={x - 8}
          y={y - 2}
          width={16}
          height={4}
          rx={1}
          transform={`rotate(-30 ${x} ${y})`}
          style={style}
        />
      );
    case 'star': {
      const points = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 8 : 3.5;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
      }).join(' ');
      return <polygon points={points} style={style} />;
    }
    default:
      return <circle cx={x} cy={y} r={6} style={style} />;
  }
}
