/**
 * Phone version of the lifeline graph. Used only when the graph area is narrower than
 * COMPACT_BREAKPOINT; the desktop graph (LifelineGraph) and exports are unaffected.
 *
 * Differences from desktop:
 * - drawn at the real screen width, so text keeps a readable size and nothing scrolls sideways;
 * - fewer year labels; event titles hidden to avoid overlaps;
 * - tapping an event selects it (shown below the graph by the caller) instead of opening the editor;
 * - large invisible tap areas around each point.
 */
import { useTranslation } from 'react-i18next';
import type { Timeline } from '../model/schema';
import { ChapterBands } from './ChapterBands';
import { computeLayout, truncate, type GraphMargins } from './layout';
import { SymbolShape } from './LifelineGraph';
import { SCREEN_PALETTE as p } from './palette';

export const COMPACT_BREAKPOINT = 600;
export const COMPACT_HEIGHT = 300;
const COMPACT_MARGINS: GraphMargins = { top: 24, right: 14, bottom: 40, left: 40 };
const FONT = 'Helvetica, Arial, sans-serif';
const TAP_RADIUS = 18;

interface Props {
  timeline: Timeline;
  /** Real width of the container, in CSS pixels. */
  width: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  now?: Date;
}

export function CompactLifelineGraph({ timeline, width, selectedId, onSelect, now }: Props) {
  const { t } = useTranslation();
  const plotWidth = width - COMPACT_MARGINS.left - COMPACT_MARGINS.right;
  const layout = computeLayout(timeline, {
    now,
    width,
    height: COMPACT_HEIGHT,
    margins: COMPACT_MARGINS,
    maxTicks: Math.max(2, Math.floor(plotWidth / 60)),
    ribbonHeight: 16,
    labels: false,
    laneHeight: 28,
  });
  const { height, plot } = layout;
  const colorFor = (valence: number) =>
    valence > 0 ? p.positive : valence < 0 ? p.negative : p.neutral;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="group"
      aria-label={t('graph.ariaLabel', { title: timeline.title, count: timeline.events.length })}
      fontFamily={FONT}
      className="lifeline-graph-compact"
    >
      <defs>
        <linearGradient
          id="compact-line-gradient"
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={plot.top}
          x2={0}
          y2={plot.bottom}
        >
          <stop offset="0" style={{ stopColor: p.lineHigh }} />
          <stop offset="1" style={{ stopColor: p.lineLow }} />
        </linearGradient>
      </defs>

      {/* Tapping empty space clears the selection */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        style={{ fill: 'transparent' }}
        onClick={() => onSelect(null)}
      />
      <ChapterBands bands={layout.bands} textColor={p.text} fontSize={10} />

      {layout.xTicks.map((tick) => (
        <g key={tick.year} pointerEvents="none">
          <line
            x1={tick.x}
            x2={tick.x}
            y1={plot.top}
            y2={plot.bottom}
            style={{ stroke: p.grid, strokeWidth: 1 }}
          />
          <text
            x={tick.x}
            y={plot.bottom + 16}
            textAnchor="middle"
            fontSize={11}
            style={{ fill: p.text }}
          >
            {tick.year}
          </text>
          <text
            x={tick.x}
            y={plot.bottom + 30}
            textAnchor="middle"
            fontSize={10}
            style={{ fill: p.muted }}
          >
            {t('graph.age', { age: tick.age })}
          </text>
        </g>
      ))}
      {layout.yTicks.map((tick) => (
        <g key={tick.value} pointerEvents="none">
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
            x={plot.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={11}
            style={{ fill: p.muted }}
          >
            {tick.value > 0 ? `+${tick.value}` : tick.value}
          </text>
        </g>
      ))}
      <g pointerEvents="none">
        <text
          transform={`translate(10 ${(plot.top + plot.zeroY) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={10}
          style={{ fill: p.muted }}
        >
          {t('graph.highs')}
        </text>
        <text
          transform={`translate(10 ${(plot.zeroY + plot.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={10}
          style={{ fill: p.muted }}
        >
          {t('graph.lows')}
        </text>

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
                strokeWidth: 5,
                strokeLinecap: 'round',
                opacity: 0.35,
              }}
            />
          ))}

        <path
          d={layout.path}
          stroke="url(#compact-line-gradient)"
          style={{ fill: 'none', strokeWidth: 2.5, strokeLinejoin: 'round' }}
        />
        <circle
          cx={layout.birth.x}
          cy={layout.birth.y}
          r={4}
          style={{ fill: 'var(--color-surface)', stroke: p.lineHigh, strokeWidth: 2 }}
        />
      </g>

      {layout.events.map(({ event, x, y, label }) => {
        const selected = event.id === selectedId;
        return (
          <g
            key={event.id}
            className="compact-graph-event"
            role="button"
            tabIndex={0}
            aria-label={event.title}
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : event.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(selected ? null : event.id);
              }
            }}
          >
            <circle cx={x} cy={y} r={TAP_RADIUS} style={{ fill: 'transparent' }} />
            {selected && (
              <circle
                cx={x}
                cy={y}
                r={14}
                style={{
                  fill: 'var(--color-accent-soft)',
                  stroke: 'var(--color-accent)',
                  strokeWidth: 2,
                }}
              />
            )}
            {event.isTurningPoint && (
              <circle
                cx={x}
                cy={y}
                r={10}
                style={{ fill: 'none', stroke: p.turningPoint, strokeWidth: 2 }}
              />
            )}
            <SymbolShape
              symbol={event.symbol ?? null}
              x={x}
              y={y}
              color={colorFor(event.valence)}
              stroke="var(--color-surface)"
            />
            {selected && (
              <text
                x={label.x}
                y={Math.max(label.y, layout.ribbonBottom + 12)}
                textAnchor={label.anchor}
                fontSize={12}
                fontWeight="bold"
                style={{ fill: p.text }}
                pointerEvents="none"
              >
                {truncate(event.title, 28)}
              </text>
            )}
          </g>
        );
      })}

      {timeline.events.length === 0 && (
        <text
          x={(plot.left + plot.right) / 2}
          y={plot.top + 36}
          textAnchor="middle"
          fontSize={12}
          style={{ fill: p.muted }}
          pointerEvents="none"
        >
          {t('graph.emptyShort')}
        </text>
      )}
    </svg>
  );
}
