import { truncate, type ChapterBand } from './layout';

const BAND_OPACITY = 0.13;
const RIBBON_OPACITY = 0.34;
const EDGE_WIDTH = 3;
const CHAR_WIDTH = 0.58; // average character width, relative to the font size
const MIN_LABEL_CHARS = 3;

/**
 * Chapters on the graph: a tint behind the lifeline plus a named ribbon above it. Renders
 * nothing without chapters and never catches clicks or taps, so events stay selectable.
 * Inline styles keep it exportable.
 */
export function ChapterBands({
  bands,
  textColor,
  fontSize = 11,
}: {
  bands: ChapterBand[];
  textColor: string;
  fontSize?: number;
}) {
  if (bands.length === 0) return null;
  return (
    <g pointerEvents="none">
      {bands.map((band) => {
        const chars = Math.floor((band.width - EDGE_WIDTH - 6) / (fontSize * CHAR_WIDTH));
        return (
          <g key={band.id}>
            <rect
              x={band.x}
              y={band.y}
              width={band.width}
              height={band.height}
              style={{ fill: band.color, fillOpacity: BAND_OPACITY }}
            />
            <rect
              x={band.x}
              y={band.ribbonY}
              width={band.width}
              height={band.ribbonHeight}
              style={{ fill: band.color, fillOpacity: RIBBON_OPACITY }}
            />
            <rect
              x={band.x}
              y={band.ribbonY}
              width={Math.min(EDGE_WIDTH, band.width)}
              height={band.ribbonHeight}
              style={{ fill: band.color }}
            />
            {chars >= MIN_LABEL_CHARS && (
              <text
                x={band.x + EDGE_WIDTH + 3}
                y={band.ribbonY + band.ribbonHeight / 2 + fontSize * 0.36}
                fontSize={fontSize}
                fontWeight="bold"
                style={{ fill: textColor }}
              >
                {truncate(band.name, chars)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
