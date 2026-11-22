import { useRef } from 'react';
import { CompactGraphSection } from '../components/CompactGraphSection';
import { COMPACT_BREAKPOINT } from '../graph/CompactLifelineGraph';
import { LifelineGraph } from '../graph/LifelineGraph';
import { SCREEN_PALETTE } from '../graph/palette';
import { useElementWidth } from '../graph/useElementWidth';
import type { Timeline } from '../model/schema';

/** Read-only lifeline that uses the phone layout on narrow screens. */
export function ExampleGraph({ timeline }: { timeline: Timeline }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  return (
    <div className="graph-container" ref={ref}>
      {width !== null && width < COMPACT_BREAKPOINT ? (
        <CompactGraphSection timeline={timeline} width={width} />
      ) : (
        <LifelineGraph timeline={timeline} palette={SCREEN_PALETTE} />
      )}
    </div>
  );
}
